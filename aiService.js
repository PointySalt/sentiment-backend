const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeSentiment(brandName, textData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Analyze this feedback about ${brandName} and return ONLY a JSON object with: { "positivePercentage": Number, "topPraises": [String], "topComplaints": [String] }. Feedback: ${textData}`;

        const result = await model.generateContent(prompt);
        const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.log("AI Error:", error);
        return null;
    }
}
module.exports = { analyzeSentiment };