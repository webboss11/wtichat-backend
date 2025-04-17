const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

app.post("/", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    let finalResponse = "Sorry, I couldn't respond right now.";

    // First try OpenRouter (DeepSeek or Mistral)
    try {
      const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: "You are WTIChat, a smart Indian AI assistant that can reply with formatted answers, code, diagrams or ideas." },
            { role: "user", content: userMessage },
          ],
        }),
      });
      const data = await openrouterRes.json();
      finalResponse = data.choices?.[0]?.message?.content || finalResponse;
    } catch (err) {
      console.error("OpenRouter failed, trying HuggingFace...", err);
    }

    // If OpenRouter fails, fallback to HuggingFace
    if (finalResponse === "Sorry, I couldn't respond right now.") {
      const huggingRes = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: userMessage }),
      });

      const data = await huggingRes.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        finalResponse = data[0].generated_text;
      } else if (typeof data.generated_text === "string") {
        finalResponse = data.generated_text;
      }
    }

    res.json({ reply: finalResponse });
  } catch (err) {
    console.error("Final error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
