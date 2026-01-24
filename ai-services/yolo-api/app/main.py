from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import os
import torch

# Monkey patch torch.load to disable weights_only for Ultralytics compatibility
original_torch_load = torch.load
def patched_torch_load(f, *args, **kwargs):
    kwargs['weights_only'] = False
    return original_torch_load(f, *args, **kwargs)
torch.load = patched_torch_load

app = FastAPI(title="YOLO Detection API")

# Load YOLO model
MODEL_TYPE = os.getenv("MODEL_TYPE", "yolov8x")
DEVICE = os.getenv("DEVICE", "0")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.25"))

print(f"Loading YOLO model: {MODEL_TYPE}")
model = YOLO(f"{MODEL_TYPE}.pt")
model.to(f"cuda:{DEVICE}" if DEVICE != "cpu" else "cpu")


class DetectionRequest(BaseModel):
    image: str  # Base64 encoded image


class Detection(BaseModel):
    class_name: str
    class_id: int
    confidence: float
    bbox: list  # [x, y, w, h]


class DetectionResponse(BaseModel):
    detections: list[Detection]
    person_count: int


@app.get("/")
async def root():
    return {"name": "YOLO Detection API", "model": MODEL_TYPE, "device": DEVICE}


@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_TYPE}


@app.post("/detect", response_model=DetectionResponse)
async def detect(request: DetectionRequest):
    """Detect objects in image"""
    try:
        # Decode base64 image
        img_bytes = base64.b64decode(request.image)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Run YOLO detection
        results = model(img, conf=CONF_THRESHOLD, verbose=False)

        detections = []
        person_count = 0

        for result in results:
            boxes = result.boxes

            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                w = x2 - x1
                h = y2 - y1

                # Get class and confidence
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                cls_name = model.names[cls_id]

                detection = Detection(
                    class_name=cls_name,
                    class_id=cls_id,
                    confidence=conf,
                    bbox=[float(x1), float(y1), float(w), float(h)]
                )

                detections.append(detection)

                # Count persons
                if cls_name == "person":
                    person_count += 1

        return DetectionResponse(
            detections=detections,
            person_count=person_count
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/count-persons")
async def count_persons(request: DetectionRequest):
    """Count number of persons in image"""
    response = await detect(request)
    return {"person_count": response.person_count}
