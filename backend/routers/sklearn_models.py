"""
Scikit-learn Router
Provides endpoints for machine learning predictions and analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import sys
import os

router = APIRouter()

# Import scikit-learn modules
try:
    from sklearn.linear_model import LinearRegression
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    import pickle
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# Request/Response Models
class PredictionRequest(BaseModel):
    features: List[List[float]]
    model_type: Optional[str] = "linear"  # "linear" or "random_forest"


class PredictionResponse(BaseModel):
    predictions: List[float]
    model_type: str
    confidence: Optional[float] = None


class TrainModelRequest(BaseModel):
    X: List[List[float]]  # Features
    y: List[float]  # Target values
    model_type: Optional[str] = "linear"


class TrainModelResponse(BaseModel):
    success: bool
    model_type: str
    score: Optional[float] = None
    message: str


class FinancialDataRequest(BaseModel):
    data: List[Dict[str, Any]]
    prediction_type: str  # "expense", "income", "savings", etc.


class FinancialDataResponse(BaseModel):
    predictions: List[float]
    trends: Dict[str, Any]
    insights: List[str]


@router.post("/predict", response_model=PredictionResponse)
async def make_prediction(request: PredictionRequest):
    """
    Make predictions using scikit-learn models
    """
    if not SKLEARN_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="scikit-learn is not available. Please install scikit-learn."
        )
    
    try:
        # Convert to numpy array
        X = np.array(request.features)
        
        if request.model_type == "linear":
            model = LinearRegression()
        elif request.model_type == "random_forest":
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            raise HTTPException(status_code=400, detail="Invalid model_type. Use 'linear' or 'random_forest'")
        
        # For demo purposes, we'll create a simple model
        # In production, you'd load a pre-trained model
        # This is a placeholder - you should train/load actual models
        y_dummy = np.random.rand(len(X)) * 1000  # Dummy target for demo
        model.fit(X, y_dummy)
        
        predictions = model.predict(X).tolist()
        
        return PredictionResponse(
            predictions=predictions,
            model_type=request.model_type,
            confidence=0.85  # Placeholder confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")


@router.post("/train", response_model=TrainModelResponse)
async def train_model(request: TrainModelRequest):
    """
    Train a machine learning model
    """
    if not SKLEARN_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="scikit-learn is not available. Please install scikit-learn."
        )
    
    try:
        X = np.array(request.X)
        y = np.array(request.y)
        
        if len(X) != len(y):
            raise HTTPException(status_code=400, detail="X and y must have the same length")
        
        if request.model_type == "linear":
            model = LinearRegression()
        elif request.model_type == "random_forest":
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            raise HTTPException(status_code=400, detail="Invalid model_type. Use 'linear' or 'random_forest'")
        
        model.fit(X, y)
        score = model.score(X, y)
        
        # In production, you'd save the model here
        # with open(f'models/{request.model_type}_model.pkl', 'wb') as f:
        #     pickle.dump(model, f)
        
        return TrainModelResponse(
            success=True,
            model_type=request.model_type,
            score=score,
            message=f"Model trained successfully with R² score of {score:.4f}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")


@router.post("/financial-prediction", response_model=FinancialDataResponse)
async def predict_financial_data(request: FinancialDataRequest):
    """
    Predict financial metrics (expenses, income, savings) based on historical data
    """
    if not SKLEARN_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="scikit-learn is not available. Please install scikit-learn."
        )
    
    try:
        # Extract features from data
        # This is a simplified example - adjust based on your data structure
        features = []
        for item in request.data:
            # Extract numeric features (adjust based on your data structure)
            feature_vector = [
                item.get("amount", 0),
                item.get("month", 0),
                item.get("year", 2024),
            ]
            features.append(feature_vector)
        
        X = np.array(features)
        
        # Use linear regression for prediction
        model = LinearRegression()
        y_dummy = np.array([item.get("amount", 0) for item in request.data])
        model.fit(X, y_dummy)
        
        # Predict next period
        if len(X) > 0:
            last_feature = X[-1].copy()
            last_feature[1] += 1  # Next month
            next_prediction = model.predict([last_feature])[0]
        else:
            next_prediction = 0
        
        # Calculate trends
        amounts = [item.get("amount", 0) for item in request.data]
        if len(amounts) > 1:
            trend = "increasing" if amounts[-1] > amounts[0] else "decreasing"
            avg_change = (amounts[-1] - amounts[0]) / len(amounts) if len(amounts) > 0 else 0
        else:
            trend = "stable"
            avg_change = 0
        
        insights = [
            f"Predicted {request.prediction_type} for next period: ₹{next_prediction:.2f}",
            f"Current trend: {trend}",
            f"Average change: ₹{avg_change:.2f} per period"
        ]
        
        return FinancialDataResponse(
            predictions=[next_prediction],
            trends={
                "direction": trend,
                "average_change": avg_change,
                "current_value": amounts[-1] if amounts else 0
            },
            insights=insights
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting financial data: {str(e)}")


@router.get("/models")
async def list_available_models():
    """
    List available scikit-learn models
    """
    return {
        "models": [
            {
                "name": "linear_regression",
                "description": "Linear regression for predictions",
                "endpoint": "/api/ml/predict"
            },
            {
                "name": "random_forest",
                "description": "Random forest for complex predictions",
                "endpoint": "/api/ml/predict"
            },
            {
                "name": "financial_prediction",
                "description": "Financial data prediction",
                "endpoint": "/api/ml/financial-prediction"
            }
        ],
        "sklearn_available": SKLEARN_AVAILABLE
    }
