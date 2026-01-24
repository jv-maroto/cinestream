from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import base64
import io
import os

app = FastAPI(title="CLIP Scene Classifier API")

# Load CLIP model
MODEL_NAME = os.getenv("MODEL_NAME", "openai/clip-vit-large-patch14")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading CLIP model: {MODEL_NAME} on {DEVICE}")
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)


class ClassifyRequest(BaseModel):
    image: str  # Base64 encoded image
    prompts: list[str]  # Text prompts for classification


class ClassifyResponse(BaseModel):
    scores: list[float]  # Probability scores for each prompt


@app.get("/")
async def root():
    return {
        "name": "CLIP Scene Classifier API",
        "model": MODEL_NAME,
        "device": DEVICE
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_NAME}


@app.post("/classify", response_model=ClassifyResponse)
async def classify(request: ClassifyRequest):
    """Classify image using CLIP with custom prompts"""
    try:
        # Decode base64 image
        img_bytes = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        if not request.prompts:
            raise HTTPException(status_code=400, detail="No prompts provided")

        # Process inputs
        inputs = processor(
            text=request.prompts,
            images=image,
            return_tensors="pt",
            padding=True
        ).to(DEVICE)

        # Get predictions
        with torch.no_grad():
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)

        # Convert to list
        scores = probs[0].cpu().numpy().tolist()

        return ClassifyResponse(scores=scores)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/classify-top-k")
async def classify_top_k(request: ClassifyRequest, k: int = 5):
    """Classify and return top K results"""
    response = await classify(request)

    # Sort by score and get top K
    sorted_results = sorted(
        zip(request.prompts, response.scores),
        key=lambda x: x[1],
        reverse=True
    )[:k]

    return {
        "results": [
            {"prompt": prompt, "score": score}
            for prompt, score in sorted_results
        ]
    }
