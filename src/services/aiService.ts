
import { getFinancialAdvice } from "./fingptService";

export const getAIAdvice = async (message: string) => {
    try {
        // Use FastAPI backend for financial advice
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        
        const response = await fetch(`${API_BASE_URL}/api/fingpt/advice`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: message }),
        });

        if (!response.ok) {
            // Fallback to Firebase function if FastAPI is not available
            const FUNCTION_URL = "http://127.0.0.1:5001/wealthwise-af0e4/us-central1/getFinancialAdvice";
            const fallbackResponse = await fetch(FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ data: { message } }),
            });

            if (!fallbackResponse.ok) {
                throw new Error(`Error: ${fallbackResponse.statusText}`);
            }

            const json = await fallbackResponse.json();
            return json.result || json.data;
        }

        const result = await response.json();
        return result.advice || result.reasoning || "Unable to generate insights at this time.";
    } catch (error) {
        console.error("Failed to fetch AI advice:", error);
        return "Unable to generate insights at this time. Please try again later.";
    }
};
