
export const getAIAdvice = async (message: string) => {
    try {
        // For local development, we use the emulator URL. 
        // In production, this should be the deployed function URL or better yet, use window.location.origin if served from same domain.
        // Ideally we use a environment variable.
        const FUNCTION_URL = "http://127.0.0.1:5001/wealthwise-af0e4/us-central1/getFinancialAdvice";

        const response = await fetch(FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: { message } }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const json = await response.json();
        return json.result || json.data; // Firebase functions usually return { result: ... } or { data: ... }
    } catch (error) {
        console.error("Failed to fetch AI advice:", error);
        return "Unable to generate insights at this time. Please try again later.";
    }
};
