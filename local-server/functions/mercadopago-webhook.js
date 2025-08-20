import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import fetch from 'node-fetch';
import crypto from 'crypto';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Webhook do Mercado Pago para processar notificações de pagamento
 * Integrado com a nova lógica de PIX mensais
 */
router.post('/', async (req, res) => {
  try {
    console.log('🔔 Webhook do Mercado Pago recebido:', JSON.stringify(req.body, null, 2));
    
    const { action, data, type, date_created, live_mode, user_id } = req.body;
    
    // Validar estrutura básica do webhook
    if (!action || !data || !data.id) {
      console.log('⚠️ Webhook inválido: estrutura de dados incompleta');
      return res.status(400).json({ 
        error: 'Estrutura de webhook inválida' 
      });
    }

    // Processar apenas eventos de pagamento
    if (action !== 'payment.updated' && action !== 'payment.created') {
      console.log(`ℹ️ Evento ignorado: ${action}`);
      return res.status(200).json({ 
        message: 'Evento não processado',
        action: action 
      });
    }

    const paymentId = data.id;
    console.log(`💳 Processando pagamento ID: ${paymentId}`);

    // Consultar detalhes do pagamento na API do Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('❌ Token de acesso do Mercado Pago não configurado');
      return res.status(500).json({ 
        error: 'Configuração do Mercado Pago incompleta' 
      });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      console.error(`❌ Erro ao consultar pagamento: ${paymentResponse.status}`);
      return res.status(500).json({ 
        error: 'Erro ao consultar dados do pagamento' 
      });
    }

    const paymentData = await paymentResponse.json();
    console.log(`📊 Dados do pagamento:`, JSON.stringify(paymentData, null, 2));

    const { 
      status, 
      external_reference, 
      transaction_amount, 
      date_approved, 
      payer,
      payment_method
    } = paymentData;

    // Processar apenas pagamentos aprovados
    if (status !== 'approved') {
      console.log(`ℹ️ Pagamento não aprovado. Status: ${status}`);
      return res.status(200).json({ 
        message: 'Pagamento não aprovado',
        status: status,
        payment_id: paymentId
      });
    }

    // Verificar se é um PIX
    if (payment_method?.type !== 'instant_payment') {
      console.log(`ℹ️ Método de pagamento não é PIX: ${payment_method?.type}`);
      return res.status(200).json({ 
        message: 'Método de pagamento não é PIX',
        payment_method: payment_method?.type
      });
    }

    if (!external_reference) {
      console.log('⚠️ External reference não encontrada');
      return res.status(400).json({ 
        error: 'External reference não encontrada no pagamento' 
      });
    }

    console.log(`🔍 Confirmando pagamento com external_reference: ${external_reference}`);

    // Determinar qual função de confirmação usar baseado no formato do external_reference
    let confirmationResponse;
    
    // Se contém formato temporal (YYYYMM), usar confirmação mensal
    if (/\d{6}/.test(external_reference)) {
      console.log('📅 Detectado PIX mensal, usando confirm-monthly-pix');
      
      confirmationResponse = await fetch('http://localhost:3003/functions/confirm-monthly-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identificador: external_reference,
          valor_pago: transaction_amount,
          data_pagamento: date_approved,
          comprovante_info: {
            payment_id: paymentId,
            payer_email: payer?.email,
            payer_name: payer?.first_name + ' ' + (payer?.last_name || ''),
            payment_method: payment_method?.id
          },
          observacoes: `Confirmado automaticamente via webhook MP - ID: ${paymentId}`
        })
      });
    } else {
      // Usar confirmação por ID (sistema antigo)
      console.log('🔄 Usando confirm-pix-by-id (sistema legado)');
      
      confirmationResponse = await fetch('http://localhost:3003/functions/confirm-pix-by-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identificador: external_reference,
          valor_pago: transaction_amount,
          data_pagamento: date_approved,
          observacoes: `Confirmado automaticamente via webhook MP - ID: ${paymentId}`
        })
      });
    }

    if (!confirmationResponse.ok) {
      const errorText = await confirmationResponse.text();
      console.error(`❌ Erro na confirmação: ${confirmationResponse.status} - ${errorText}`);
      
      return res.status(500).json({ 
        error: 'Erro ao confirmar pagamento',
        details: errorText,
        payment_id: paymentId,
        external_reference: external_reference
      });
    }

    const confirmationResult = await confirmationResponse.json();
    console.log(`✅ Pagamento confirmado com sucesso:`, confirmationResult);

    return res.status(200).json({
      success: true,
      message: 'Webhook processado e pagamento confirmado',
      payment_id: paymentId,
      external_reference: external_reference,
      status: status,
      amount: transaction_amount,
      date_approved: date_approved,
      confirmation_result: confirmationResult
    });

  } catch (error) {
    console.error('❌ Erro no webhook do Mercado Pago:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

/**
 * Endpoint para validar configuração do webhook
 */
router.get('/health', (req, res) => {
  res.json({
    function: 'mercadopago-webhook',
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    has_access_token: !!process.env.MERCADOPAGO_ACCESS_TOKEN
  });
});

export default router;