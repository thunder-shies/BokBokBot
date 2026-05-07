from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from app.routes import chat, vision


class SuppressVisionAccessLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return "/api/vision/detect-person" not in record.getMessage()


logging.getLogger("uvicorn.access").addFilter(SuppressVisionAccessLogFilter())

app = FastAPI(title="BokBok Bot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": settings.llm_provider}
