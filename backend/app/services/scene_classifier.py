import httpx
import numpy as np
import base64
import cv2
from typing import List, Dict, Tuple


class SceneClassifier:
    """Client for CLIP-based scene classification API - Cinema version"""

    # Category prompts for movie/TV classification
    CATEGORY_PROMPTS = {
        # Genres
        "action": "an action movie scene with fighting or explosions",
        "comedy": "a funny comedy scene with people laughing",
        "drama": "a dramatic emotional scene",
        "horror": "a scary horror movie scene",
        "thriller": "a tense thriller suspense scene",
        "romance": "a romantic scene with couple",
        "science-fiction": "a science fiction scene with futuristic technology or space",
        "fantasy": "a fantasy scene with magic or mythical creatures",
        "animation": "an animated cartoon scene",
        "documentary": "a documentary footage scene",
        "war": "a war battle combat scene",
        "western": "a western cowboy scene",
        "mystery": "a mystery detective investigation scene",
        "crime": "a crime scene with police or criminals",
        "adventure": "an adventure exploration scene",
        "family": "a family friendly scene with children",

        # Scene types
        "outdoor": "an outdoor exterior scene",
        "indoor": "an indoor interior scene",
        "city": "a city urban scene",
        "nature": "a nature landscape scene",
        "night": "a dark night scene",
        "day": "a bright daytime scene",

        # Content
        "dialogue": "people talking conversation scene",
        "chase": "a chase pursuit scene",
        "fight": "a fight combat scene",
        "explosion": "an explosion scene",
        "car": "a car driving scene",
    }

    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def classify_scene(
        self,
        image: np.ndarray,
        categories: List[str] = None,
        threshold: float = 0.25
    ) -> List[Tuple[str, float]]:
        """Classify scene using CLIP"""
        try:
            if categories is None:
                categories = list(self.CATEGORY_PROMPTS.keys())

            # Encode image
            _, buffer = cv2.imencode('.jpg', image)
            img_base64 = base64.b64encode(buffer).decode('utf-8')

            # Prepare prompts
            prompts = [self.CATEGORY_PROMPTS.get(cat, f"a scene of {cat}") for cat in categories]

            response = await self.client.post(
                f"{self.api_url}/classify",
                json={
                    "image": img_base64,
                    "prompts": prompts
                }
            )

            if response.status_code == 200:
                data = response.json()
                scores = data.get("scores", [])

                results = []
                for cat, score in zip(categories, scores):
                    if score >= threshold:
                        results.append((cat, float(score)))

                results.sort(key=lambda x: x[1], reverse=True)
                return results

            return []

        except Exception as e:
            print(f"Scene classification error: {e}")
            return []

    def aggregate_classifications(
        self,
        frame_classifications: List[List[Tuple[str, float]]]
    ) -> List[Tuple[str, float]]:
        """Aggregate classifications from multiple frames"""
        if not frame_classifications:
            return []

        category_scores = {}

        for classifications in frame_classifications:
            for cat, score in classifications:
                if cat not in category_scores:
                    category_scores[cat] = []
                category_scores[cat].append(score)

        # Require category to appear in at least 15% of frames
        min_frequency = max(3, int(len(frame_classifications) * 0.15))

        results = []
        for cat, scores in category_scores.items():
            if len(scores) >= min_frequency:
                avg_score = sum(scores) / len(scores)
                if avg_score >= 0.30:
                    results.append((cat, avg_score))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:5]

    async def close(self):
        await self.client.aclose()
