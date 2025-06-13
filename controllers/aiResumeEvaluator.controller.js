import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import model from '../config/gemini.js';

// Extract text from PDF file at given absolute path
const extractTextFromPDF = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(fileBuffer);
  return data.text;
};

// Controller: evaluate resume against job description
export const evaluateResume = async (req, res) => {
  const { jobDescription } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Resume file is required.' });
  }

  const uploadedPath = path.resolve(req.file.path);

  try {
    // Extract text from uploaded PDF resume
    const resumeText = await extractTextFromPDF(uploadedPath);

    // Always delete the uploaded file after extraction
    fs.unlinkSync(uploadedPath);

    // Build prompt for Gemini AI model
    const prompt = `
You are an AI resume evaluator acting like an Applicant Tracking System (ATS).

Evaluate this resume against the job description.

Return:
- Score out of 100
- Matching skills
- Missing skills
- Suggestions for improvement

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

    // Call Gemini AI to generate evaluation
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    return res.status(200).json({ success: true, feedback: output });

  } catch (err) {
    console.error('Error during resume evaluation:', err.message);

    // Ensure the uploaded file is deleted even if there's an error
    if (fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }

    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};
