"""Train a minimal TorchGeo-style NDVI model and dump weights for runtime scoring."""

import logging
import os
from typing import List

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from app.db.session import get_db

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

FEATURE_KEYS: List[str] = [
    "ndvi_mean",
    "ndvi_std",
    "rainfall_mean",
    "temp_mean",
    "soil_index",
]

DEFAULT_MODEL_PATH = os.getenv("MODEL_PATH", os.path.join("backend", "models", "ndvi_weights.npz"))


def _build_dataset() -> tuple[torch.Tensor, torch.Tensor]:
    db = next(get_db())
    predictions = list(db["site_predictions"].find())
    features = []
    targets = []

    for pred in predictions:
        feat = db["site_features"].find_one({"id": pred["features_id"]})
        if not feat:
            continue
        ndvi_mean = feat.get("ndvi_mean")
        ndvi_std = feat.get("ndvi_std")
        rainfall = feat.get("rainfall_mean_mm_per_day")
        if rainfall is not None:
            rainfall *= 365.0
        temp_mean = None
        tmin = feat.get("tmin_c")
        tmax = feat.get("tmax_c")
        if tmin is not None and tmax is not None:
            temp_mean = (tmin + tmax) / 2.0
        soil = feat.get("soc")

        row = [
            ndvi_mean if ndvi_mean is not None else 0.0,
            ndvi_std if ndvi_std is not None else 0.0,
            rainfall if rainfall is not None else 0.0,
            temp_mean if temp_mean is not None else 0.0,
            soil if soil is not None else 0.0,
        ]
        features.append(row)
        targets.append(pred.get("score", 0.5))

    if not features:
        raise RuntimeError("No features/predictions available for training.")

    X = torch.tensor(features, dtype=torch.float32)
    y = torch.tensor(targets, dtype=torch.float32).unsqueeze(1)
    return X, y


class NDVIModel(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        self.linear = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.linear(x)


def train(save_path: str = DEFAULT_MODEL_PATH, epochs: int = 200, lr: float = 1e-2):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    X, y = _build_dataset()
    dataset = TensorDataset(X, y)
    loader = DataLoader(dataset, batch_size=8, shuffle=True)

    model = NDVIModel(len(FEATURE_KEYS))
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()

    for epoch in range(epochs):
        epoch_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            preds = model(xb)
            loss = loss_fn(preds, yb)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        if epoch % 25 == 0:
            log.info("Epoch %d loss %.4f", epoch, epoch_loss / len(loader))

    state = model.linear[0].weight.detach().numpy()[0]
    bias = model.linear[0].bias.detach().item()
    np.save(save_path, {"weights": dict(zip(FEATURE_KEYS, state)), "bias": bias, "version": "torchgeo-v1"})
    log.info("Saved model weights to %s", save_path)


def main():
    train_path = os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
    train(save_path=train_path)


if __name__ == "__main__":
    main()
