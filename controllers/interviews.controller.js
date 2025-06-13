import model from '../config/gemini.js';
import InterviewSession from '../models/interview.model.js';

// Prompt to generate questions
const generatePrompt = (interviewType, level, field = 'Software Development', language = 'JavaScript') => {
  const type = interviewType.toLowerCase();
  const fieldInfo = field.trim();

  switch (type) {
    case 'technical':
      return `Generate a ${level}-level technical interview question in the field of ${fieldInfo}. Only return the question. No explanation.`;

    case 'hr':
      return `Generate a ${level}-level HR interview question for a candidate in the field of ${fieldInfo}. Only return the question. No description or advice.`;

    case 'coding':
      return `Generate a ${level}-level coding problem in ${language} for someone in the field of ${fieldInfo}. Only return the question. No explanation or solution.`;

    default:
      return `Generate a ${level}-level interview question for a candidate in the field of ${fieldInfo}. Only return the question.`;
  }
};


// Prompt to evaluate answers
const evaluatePrompt = (question, answer) => {
  return `Evaluate the following answer to the interview question.

Question: "${question}"
Answer: "${answer}"

Give a score from 0 to 10 based on correctness, clarity, and depth.
Also suggest how the candidate can improve.

Respond in this format:
Score: <number>
Suggestion: <text>`;
};

// Start a new interview
export const startInterview = async (req, res) => {
  try {
    const { userId, interviewType, level, language, field } = req.body;

    const chat = model.startChat();
    const prompt = generatePrompt(interviewType, level, field, language);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const question = response.text().trim();

    const newSession = new InterviewSession({
      userId,
      interviewType,
      level,
      field,
      language,
      answers: [],
    });

    await newSession.save();

    res.status(200).json({
      sessionId: newSession._id,
      question,
    });
  } catch (error) {
    console.error('Error starting interview:', error.message);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

// Submit an answer and evaluate
export const submitAnswer = async (req, res) => {  
  try {
    const { sessionId, question, userAnswer } = req.body;
    const chat = model.startChat();
    const prompt = evaluatePrompt(question, userAnswer);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    const scoreMatch = text.match(/Score:\s*(\d+)/i);
    const suggestionMatch = text.match(/Suggestion:\s*(.+)/i);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : '';

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isFinished) {
      return res.status(403).json({ error: 'This interview session has already been submitted. You cannot answer more questions.' });
    }

    session.answers.push({ question, userAnswer, score, suggestion });

    const totalScore = session.answers.reduce((acc, a) => acc + (a.score || 0), 0);
    const avg = totalScore / session.answers.length;
    session.averageScore = parseFloat(avg.toFixed(2));

    await session.save();

    res.status(200).json({
      score,
      suggestion,
      averageScore: session.averageScore,
    });
  } catch (error) {
    console.error('Error evaluating answer:', error.message);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
};

// Get the next question
export const getNextQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId); // move this up
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isFinished) {
      return res.status(403).json({ error: 'This interview session is already finished. You cannot get more questions.' });
    }

    const prompt = generatePrompt(session.interviewType, session.level, session.field, session.language);
    const chat = model.startChat();
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const question = response.text().trim();

    res.status(200).json({ question });
  } catch (error) {
    console.error('Error getting next question:', error.message);
    res.status(500).json({ error: 'Failed to get next question' });
  }
};

// Finish the interview
export const finishInterview = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isFinished) {
      return res.status(403).json({ error: 'This interview session is already finished. You cannot finish it again.' });
    }

    const totalScore = session.answers.reduce((acc, a) => acc + (a.score || 0), 0);
    const averageScore = session.answers.length
      ? parseFloat((totalScore / session.answers.length).toFixed(2))
      : 0;

    session.averageScore = averageScore;
    session.isFinished = true;

    await session.save();

    const allSuggestions = session.answers
      .map((a, i) => `Q${i + 1}: ${a.suggestion}`)
      .join('\n');

    res.status(200).json({
      message: 'Interview finished',
      totalQuestions: session.answers.length,
      averageScore,
      suggestions: allSuggestions,
    });
  } catch (error) {
    console.error('Error finishing interview:', error.message);
    res.status(500).json({ error: 'Failed to finish interview' });
  }
};


// Get list of interviews for a user (basic info)
export const getInterviewList = async (req, res) => {
  const { userId } = req.params;
  try {
    const interviews = await InterviewSession.find({ userId })
      .sort({ createdAt: -1 })
      .select('_id interviewType level language field averageScore createdAt');
    res.status(200).json(interviews);
  } catch (error) {
    console.error('Error fetching interview list:', error.message);
    res.status(500).json({ error: 'Failed to fetch interviews', details: error.message });
  }
};

// Get full interview details by ID
export const getInterviewDetails = async (req, res) => {
  const { interviewId } = req.params;
  try {
    const interview = await InterviewSession.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.status(200).json(interview);
  } catch (error) {
    console.error('Error fetching interview details:', error.message);
    res.status(500).json({ error: 'Failed to fetch interview details', details: error.message });
  }
};
