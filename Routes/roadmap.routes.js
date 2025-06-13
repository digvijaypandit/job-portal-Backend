import express from 'express';
import { generateRoadmapNode } from '../controllers/roadmap.controller.js';

const router = express.Router();

router.post('/generate', generateRoadmapNode);

export default router;
