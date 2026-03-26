# 後端配置示範

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # FastAPI 配置
    API_TITLE = "Mean AI Backend"
    API_VERSION = "0.1.0"
    API_DESCRIPTION = "高傲的數字審判官 - 後端 API"

    # LLM 配置
    LLM_MODEL = os.getenv("LLM_MODEL", "llama3")
    LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434")
    LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "512"))

    # TTS 配置
    TTS_PROVIDER = os.getenv("TTS_PROVIDER", "edge-tts")
    TTS_VOICE = os.getenv("TTS_VOICE", "zh-HK-WanLungNeural")

    # 對話配置
    MAX_CONVERSATION_LENGTH = int(os.getenv("MAX_CONVERSATION_LENGTH", "10"))
    RESPONSE_TIMEOUT = int(os.getenv("RESPONSE_TIMEOUT", "30"))

    # CORS 配置
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")

    # 數據庫（未來用）
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mean_ai.db")


config = Config()
