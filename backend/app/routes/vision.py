"""Vision routes for webcam presence detection."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.vision_service import vision_service


router = APIRouter()


@router.post("/detect-person")
async def detect_person(frame: UploadFile = File(...)):
    """Detect if at least one person appears in the uploaded image frame."""
    try:
        if not frame.content_type or not frame.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="請上傳圖片格式 frame")

        image_bytes = await frame.read()
        result = vision_service.detect_people(image_bytes)
        return {
            "detected": result.detected,
            "count": result.count,
            "confidence": result.confidence,
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"影像偵測失敗: {str(error)}"
        ) from error
