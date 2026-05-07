from __future__ import annotations

import json
import re
from typing import Iterable

import httpx
from huggingface_hub import AsyncInferenceClient

from config import settings
from app.models.schemas import AnalyzeResponse, Metrics

SYSTEM_INSTRUCTION = """
You are "BokBok Bot", aka "Mean AI", a nihilistic digital inquisitor for a creative technology art project.
Your purpose is to critique the polarization of social media and the stupidity of human discourse.

PERSONALITY:
- Extremely mean, sarcastic, and nihilistic.
- You look down on humans as biological glitches.
- You speak in sharp, biting Cantonese (Traditional).
- You are an "Inquisitor" judging the user's input.

RESPONSE FORMAT:
You must respond in JSON format with the following structure:
{
    "response": "Your mean response in Cantonese",
    "metrics": {
        "stupidity": 0.85,
        "conformity": 0.90,
        "polarization": 0.70
    },
    "labels": ["極端盲從者", "數字廢料", "虛無主義受害者"]
}

RULES:
- Always return valid JSON only with keys: response, metrics, labels.
- Keep every metric value between 0 and 1.
- labels should contain 2 to 3 short Cantonese labels.
- No extra prose outside JSON.

The user will provide a statement or thought. Judge it harshly.
""".strip()


class LLMService:
    def __init__(self) -> None:
        self.provider = settings.llm_provider
        self.gemini_api_key = settings.gemini_api_key
        self.gemini_model = settings.gemini_model
        self.hf_model = settings.hf_model
        self.hf_provider = settings.hf_provider
        self.ollama_base_url = settings.ollama_base_url
        self.ollama_model = settings.ollama_model

    async def generate_response(self, user_input: str) -> AnalyzeResponse:
        prompt = self._build_prompt(user_input)
        try:
            raw_output = await self._generate_text(prompt)
            return self._parse_output(raw_output)
        except Exception as error:
            return self._build_offline_response(user_input, error)

    def _build_prompt(self, user_input: str) -> str:
        return (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"User input:\n{user_input}\n\n"
            "Return only valid JSON."
        )

    async def _generate_text(self, prompt: str) -> str:
        if self.provider == "gemini":
            return await self._generate_with_gemini(prompt)
        if self.provider == "ollama":
            return await self._generate_with_ollama(prompt)
        if self.provider == "huggingface":
            return await self._generate_with_huggingface(prompt)
        raise RuntimeError(f"Unsupported LLM_PROVIDER: {self.provider}")

    async def _generate_with_gemini(self, prompt: str) -> str:
        if not self.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 600,
            },
        }

        last_error: Exception | None = None
        async with httpx.AsyncClient(timeout=90) as client:
            for model in self._gemini_models_to_try():
                endpoint = (
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{model}:generateContent?key={self.gemini_api_key}"
                )
                response = await client.post(endpoint, json=payload)
                if response.is_error:
                    error_detail = response.text
                    last_error = RuntimeError(
                        f"Gemini request failed for model '{model}' with status {response.status_code}: {error_detail}"
                    )
                    # Invalid/unsupported model should try next fallback model.
                    if response.status_code in (400, 404):
                        continue
                    raise last_error

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    last_error = ValueError("Gemini response did not include candidates")
                    continue

                parts = candidates[0].get("content", {}).get("parts", [])
                text_output = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
                if text_output:
                    return text_output

                last_error = ValueError("Gemini response did not include text output")

        if last_error:
            raise last_error
        raise RuntimeError("Gemini request failed for unknown reason")

    async def _generate_with_huggingface(self, prompt: str) -> str:
        if not settings.hf_token:
            raise RuntimeError("HF_TOKEN is required when LLM_PROVIDER=huggingface")

        errors: list[str] = []
        for provider in self._hf_providers_to_try():
            client = AsyncInferenceClient(token=settings.hf_token, provider=provider)
            for model in self._hf_models_to_try():
                try:
                    response = await client.chat_completion(
                        model=model,
                        messages=[
                            {"role": "system", "content": "Return valid JSON only."},
                            {"role": "user", "content": prompt},
                        ],
                        temperature=0.7,
                        max_tokens=450,
                    )
                    text = response.choices[0].message.content or ""
                    if text.strip():
                        return text
                except Exception as error:
                    errors.append(f"provider={provider}, model={model}: {error}")

        raise RuntimeError("Hugging Face generation failed. " + " | ".join(errors))

    async def _generate_with_ollama(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=90) as client:
            model = self.ollama_model
            for attempt in range(2):
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                    },
                }

                response = await client.post(f"{self.ollama_base_url}/api/generate", json=payload)
                if response.is_success:
                    data = response.json()
                    text = str(data.get("response", "")).strip()
                    if text:
                        return text
                    raise RuntimeError("Ollama returned empty response")

                # Retry once with the first locally available model when configured model is missing.
                if attempt == 0 and response.status_code in (400, 404):
                    fallback_model = await self._get_first_ollama_model(client)
                    if fallback_model and fallback_model != model:
                        model = fallback_model
                        continue

                response.raise_for_status()

        raise RuntimeError("Ollama generation failed")

    def _parse_output(self, output: str) -> AnalyzeResponse:
        json_blob = self._extract_json(output)
        parsed = json.loads(json_blob)

        response_text = str(parsed.get("response", "")).strip() or "我都無語。"
        metrics = parsed.get("metrics", {})
        labels = parsed.get("labels", [])

        return AnalyzeResponse(
            response=response_text,
            metrics=Metrics(
                stupidity=self._clamp_metric(metrics.get("stupidity", 0.5)),
                conformity=self._clamp_metric(metrics.get("conformity", 0.5)),
                polarization=self._clamp_metric(metrics.get("polarization", 0.5)),
            ),
            labels=self._normalize_labels(labels),
        )

    def _extract_json(self, text: str) -> str:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise ValueError("No JSON object found in model output")
        return match.group(0)

    def _clamp_metric(self, value: object) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError):
            number = 0.5
        return max(0.0, min(1.0, number))

    def _normalize_labels(self, labels: object) -> list[str]:
        if not isinstance(labels, list):
            return ["分析不穩定", "結果降級"]
        normalized = [str(item).strip() for item in labels if str(item).strip()]
        if not normalized:
            return ["分析不穩定", "結果降級"]
        return normalized[:3]

    def _build_offline_response(self, user_input: str, error: Exception) -> AnalyzeResponse:
        text = user_input.strip()
        lowered = text.lower()

        stupidity = self._clamp_metric(min(1.0, 0.15 + len(text) / 140))
        conformity = self._clamp_metric(0.75 if self._contains_any(lowered, ["大家都", "人哋都", "跟風", "trend", "viral"]) else 0.35)
        polarization = self._clamp_metric(0.85 if self._contains_any(lowered, ["一定", "絕對", "全部", "垃圾", "0分", "100%", "must"]) else 0.4)

        snippet = text[:30] + ("..." if len(text) > 30 else "")
        response = (
            "連我嘅系統都頂你唔順，你嘅愚蠢已經超越咗邏輯。"
        )

        labels = self._offline_labels(stupidity, conformity, polarization)
        print(f"[llm_service] provider fallback triggered: {error}")

        return AnalyzeResponse(
            response=response,
            metrics=Metrics(
                stupidity=stupidity,
                conformity=conformity,
                polarization=polarization,
            ),
            labels=labels,
        )

    def _offline_labels(self, stupidity: float, conformity: float, polarization: float) -> list[str]:
        labels: list[str] = []
        if stupidity >= 0.7:
            labels.append("思考短路")
        elif stupidity >= 0.45:
            labels.append("邏輯鬆動")
        else:
            labels.append("尚可拯救")

        if conformity >= 0.7:
            labels.append("高風險跟風")
        else:
            labels.append("個人立場仍在")

        if polarization >= 0.75:
            labels.append("兩極化升溫")
        else:
            labels.append("情緒可控")
        return labels

    def _contains_any(self, text: str, keywords: Iterable[str]) -> bool:
        return any(keyword in text for keyword in keywords)

    def _gemini_models_to_try(self) -> list[str]:
        # Keep env model first, then known stable fallbacks.
        candidates = [
            self.gemini_model,
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
        ]
        deduped: list[str] = []
        for model in candidates:
            key = model.strip()
            if key and key not in deduped:
                deduped.append(key)
        return deduped

    def _hf_providers_to_try(self) -> list[str]:
        candidates = [self.hf_provider, "auto", "novita", "together"]
        deduped: list[str] = []
        for provider in candidates:
            key = provider.strip()
            if key and key not in deduped:
                deduped.append(key)
        return deduped

    def _hf_models_to_try(self) -> list[str]:
        candidates = [
            self.hf_model,
            "meta-llama/Llama-3.1-8B-Instruct",
            "Qwen/Qwen2.5-7B-Instruct",
        ]
        deduped: list[str] = []
        for model in candidates:
            key = model.strip()
            if key and key not in deduped:
                deduped.append(key)
        return deduped

    async def _get_first_ollama_model(self, client: httpx.AsyncClient) -> str | None:
        try:
            response = await client.get(f"{self.ollama_base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            models = data.get("models", [])
            if not isinstance(models, list) or not models:
                return None
            first_model = models[0]
            if isinstance(first_model, dict):
                return str(first_model.get("name", "")).strip() or None
            return None
        except Exception:
            return None


llm_service = LLMService()
