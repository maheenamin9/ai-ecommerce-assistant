import Conversation from '../models/Conversation.js';
import { streamWithTools, transcribeAudio, generateSpeech } from '../services/openaiService.js';
import { v4 as uuidv4 } from 'uuid';

export const sendMessage = async (req, res) => {
  const { message, sessionId, inputType = 'text' } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required' });
  }

  try {
    const userId = req.user._id;
    let conversation = await Conversation.findOne({ sessionId, userId });

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        userId,
        title: message.substring(0, 50),
        messages: [],
      });
    }

    conversation.messages.push({ role: 'user', content: message, metadata: { inputType } });

    const contextMessages = conversation.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Server-Sent Events (SSE) — a protocol that keeps the HTTP connection open so the server can push data to the browser in real-time, instead of sending one response and closing.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const fullResponse = await streamWithTools(contextMessages, res);

    conversation.messages.push({ role: 'assistant', content: fullResponse });
    await conversation.save();

    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
};

export const transcribeVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const text = await transcribeAudio(req.file.buffer, req.file.mimetype);
    res.json({ text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
};

export const textToSpeech = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const audioBuffer = await generateSpeech(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id, isActive: true })
      .select('sessionId title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const deleted = await Conversation.findOneAndDelete({
      sessionId: req.params.sessionId,
      userId: req.user._id,
    });
    if (!deleted) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

export const createSession = async (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
};
