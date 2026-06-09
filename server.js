const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { analyzeSentiment } = require('./aiService'); 

const app = express();
app.use(cors());
app.use(express.json());

// THIS IS THE EXACT ROUTE WE ARE TESTING
app.get('/api/sentiment/:brand', async (req, res) => {
    const brand = req.params.brand;
    console.log(`Received request for brand: ${brand}`);

    const fakeRedditData = `
        "I absolutely love how fast ${brand} is, it saves me hours."
        "The customer service for ${brand} is terrible, they never reply."
        "It's okay, but too expensive for what you get."
    `;

    const aiReport = await analyzeSentiment(brand, fakeRedditData);

    if (aiReport) {
        res.json(aiReport);
    } else {
        res.status(500).json({ error: "Failed to generate report" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});