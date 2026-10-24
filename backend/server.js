require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

async function askGroq(model, task, minutesLeft) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.GROQ_API_KEY
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 300,
      reasoning_effort: "low",
      messages: [
        {
          role: "system",
          content:
            "You write one short focus reminder, under 18 words. Tone: friendly teammate, never a strict teacher. No emoji. No quotation marks. Reply with the message only."
        },
        {
          role: "user",
          content:
            "The user is working on: " + task + ". Minutes left: " + minutesLeft + "."
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.choices && data.choices[0].message.content;
  if (!text) throw new Error("No reply");
  return text.trim();
}

app.post("/api/message", async (req, res) => {
  const task = req.body.task || "your goal";
  const minutesLeft = req.body.minutesLeft || 25;

  for (const model of MODELS) {
    try {
      const message = await askGroq(model, task, minutesLeft);
      return res.json({ message: message });
    } catch (error) {
      console.log("Model failed:", model);
    }
  }
  res.status(500).json({ message: "" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});