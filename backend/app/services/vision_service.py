from __future__ import annotations

import cv2
import numpy as np
from ultralytics import YOLO

from config import settings
from app.models.schemas import PersonDetectionResponse


class VisionService:
    def __init__(self) -> None:
        # 1. Load the lightweight Nano model (automatically downloads on first run)
        self.model = YOLO("yolov8n.pt") 
        
        # 2. Map the confidence threshold from your settings
        self.threshold = settings.vision_confidence_threshold
        
        # COCO dataset class ID for 'person' is 0
        self.PERSON_CLASS_ID = 0 

    def detect_people(self, image_bytes: bytes) -> PersonDetectionResponse:
        frame = self._decode_frame(image_bytes)
        if frame is None:
            return PersonDetectionResponse(detected=False, count=0, confidence=0.0)

        # Optional: You may not even need _resize_frame anymore as YOLO handles scaling internally,
        # but keeping it consistent with your original pipeline is fine.
        frame = self._resize_frame(frame)

        # 3. Run inference
        # verbose=False keeps your logs clean; device='cpu' ensures it runs anywhere
        results = self.model(frame, verbose=False, device="cpu")
        
        confidences = []
        
        # 4. Parse the results
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Check if the detected object is a person and meets your threshold
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                
                if class_id == self.PERSON_CLASS_ID and confidence >= self.threshold:
                    confidences.append(confidence)

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