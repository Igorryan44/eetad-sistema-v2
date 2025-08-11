import express from 'express';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🤖 AI Chatbot requisição:', req.body);
    
    const openAIApiKey = process.env.OPENAI_API_KEY;
    
    if (!openAIApiKey) {
      throw new Error('Chave da OpenAI não configurada');
    }
    
    res.json({
      success: true,
      message: 'Função em desenvolvimento - migração local',
      hasOpenAIKey: !!openAIApiKey
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    function: 'ai-chatbot', 
    status: 'ok',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY
  });
});

export default router;