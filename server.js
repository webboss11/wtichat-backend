const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
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

    // Try OpenRouter
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
            {
              role: "system",
              content:
                "You are WTIChat, a smart Indian AI assistant that can reply with formatted answers, code, diagrams or ideas.",
            },
            { role: "user", content: userMessage },
          ],
        }),
      });

      const data = await openrouterRes.json();
      finalResponse = data.choices?.[0]?.message?.content || finalResponse;
    } catch (err) {
      console.error("OpenRouter failed, trying HuggingFace...", err);
    }

    // Fallback to HuggingFace
    if (finalResponse === "Sorry, I couldn't respond right now.") {
      try {
        const huggingRes = await fetch(
          "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: userMessage }),
          }
        );

        const data = await huggingRes.json();
        if (Array.isArray(data) && data[0]?.generated_text) {
          finalResponse = data[0].generated_text;
        } else if (typeof data.generated_text === "string") {
          finalResponse = data.generated_text;
        }
      } catch (err) {
        console.error("HuggingFace failed too.", err);
      }
    }

    res.json({ reply: finalResponse });
  } catch (err) {
    console.error("Final error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        prompt,
        output_format: "url",
      }),
    });

    const data = await response.json();
    if (data?.image && typeof data.image === "string") {
      res.json({ imageUrl: data.image });
    } else {
      res.status(500).json({ error: "Image generation failed.", details: data });
    }
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Image generation error" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
