import express from 'express';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🔔 Webhook MercadoPago recebido:', req.body);
    
    res.json({
      success: true,
      message: 'Webhook processado - função em desenvolvimento'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ function: 'mercadopago-webhook', status: 'ok' });
});

export default router;