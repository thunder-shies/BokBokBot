"""聊天路由：分析、歷史、語音"""

from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.models.schemas import (
    AnalyzeRequest,
    AIResponse,
    ConversationHistory,
    ConversationTurn,
    SpeakRequest,
)
from app.services.analysis_service import analysis_service
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service


router = APIRouter()

_conversation_store: List[ConversationTurn] = []


def _fallback_response(user_input: str) -> tuple[str, List[str], float]:
    """當 LLM 不可用時的本地回退"""
    response = (
        f"你呢句『{user_input[:30]}』聽落去好堅定，但邏輯密度偏低，"
        "屬於情緒先行、證據滯後嘅典型表現。"
    )
    tags = ["愚昧指數: 68%", "盲從度: 72%", "兩極化傾向: 74%"]
    intensity = analysis_service.calculate_intensity(user_input, tags)
    return response, tags, float(intensity)


@router.post("/analyze", response_model=AIResponse)
async def analyze_user_input(payload: AnalyzeRequest):
    """分析用戶輸入並返回 AI 回應與標籤"""
    try:
        user_input = payload.user_input.strip()
        confidence = 0.9
        try:
            ai_text = await llm_service.generate_response(user_input)
            tags = await llm_service.analyze_tags(user_input, ai_text)
            intensity = float(analysis_service.calculate_intensity(user_input, tags))
        except Exception:
            ai_text, tags, intensity = _fallback_response(user_input)
            confidence = 0.55

        turn = ConversationTurn(
            id=f"turn_{uuid4().hex[:12]}",
            user_input=user_input,
            ai_response=ai_text,
            tags=tags,
            intensity=float(intensity),
            timestamp=datetime.now(),
        )
        _conversation_store.append(turn)

        return AIResponse(
            response=ai_text,
            tags=tags,
            intensity=float(intensity),
            confidence=confidence,
            speech_url=None,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"分析失敗: {str(error)}"
        ) from error


@router.get("/history", response_model=ConversationHistory)
async def get_chat_history(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """返回內存中的對話歷史"""
    turns = _conversation_store[offset : offset + limit]
    avg_intensity = 0.0
    if turns:
        avg_intensity = sum(item.intensity for item in turns) / len(turns)

    return ConversationHistory(
        turns=turns,
        total_turns=len(_conversation_store),
        avg_intensity=round(avg_intensity, 2),
    )


@router.post("/speak")
async def generate_speech(payload: SpeakRequest):
    """將文本轉換為語音 (audio/mpeg)"""
    try:
        audio_bytes = await tts_service.synthesize_speech(payload.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"語音合成失敗: {str(error)}"
        ) from error


@router.get("/voices")
async def get_available_voices():
    """返回可用語音列表"""
    voices = tts_service.get_available_voices()
    return {
        "voices": [
            {
                "id": voice,
                "name": voice,
                "locale": "zh-HK",
            }
            for voice in voices
        ]
    }
