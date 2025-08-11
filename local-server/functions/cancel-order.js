import express from 'express';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('❌ Cancelando pedido:', req.body);
    
    const { orderId, reason } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'ID do pedido é obrigatório'
      });
    }
    
    // TODO: Implementar lógica de cancelamento
    // - Atualizar status na planilha
    // - Cancelar pagamento no MercadoPago se necessário
    // - Enviar notificação
    
    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
      orderId,
      reason: reason || 'Não informado'
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ function: 'cancel-order', status: 'ok' });
});

export default router;