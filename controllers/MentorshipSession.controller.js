import model from "../config/gemini.js";
import MentorshipSession from "../models/MentorshipSession.js";
import { tryGeminiWithRetry } from "../utils/geminiHelper.js"
import mongoose from "mongoose";

export const askMentor = async (req, res) => {
  const { question, userId, chatId } = req.body;

  if (!question || !userId) {
    return res.status(400).json({ error: "Question and userId are required." });
  }

  try {
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      systemInstruction: {
        role: "system",
        parts: [
          {
            text: `You're a professional career mentor helping job seekers in tech fields. 
Your responses should be friendly, natural, and encouraging — but also clear, direct, and practical. 
Break answers into structured steps or bullet points when helpful.
Keep it human — avoid sounding robotic or overly formal.
Assume the user is asking a basic question and guide them with clarity and care.
Be concise, helpful, and avoid unnecessary filler.`,
          },
        ],
      },
    });

    const result = await tryGeminiWithRetry(() => chat.sendMessage(question));
    const response = await result.response.text();

    const session = new MentorshipSession({
      userId,
      chatId: chatId || undefined, // Assign a new one if not provided
      question,
      answer: response,
      createdAt: new Date(),
    });

    await session.save();

    res.status(200).json({ answer: response, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get mentor answer" });
  }
};

export const getUserChats = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  try {
    const sessions = await MentorshipSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$chatId",
          firstQuestion: { $first: "$question" },
          latestAt: { $first: "$createdAt" }
        }
      },
      { $sort: { latestAt: -1 } }
    ]);

    res.status(200).json({ chats: sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve chats" });
  }
};

export const getChatHistory = async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({ error: "chatId is required." });
  }

  try {
    const messages = await MentorshipSession.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("profile", "photo role")

    if (!messages.length) {
      return res.status(404).json({ error: "No chat history found." });
    }

    res.status(200).json({ history: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get chat history" });
  }
};
