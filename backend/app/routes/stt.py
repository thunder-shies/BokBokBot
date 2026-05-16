import os
import httpx
from fastapi import APIRouter, UploadFile, File
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Using a highly-optimized public Cantonese Whisper pipeline on Hugging Face
API_URL = "https://huggingface.co/openai/whisper-large-v3"
headers = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"}


@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    async with httpx.AsyncClient() as client:
        try:
            # 💡 Send raw audio bytes directly to Hugging Face
            response = await client.post(
                API_URL, headers=headers, content=audio_bytes, timeout=15.0
            )

            if response.status_code == 200:
                result = response.json()
                # Hugging Face usually returns {"text": "recognized string"}
                return {"text": result.get("text", "").strip()}

            return {"text": "[Error: Hugging Face API rate-limited or sleeping]"}
        except Exception as e:
            return {"text": f"[Backend Error: {str(e)}]"}
