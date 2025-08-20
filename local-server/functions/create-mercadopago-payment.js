import express from 'express';
import fetch from 'node-fetch';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('💳 Criando pagamento MercadoPago:', req.body);
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Token do MercadoPago não configurado');
    }

    const { nome, cpf, email, valor, livro, ciclo } = req.body;

    // Criar preferência de pagamento PIX no MercadoPago
    const paymentData = {
      transaction_amount: parseFloat(valor),
      description: `Livro: ${livro} - Ciclo: ${ciclo}`,
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: nome.split(' ')[0],
        last_name: nome.split(' ').slice(1).join(' '),
        identification: {
          type: 'CPF',
          number: cpf.replace(/[^0-9]/g, '')
        }
      },
      external_reference: `${cpf.replace(/[^0-9]/g, '')}-${Date.now()}`
    };

    console.log('💳 Enviando dados para MercadoPago:', paymentData);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': `${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('💳 Resposta do MercadoPago:', result);

    if (!response.ok) {
      throw new Error(`Erro MercadoPago: ${result.message || result.error || 'Erro desconhecido'}`);
    }

    if (result.status !== 'pending' || !result.point_of_interaction?.transaction_data) {
      throw new Error('Falha ao gerar PIX no MercadoPago');
    }

    const pixData = result.point_of_interaction.transaction_data;
    
    res.json({
      success: true,
      payment_id: result.id,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64,
      ticket_url: pixData.ticket_url,
      external_reference: result.external_reference,
      status: result.status
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    function: 'create-mercadopago-payment', 
    status: 'ok',
    hasToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN
  });
});

export default router;