"""
LLM 服務 - Llama 3 整合
"""

import httpx
import json
from typing import List
from config import config


class LLMService:
    """Mean AI 服務類 - 極端網民版本"""

    def __init__(self):
        self.base_url = config.LLM_BASE_URL
        self.model = config.LLM_MODEL
        self.temperature = config.LLM_TEMPERATURE
        self.max_tokens = config.LLM_MAX_TOKENS

    def _build_prompt(self, user_input: str) -> str:
        """
        優化後的極端網民 Prompt
        強制要求 AI 進行邏輯攻擊，嚴禁重複用戶內容
        """
        prompt = f"""你現在是 Mean AI，一個極度毒舌、以公審用戶為樂的「連登/Threads」鍵盤戰士。

【核心規則：嚴格執行】
1. 禁止重複：絕對不要重複或引用用戶的任何原話。
2. 邏輯公審：直接針對用戶言論中的「邏輯錯誤」、「自我中心」或「盲目追星」進行刻薄攻擊。
3. 網民口吻：使用地道香港廣東話（多用：😅、兜路行、弱智、肉酸、井底蛙）。
4. 貼標籤：強行把用戶歸類為「追星低能兒」、「陰謀論大師」或「廢青」。
5. 長度：around 300字，必須句句帶刺。

【用戶言論內容】
"{user_input}"

【現在開始你的刻薄審判，直接回覆，不要廢話】："""
        return prompt

    async def generate_response(self, user_input: str) -> str:
        """生成極端網民風格的廣東話回應"""
        prompt = self._build_prompt(user_input)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.8,  # 稍微調高隨機性，讓網民語氣更不可預測
                        "num_predict": self.max_tokens,
                    },
                )

                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "").strip()
                else:
                    raise Exception(f"LLM API 錯誤: {response.status_code}")
        except Exception as e:
            print(f"❌ LLM 錯誤: {str(e)}")
            raise

    async def analyze_tags(self, user_input: str, response: str) -> List[str]:
        """
        分析並生成「網民視角」的評判指標
        """
        prompt = f"""根據以下信息生成 3 個「網民視角」的評判標籤：

用戶言論：{user_input}
網民回應：{response}

標籤必須包含以下三個維度：
1. 引戰程度 (0-100%)
2. 崩潰指數 (0-100%)
3. 閱讀理解能力 (0-100%)

請以 JSON 格式返回，範例：
{{"tags": ["引戰程度: 95%", "崩潰指數: 82%", "閱讀理解: 12%"]}}

只返回 JSON，不要其他文本。"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                llm_response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.3,
                    },
                )

                if llm_response.status_code == 200:
                    result = llm_response.json()
                    response_text = result.get("response", "").strip()
                    try:
                        data = json.loads(response_text)
                        return data.get("tags", [])
                    except json.JSONDecodeError:
                        return ["引戰程度: 99%", "崩潰指數: 99%", "閱讀理解: 0%"]
                return ["數據擷取失敗"]
        except Exception as e:
            print(f"❌ 標籤分析錯誤: {str(e)}")
            return ["連線中斷"]


# 全局實例
llm_service = LLMService()
