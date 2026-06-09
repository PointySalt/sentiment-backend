const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const { analyzeSentiment } = require('./aiService'); 

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 2. Create a Database Blueprint (Schema) to save reports
const ReportSchema = new mongoose.Schema({
    brandName: { type: String, required: true },
    positivePercentage: Number,
    negativePercentage: Number,
    neutralPercentage: Number,
    topPraises: [String],
    topComplaints: [String],
    createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', ReportSchema);

// 3. ROUTE A: Analyze Brand (With Caching)
app.post('/api/sentiment', async (req, res) => {
    const { brandName, customText } = req.body;
    
    if (!brandName) return res.status(400).json({ error: "Brand name is required" });

    try {
        // Check database first! If analyzed recently, return that saved report
        const existingReport = await Report.findOne({ 
            brandName: { $regex: new RegExp(`^${brandName}$`, 'i') } 
        }).sort({ createdAt: -1 });

        if (existingReport && !customText) {
            console.log(`Cache Hit: Found existing report for ${brandName}`);
            return res.json(existingReport);
        }

        // If no custom text was pasted, generate a highly dynamic context prompt for Gemini
        const textToAnalyze = customText || `
            Gather public sentiment data regarding ${brandName}. 
            Consider recent user discussions, forum threads, and product reviews online.
        `;

        console.log(`Cache Miss: Sending ${brandName} to Gemini AI...`);
        const aiReport = await analyzeSentiment(brandName, textToAnalyze);

        if (aiReport) {
            // Save the new report to MongoDB
            const savedReport = await Report.create({
                brandName,
                positivePercentage: aiReport.positivePercentage || 0,
                negativePercentage: aiReport.negativePercentage || 0,
                neutralPercentage: aiReport.neutralPercentage || 0,
                topPraises: aiReport.topPraises || [],
                topComplaints: aiReport.topComplaints || []
            });
            res.json(savedReport);
        } else {
            res.status(500).json({ error: "AI failed to process sentiment" });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 4. ROUTE B: Get Past Searches (History Dashboard feature)
app.get('/api/history', async (req, res) => {
    try {
        const history = await Report.find().sort({ createdAt: -1 }).limit(5);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Production server running on port ${PORT}`);
});
