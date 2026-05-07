from __future__ import annotations

import cv2
import numpy as np

from config import settings
from app.models.schemas import PersonDetectionResponse


class VisionService:
    def __init__(self) -> None:
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.threshold = settings.vision_confidence_threshold

    def detect_people(self, image_bytes: bytes) -> PersonDetectionResponse:
        frame = self._decode_frame(image_bytes)
        if frame is None:
            return PersonDetectionResponse(detected=False, count=0, confidence=0.0)

        frame = self._resize_frame(frame)
        boxes, weights = self.hog.detectMultiScale(
            frame,
            winStride=(8, 8),
            padding=(8, 8),
            scale=1.05,
        )

        confidences = [float(weight) for weight in weights if float(weight) >= self.threshold]
        count = len(confidences)

        return PersonDetectionResponse(
            detected=count > 0,
            count=count,
            confidence=max(confidences) if confidences else 0.0,
        )

    def _decode_frame(self, image_bytes: bytes) -> np.ndarray | None:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    def _resize_frame(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        if w <= 640:
            return frame
        ratio = 640 / float(w)
        new_size = (640, int(h * ratio))
        return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)


vision_service = VisionService()
