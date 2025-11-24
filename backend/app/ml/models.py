from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

import numpy as np

log = logging.getLogger(__name__)


class SiteRiskModel:
    def __init__(self, model_path: Optional[str] = None, version: str = "site-risk-stub-v1"):
        self.model_path = model_path or os.getenv("MODEL_PATH")
        self.version = version
        self.weights: Dict[str, float] = {}
        self.bias: float = 0.0
        self._load_model()

    def _load_model(self):
        if not self.model_path or not os.path.exists(self.model_path):
            log.info("No torchgeo model path provided, using heuristic fallback.")
            return
        try:
            data = np.load(self.model_path, allow_pickle=True).item()
            self.weights = data.get("weights", {})
            self.bias = float(data.get("bias", 0.0))
            self.version = data.get("version", self.version)
            log.info("Loaded model weights from %s", self.model_path)
        except Exception as exc:
            log.warning("Failed to load model: %s", exc)

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        ndvi_mean = features.get("ndvi_mean")
        ndvi_std = features.get("ndvi_std")
        rainfall = features.get("rainfall_mean")
        temp = features.get("temp_mean")
        soil_index = features.get("soil_index")

        if self.weights:
            score = self.bias
            for key, weight in self.weights.items():
                value = float(features.get(key) or 0.0)
                score += float(weight) * value
            score = 1 / (1 + np.exp(-score))
            reasoning = "Loaded model weights used."
        else:
            delta_ndvi = 0.0 if ndvi_mean is None else (0.5 - float(ndvi_mean))
            delta_rain = 0.0 if rainfall is None else float(rainfall) / 100.0
            delta_temp = 0.0 if temp is None else (min(float(temp), 40.0) - 20.0) / 40.0
            score = 0.5 + 0.2 * delta_ndvi + 0.1 * delta_rain + 0.1 * delta_temp
            if soil_index is not None:
                score += 0.1 * float(soil_index)
            reasoning = "Fallback heuristic combining NDVI/rain/temp."

        normalized = float(max(0.0, min(1.0, score)))
        return {
            "score": normalized,
            "reasoning": reasoning,
            "model_version": self.version,
        }
