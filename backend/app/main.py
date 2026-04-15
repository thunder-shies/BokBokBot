"""
Mean AI Backend - 主應用文件

核心功能：
- FastAPI 應用初始化
- CORS 配置
- 路由集成
- 錯誤處理
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# 配置導入
from config import config

# 路由導入
from app.routes import chat
from app.routes import vision


# 生命週期事件
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動事件
    print("🚀 Mean AI Backend 啟動中...")
    if config.LLM_PROVIDER == "huggingface":
        print(f"📍 LLM 提供者: huggingface ({config.HF_PROVIDER})")
    else:
        print(f"📍 LLM 後端: ollama @ {config.LLM_BASE_URL}")
    print(f"🔊 TTS 提供者: {config.TTS_PROVIDER}")
    yield
    # 關閉事件
    print("🛑 Mean AI Backend 已關閉")


# 應用初始化
app = FastAPI(
    title=config.API_TITLE,
    description=config.API_DESCRIPTION,
    version=config.API_VERSION,
    lifespan=lifespan,
)

# CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 健康檢查端點
@app.get("/health", tags=["System"])
async def health_check():
    """系統健康檢查"""
    return {
        "status": "ok",
        "service": "Mean AI Backend",
        "version": config.API_VERSION,
    }


# 根端點
@app.get("/", tags=["System"])
async def root():
    """根端點"""
    return {
        "message": "歡迎來到 Mean AI 後端",
        "docs": "/docs",
        "health": "/health",
    }


# 路由集成
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(vision.router, prefix="/api/vision", tags=["Vision"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
