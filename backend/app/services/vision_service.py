"""Vision service: detect people in webcam frames with OpenCV HOG."""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class PersonDetectionResult:
    detected: bool
    count: int
    confidence: float


class VisionService:
    """Provides lightweight person detection for UI presence checks."""

    def __init__(self) -> None:
        self._hog = cv2.HOGDescriptor()
        self._hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    def detect_people(self, image_bytes: bytes) -> PersonDetectionResult:
        if not image_bytes:
            return PersonDetectionResult(detected=False, count=0, confidence=0.0)

        frame = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            return PersonDetectionResult(detected=False, count=0, confidence=0.0)

        # Resize keeps inference cost low for frequent polling from frontend.
        height, width = frame.shape[:2]
        max_width = 640
        if width > max_width:
            ratio = max_width / float(width)
            frame = cv2.resize(frame, (max_width, int(height * ratio)))

        rects, weights = self._hog.detectMultiScale(
            frame,
            winStride=(8, 8),
            padding=(8, 8),
            scale=1.05,
        )

        valid_weights = [float(w) for w in (weights.flatten() if len(weights) else [])]
        confidence = max(valid_weights) if valid_weights else 0.0
        count = len(rects)

        # Require a modest confidence floor to reduce false positives.
        detected = count > 0 and confidence >= 0.45

        return PersonDetectionResult(
            detected=detected,
            count=count,
            confidence=round(confidence, 3),
        )


vision_service = VisionService()
