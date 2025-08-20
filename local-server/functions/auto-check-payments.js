import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

// Armazenar intervalos ativos para cada pagamento
const activePolling = new Map();

/**
 * Inicia verificação automática de um pagamento específico
 */
router.post('/start', async (req, res) => {
  try {
    const { payment_id, external_reference, interval = 60000 } = req.body; // 60 segundos por padrão (otimizado)
    
    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do pagamento é obrigatório'
      });
    }
    
    // Se já existe polling para este pagamento, parar o anterior
    if (activePolling.has(payment_id)) {
      clearInterval(activePolling.get(payment_id));
    }
    
    console.log(`🔄 Iniciando verificação automática para pagamento: ${payment_id}`);
    
    // Função para verificar o status
    const checkPayment = async () => {
      try {
        console.log(`🔍 Verificando automaticamente pagamento: ${payment_id}`);
        
        const response = await fetch('http://localhost:3003/functions/check-payment-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ payment_id })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.payment) {
            const { status, date_approved } = result.payment;
            
            console.log(`📊 Status atual: ${status}`);
            
            // Se o pagamento foi aprovado, parar o polling e processar
            if (status === 'approved') {
              console.log(`✅ Pagamento aprovado! Parando verificação automática.`);
              
              // Parar o polling
              if (activePolling.has(payment_id)) {
                clearInterval(activePolling.get(payment_id));
                activePolling.delete(payment_id);
              }
              
              // Processar o pagamento aprovado (similar ao webhook)
              await processApprovedPayment(result.payment);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Erro na verificação automática: ${error.message}`);
      }
    };
    
    // Verificar imediatamente
    await checkPayment();
    
    // Configurar intervalo de verificação
    const intervalId = setInterval(checkPayment, interval);
    activePolling.set(payment_id, intervalId);
    
    // Configurar timeout para parar após 15 minutos
    setTimeout(() => {
      if (activePolling.has(payment_id)) {
        console.log(`⏰ Timeout: Parando verificação automática para ${payment_id}`);
        clearInterval(activePolling.get(payment_id));
        activePolling.delete(payment_id);
      }
    }, 15 * 60 * 1000); // 15 minutos (otimizado)
    
    res.json({
      success: true,
      message: 'Verificação automática iniciada',
      payment_id,
      interval,
      timeout: '15 minutos'
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar verificação automática:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Para a verificação automática de um pagamento específico
 */
router.post('/stop', async (req, res) => {
  try {
    const { payment_id } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do pagamento é obrigatório'
      });
    }
    
    if (activePolling.has(payment_id)) {
      clearInterval(activePolling.get(payment_id));
      activePolling.delete(payment_id);
      
      console.log(`🛑 Verificação automática parada para: ${payment_id}`);
      
      res.json({
        success: true,
        message: 'Verificação automática parada',
        payment_id
      });
    } else {
      res.json({
        success: false,
        message: 'Nenhuma verificação ativa encontrada para este pagamento',
        payment_id
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao parar verificação automática:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Lista verificações ativas
 */
router.get('/status', (req, res) => {
  const activePayments = Array.from(activePolling.keys());
  
  res.json({
    success: true,
    active_polling: activePayments,
    total: activePayments.length
  });
});

/**
 * Processa um pagamento aprovado (similar à lógica do webhook)
 */
async function processApprovedPayment(paymentData) {
  try {
    const { 
      id: paymentId,
      external_reference, 
      transaction_amount, 
      date_approved, 
      payer,
      payment_method
    } = paymentData;
    
    console.log(`🎯 Processando pagamento aprovado: ${paymentId}`);
    
    if (!external_reference) {
      console.log('⚠️ External reference não encontrada');
      return;
    }
    
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
          observacoes: `Confirmado automaticamente via polling - ID: ${paymentId}`
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
          observacoes: `Confirmado automaticamente via polling - ID: ${paymentId}`
        })
      });
    }
    
    if (confirmationResponse.ok) {
      const confirmationResult = await confirmationResponse.json();
      console.log(`✅ Pagamento confirmado automaticamente:`, confirmationResult);
    } else {
      const errorText = await confirmationResponse.text();
      console.error(`❌ Erro na confirmação automática: ${confirmationResponse.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento aprovado:', error);
  }
}

router.get('/health', (req, res) => {
  res.json({ 
    function: 'auto-check-payments', 
    status: 'ok',
    active_polling: activePolling.size,
    hasToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN
  });
});

export default router;