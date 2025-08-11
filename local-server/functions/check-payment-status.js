import express from 'express';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🔍 Verificando status do pagamento:', req.body);
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Token do MercadoPago não configurado');
    }
    
    res.json({
      success: true,
      message: 'Função em desenvolvimento - migração local',
      hasToken: !!accessToken
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    function: 'check-payment-status', 
    status: 'ok',
    hasToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN
  });
});

export default router;