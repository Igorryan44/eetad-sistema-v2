import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🔍 Verificando status do pagamento:', req.body);
    
    const { payment_id } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do pagamento é obrigatório'
      });
    }
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Token do MercadoPago não configurado');
    }
    
    console.log(`💳 Consultando pagamento ID: ${payment_id} no MercadoPago`);
    
    // Consultar status do pagamento na API do MercadoPago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Erro ao consultar MercadoPago: ${response.status}`);
      
      // Se for 404, significa que o pagamento não foi encontrado
      if (response.status === 404) {
        return res.json({
          success: true,
          payment: {
            status: 'not_found',
            message: 'Pagamento não encontrado'
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar status do pagamento no MercadoPago'
      });
    }
    
    const paymentData = await response.json();
    console.log(`📊 Status do pagamento:`, {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount,
      date_approved: paymentData.date_approved,
      payment_method: paymentData.payment_method?.type
    });
    
    res.json({
      success: true,
      payment: {
        id: paymentData.id,
        status: paymentData.status,
        external_reference: paymentData.external_reference,
        transaction_amount: paymentData.transaction_amount,
        date_approved: paymentData.date_approved,
        date_created: paymentData.date_created,
        payment_method: paymentData.payment_method,
        payer: paymentData.payer,
        status_detail: paymentData.status_detail
      }
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