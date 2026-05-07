from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import PersonDetectionResponse
from app.services.vision_service import vision_service

router = APIRouter()


@router.post("/detect-person", response_model=PersonDetectionResponse)
async def detect_person(file: UploadFile = File(...)) -> PersonDetectionResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    return vision_service.detect_people(image_bytes)
