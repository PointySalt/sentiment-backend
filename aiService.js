const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeSentiment(brandName, textData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
You are an expert market researcher. Read the following public sentiment data about the brand "${brandName}".

Return ONLY a valid JSON object with this EXACT structure, nothing else:
{
  "positivePercentage": 0,
  "negativePercentage": 0,
  "neutralPercentage": 0,
  "topPraises": ["praise 1", "praise 2", "praise 3"],
  "topComplaints": ["complaint 1", "complaint 2", "complaint 3"],
  "keyEmotions": ["emotion 1", "emotion 2"],
  "trendingKeywords": ["keyword1", "keyword2", "keyword3"],
  "aiVerdict": "A strict 1-2 sentence final verdict summarizing the brand's current public standing."
}

Ensure percentages add up to 100.
Data to analyze:
${textData}
`;

        const result = await model.generateContent(prompt);
        const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.log("AI Error:", error);
        return null;
    }
}
module.exports = { analyzeSentiment };
