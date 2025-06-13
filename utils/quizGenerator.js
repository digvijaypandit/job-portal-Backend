import model from "../config/gemini.js";

/**
 * Utility to parse JSON from AI response with error handling
 */
const parseJsonFromText = (text) => {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}") + 1;
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
  const jsonStr = text.substring(jsonStart, jsonEnd);
  return JSON.parse(jsonStr);
};

/**
 * Generate topic, category, and userSegment from a user's profile
 */
export const generateQuizMetaFromProfile = async ({ about, skills, education }) => {
  const chat = model.startChat();

  const prompt = `
You are a smart career assistant AI. Based on the following user profile, suggest a quiz that would best suit their professional growth. Output JSON with three fields: topic, category, and userSegment.

Profile Details:
About: ${about}
Skills: ${skills.join(", ")}
Education: ${education.join(", ")}

Respond in this strict JSON format:
{
  "topic": "string",
  "category": "TECHNICAL" | "SOFT_SKILL" | "INDUSTRY_KNOWLEDGE",
  "userSegment": "string"
}
`;

  try {
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const data = parseJsonFromText(text);

    if (!data.topic || !data.category || !data.userSegment) {
      throw new Error("Incomplete quiz metadata");
    }
    return data;
  } catch (err) {
    console.error("Gemini metadata generation failed:", err.message);
    throw new Error("Failed to generate quiz meta from profile");
  }
};

/**
 * Generate a single multiple-choice question for a topic with random correct option position
 */
export const generateQuestionForTopic = async (topic, difficulty = "MEDIUM") => {
  const chat = model.startChat();

  const prompt = `
Generate one multiple-choice quiz question on the topic "${topic}" with difficulty "${difficulty}".
Return ONLY strict JSON in this format:

{
  "question": "string",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option X",
  "explanation": "string"
}

Make sure:
- Options are distinct, meaningful, and relevant to the topic.
- Provide exactly 4 options.
- The "answer" field must exactly match one of the options.
- The correct answer should not always be the same option (randomize the correct answer position).
- The explanation clearly explains why the answer is correct.
`;

  try {
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const question = parseJsonFromText(text);

    if (
      !question.question ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      !question.answer ||
      !question.explanation
    ) {
      throw new Error("Incomplete question data");
    }
    // Validate answer matches exactly one option
    if (!question.options.includes(question.answer)) {
      throw new Error("Answer does not match any option");
    }

    return question;
  } catch (err) {
    console.error("Gemini question generation failed:", err.message);
    throw new Error("Failed to generate question");
  }
};

/**
 * Generate a general-purpose quiz topic for workplace or soft skills
 */
export const generateTopicFromGeneric = async () => {
  const chat = model.startChat();

  const prompt = `
Suggest a general-purpose quiz topic that could help improve workplace knowledge or soft skills for any professional. Return JSON in this format:

{
  "topic": "string"
}
`;

  try {
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const { topic } = parseJsonFromText(text);

    if (!topic) throw new Error("Missing topic from AI");
    return topic;
  } catch (err) {
    console.error("Gemini generic topic generation failed:", err.message);
    throw new Error("Failed to generate generic topic");
  }
};
