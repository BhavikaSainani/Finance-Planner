import axios from "axios";

// Base URL for the local Python backend
const API_URL = "http://localhost:8000/api/ml";

export interface CategorizationResponse {
  category: string;
  confidence: number;
  description: string;
}

export const categorizeTransaction = async (
  description: string,
  amount?: number
): Promise<CategorizationResponse> => {
  try {
    const response = await axios.post(`${API_URL}/categorize`, {
      description,
      amount
    });
    return response.data;
  } catch (error) {
    console.error("Failed to categorize transaction:", error);
    // Fallback or rethrow
    throw error;
  }
};

export const trainCategorizer = async (data: { description: string; category: string }[]) => {
  try {
    const response = await axios.post(`${API_URL}/train-categorizer`, {
      data
    });
    return response.data;
  } catch (error) {
    console.error("Failed to train categorizer:", error);
    throw error;
  }
};
