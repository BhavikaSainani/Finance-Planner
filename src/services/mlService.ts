/**
 * Machine Learning Service
 * Handles communication with FastAPI backend for scikit-learn models
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface PredictionRequest {
  features: number[][];
  model_type?: "linear" | "random_forest";
}

export interface PredictionResponse {
  predictions: number[];
  model_type: string;
  confidence?: number;
}

export interface TrainModelRequest {
  X: number[][];
  y: number[];
  model_type?: "linear" | "random_forest";
}

export interface TrainModelResponse {
  success: boolean;
  model_type: string;
  score?: number;
  message: string;
}

export interface FinancialDataRequest {
  data: Array<Record<string, any>>;
  prediction_type: "expense" | "income" | "savings";
}

export interface FinancialDataResponse {
  predictions: number[];
  trends: {
    direction: string;
    average_change: number;
    current_value: number;
  };
  insights: string[];
}

/**
 * Make predictions using ML models
 */
export const makePrediction = async (
  request: PredictionRequest
): Promise<PredictionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ml/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to make prediction:", error);
    throw error;
  }
};

/**
 * Train a machine learning model
 */
export const trainModel = async (
  request: TrainModelRequest
): Promise<TrainModelResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ml/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to train model:", error);
    throw error;
  }
};

/**
 * Predict financial data (expenses, income, savings)
 */
export const predictFinancialData = async (
  request: FinancialDataRequest
): Promise<FinancialDataResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ml/financial-prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to predict financial data:", error);
    throw error;
  }
};

/**
 * List available ML models
 */
export const listMLModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ml/models`);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to list models:", error);
    throw error;
  }
};
