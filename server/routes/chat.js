import express from 'express';
import multer from 'multer';
import {
  sendMessage,
  transcribeVoice,
  textToSpeech,
  getConversations,
  getConversation,
  deleteConversation,
  createSession,
} from '../controllers/chatController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(protect);

router.post('/session', createSession);
router.post('/message', sendMessage);
router.post('/transcribe', upload.single('audio'), transcribeVoice);
router.post('/tts', textToSpeech);
router.get('/conversations', getConversations);
router.get('/conversations/:sessionId', getConversation);
router.delete('/conversations/:sessionId', deleteConversation);

export default router;
