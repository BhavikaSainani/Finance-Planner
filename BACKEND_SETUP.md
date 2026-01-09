# Backend Setup Guide

This guide explains how to set up and use the FastAPI backend with FinGPT and scikit-learn models.

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create virtual environment (Linux/Mac)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

Or use the provided scripts:
- Windows: `start.bat`
- Linux/Mac: `chmod +x start.sh && ./start.sh`

### 2. Environment Variables

Create a `.env` file in the `backend` directory (copy from `env.example`):

```env
HF_TOKEN=your_huggingface_token_here
FINNHUB_API_KEY=your_finnhub_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Frontend Configuration

Add to your `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### FinGPT Endpoints

#### 1. Sentiment Analysis
```bash
POST /api/fingpt/sentiment
Body: {
  "text": "Stock prices are rising due to strong earnings",
  "model": "default"
}
```

#### 2. Stock Forecasting
```bash
POST /api/fingpt/forecast
Body: {
  "ticker": "AAPL",
  "n_weeks": 1,
  "use_basics": true
}
```

#### 3. Financial Advice
```bash
POST /api/fingpt/advice
Body: {
  "query": "How should I invest my savings?",
  "context": {"age": 30, "income": 100000}
}
```

### Machine Learning Endpoints

#### 1. Make Predictions
```bash
POST /api/ml/predict
Body: {
  "features": [[1000, 500, 200], [1200, 600, 250]],
  "model_type": "linear"
}
```

#### 2. Train Model
```bash
POST /api/ml/train
Body: {
  "X": [[1, 2], [2, 3], [3, 4]],
  "y": [3, 5, 7],
  "model_type": "linear"
}
```

#### 3. Financial Data Prediction
```bash
POST /api/ml/financial-prediction
Body: {
  "data": [
    {"amount": 5000, "month": 1, "year": 2024},
    {"amount": 5500, "month": 2, "year": 2024}
  ],
  "prediction_type": "expense"
}
```

## Frontend Integration

### Using FinGPT Services

```typescript
import { analyzeSentiment, forecastStock, getFinancialAdvice } from "@/services/fingptService";

// Analyze sentiment
const sentiment = await analyzeSentiment({
  text: "Market is showing positive trends"
});

// Forecast stock
const forecast = await forecastStock({
  ticker: "AAPL",
  n_weeks: 1
});

// Get advice
const advice = await getFinancialAdvice({
  query: "How to save for retirement?",
  context: { age: 30 }
});
```

### Using ML Services

```typescript
import { makePrediction, predictFinancialData } from "@/services/mlService";

// Make prediction
const prediction = await makePrediction({
  features: [[1000, 500], [1200, 600]],
  model_type: "linear"
});

// Predict financial data
const financialPred = await predictFinancialData({
  data: [
    { amount: 5000, month: 1, year: 2024 },
    { amount: 5500, month: 2, year: 2024 }
  ],
  prediction_type: "expense"
});
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### Issue: Module not found errors
**Solution**: Ensure the AI models are in the correct path. The backend expects:
- `AI/FinGPT/` for FinGPT models
- `AI/scikit-learn/` for scikit-learn

### Issue: CORS errors
**Solution**: Update `CORS_ORIGINS` in `.env` to include your frontend URL.

### Issue: FinGPT models not loading
**Solution**: 
1. Ensure `HF_TOKEN` is set correctly
2. Check that FinGPT models are properly installed
3. Some models require GPU - check system requirements

### Issue: scikit-learn not available
**Solution**: Install scikit-learn:
```bash
pip install scikit-learn
```

## Notes

- The backend includes fallback implementations for when models aren't available
- Some FinGPT features require GPU and significant memory
- For production, consider using model caching and async processing
- API responses include error handling and fallback mechanisms
