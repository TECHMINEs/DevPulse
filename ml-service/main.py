"""
DevPulse ML Microservice — FastAPI
Serves wellness score predictions using trained sklearn models.

Endpoints:
  POST /predict — predict wellness score and risk flag
  GET  /model-info — model metadata and accuracy
  GET  /health — health check

The model was trained on synthetic data (see train.py), which is a known limitation.
Ideally we'd retrain on real anonymized data once we have enough users.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import joblib
import json
import os
from typing import Dict, Optional

app = FastAPI(
    title="DevPulse ML Service",
    description="Wellness prediction microservice for DevPulse",
    version="1.0.0",
)

# CORS — needed for direct browser calls during development
ALLOWED_ORIGINS = [
    os.getenv("BACKEND_URL", "http://localhost:5000"),
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ============================================================================
# Load models at startup
# ============================================================================
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
classifier_data = None
regressor_data = None
model_info = None

try:
    classifier_path = os.path.join(MODEL_DIR, "model_classifier.pkl")
    regressor_path = os.path.join(MODEL_DIR, "model_regressor.pkl")
    info_path = os.path.join(MODEL_DIR, "model_info.json")

    if os.path.exists(classifier_path):
        classifier_data = joblib.load(classifier_path)
        print("✅ Classifier model loaded")

    if os.path.exists(regressor_path):
        regressor_data = joblib.load(regressor_path)
        print("✅ Regressor model loaded")

    if os.path.exists(info_path):
        with open(info_path) as f:
            model_info = json.load(f)
        print("✅ Model info loaded")

except Exception as e:
    print(f"⚠️ Failed to load models: {e}")
    print("Run 'python train.py' first to generate models")


# ============================================================================
# Request/Response schemas
# ============================================================================
class PredictionRequest(BaseModel):
    avg_commit_hour: float = Field(..., ge=0, le=24, description="Average commit hour (0-23)")
    night_commit_pct: float = Field(..., ge=0, le=1, description="Percentage of night commits (0-1)")
    weekend_commit_pct: float = Field(..., ge=0, le=1, description="Percentage of weekend commits (0-1)")
    avg_message_length: float = Field(..., ge=0, le=500, description="Average commit message length")
    lines_changed_stddev: float = Field(..., ge=0, le=5000, description="Standard deviation of lines changed")
    commits_per_day: float = Field(..., ge=0, le=50, description="Average commits per day")
    streak_length: int = Field(..., ge=0, le=365, description="Current streak in days")
    files_per_commit: float = Field(..., ge=0, le=100, description="Average files per commit")

    class Config:
        json_schema_extra = {
            "example": {
                "avg_commit_hour": 14.5,
                "night_commit_pct": 0.05,
                "weekend_commit_pct": 0.15,
                "avg_message_length": 45.0,
                "lines_changed_stddev": 120.0,
                "commits_per_day": 4.2,
                "streak_length": 12,
                "files_per_commit": 3.5,
            }
        }


class PredictionResponse(BaseModel):
    score: float
    risk_flag: str
    feature_importance: Dict[str, float]
    confidence: float


class ModelInfoResponse(BaseModel):
    accuracy: float
    trained_on: int
    features: list
    version: str
    feature_importances: Optional[Dict[str, float]] = None
    regressor_rmse: Optional[float] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


# ============================================================================
# Endpoints
# ============================================================================
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict developer wellness score and risk flag.
    Returns the predicted score (0-100), risk classification, feature importance, and confidence.
    """
    if classifier_data is None or regressor_data is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Run 'python train.py' first.",
        )

    # prepare feature vector
    features = np.array([[
        request.avg_commit_hour,
        request.night_commit_pct,
        request.weekend_commit_pct,
        request.avg_message_length,
        request.lines_changed_stddev,
        request.commits_per_day,
        request.streak_length,
        request.files_per_commit,
    ]])

    # scale features using the scaler from training
    features_scaled = classifier_data["scaler"].transform(features)

    # predict risk flag (classifier)
    risk_flag = classifier_data["model"].predict(features_scaled)[0]

    # get class probabilities for confidence
    proba = classifier_data["model"].predict_proba(features_scaled)[0]
    confidence = float(max(proba))

    # predict numeric score (regressor)
    score_raw = regressor_data["model"].predict(features_scaled)[0]
    score = float(np.clip(score_raw, 0, 100))

    # feature importance from the classifier
    feature_importance = {
        name: round(float(imp), 4)
        for name, imp in zip(
            classifier_data["features"],
            classifier_data["model"].feature_importances_,
        )
    }

    return PredictionResponse(
        score=round(score, 2),
        risk_flag=risk_flag,
        feature_importance=feature_importance,
        confidence=round(confidence, 4),
    )


@app.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Return model metadata including accuracy, training size, and features."""
    if model_info is None:
        raise HTTPException(status_code=503, detail="Model info not available")

    return ModelInfoResponse(
        accuracy=model_info.get("classifier_accuracy", 0),
        trained_on=model_info.get("trained_on", 0),
        features=model_info.get("features", []),
        version=model_info.get("version", "unknown"),
        feature_importances=model_info.get("feature_importances"),
        regressor_rmse=model_info.get("regressor_rmse"),
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        model_loaded=classifier_data is not None and regressor_data is not None,
    )


# ============================================================================
# Run with: uvicorn main:app --host 0.0.0.0 --port 8000
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
