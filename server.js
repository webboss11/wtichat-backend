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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, no reply received.";
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
