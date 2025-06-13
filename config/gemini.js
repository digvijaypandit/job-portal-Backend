import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini 2.0 Flash model
const model = genAI.getGenerativeModel({
  model: 'models/gemini-2.0-flash',
});

export default model;
