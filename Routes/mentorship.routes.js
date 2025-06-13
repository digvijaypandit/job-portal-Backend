import express from 'express';
import {
  askMentor,
  getUserChats,
  getChatHistory
} from '../controllers/MentorshipSession.controller.js';

const router = express.Router();

router.post('/ask', askMentor);
router.get('/chats/:userId', getUserChats);
router.get('/history/:chatId', getChatHistory);

export default router;
