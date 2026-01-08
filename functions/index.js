const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({ origin: true });

// Initialize Gemini with the provided API key
const genAI = new GoogleGenerativeAI("AIzaSyBav5ZNMJY_bfEDp4S_YDX-Fq6PtBjj650");

exports.getFinancialAdvice = onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const message = request.body.data?.message || request.body.message || "Give me general financial advice.";

            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(message);
            const responseText = result.response.text();

            response.json({ data: responseText });
        } catch (error) {
            logger.error("Error calling Gemini:", error);
            response.status(500).send({ error: error.message });
        }
    });
});
