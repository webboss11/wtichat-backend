require('dotenv').config(); // Load .env file

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    // First check OpenRouter API (DeepSeek)
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://wtichataidemo.rf.gd",
        "X-Title": "WTIChat AI"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [{ role: "user", content: message }]
      })
    });

    const openRouterData = await openRouterResponse.json();
    console.log("OpenRouter API Response:", openRouterData);  // Add this to debug response

    let reply = openRouterData.choices?.[0]?.message?.content || "Sorry, no reply received.";

    // If OpenRouter doesn't provide a response, fallback to HuggingFace API (optional)
    if (reply === "Sorry, no reply received.") {
      const huggerResponse = await fetch("https://api-inference.huggingface.co/models/gpt-2", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: message })
      });

      const huggerData = await huggerResponse.json();
      reply = huggerData?.generated_text || "Sorry, no response from HuggingFace model.";
    }

    res.json({ reply });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/", (req, res) => {
  res.send("WTIChat backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
