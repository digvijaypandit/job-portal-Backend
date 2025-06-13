import model from "../config/gemini.js";
import { tryGeminiWithRetry } from "../utils/geminiHelper.js";

const cleanJsonString = (str) => {
  return str.trim().replace(/^```json?\n/, '').replace(/```$/, '').trim();
};

export const generateRoadmapNode = async (req, res) => {
  const { nodeLabel } = req.body;

  if (!nodeLabel) {
    return res.status(400).json({ error: 'nodeLabel is required.' });
  }

  try {
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: `
You are an expert career advisor. 
When given a topic or career field, return a JSON object representing subfields or concepts to learn as an expandable mind map. 
Use this JSON format:

{
  "label": "Input Topic",
  "children": [
    { "label": "Subtopic 1" },
    { "label": "Subtopic 2", "children": [ { "label": "Nested Subtopic" } ] }
  ]
}

Keep responses brief but structured. Only return valid JSON.
`,
          },
        ],
      },
    });

    const result = await tryGeminiWithRetry(() =>
      chat.sendMessage(`Generate a mind map for: ${nodeLabel}. Return only valid JSON.`)
    );

    const responseText = await result.response.text();

    const cleaned = cleanJsonString(responseText);

    let structured;
    try {
      structured = JSON.parse(cleaned);
    } catch (jsonErr) {
      console.error('JSON Parse Error:', jsonErr);
      return res.status(500).json({
        error: 'AI response was not valid JSON. Try again or refine the prompt.',
        raw: responseText,
      });
    }

    return res.status(200).json({ node: structured });
  } catch (error) {
    console.error('Mindmap generation error:', error);
    if (error.status === 503) {
      return res.status(503).json({ error: 'AI model overloaded. Try again shortly.' });
    }
    return res.status(500).json({ error: 'Failed to generate mindmap node.' });
  }
};
