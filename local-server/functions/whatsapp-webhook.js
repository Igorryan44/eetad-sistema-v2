/**
 * 📱 Função: whatsapp-webhook
 * Recebe webhooks do WhatsApp Evolution API e responde via AI Chatbot
 */

import { Router } from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const router = Router();

// Cache para rate limiting
const messageCache = new Map();
const RATE_LIMIT = 5; // mensagens por minuto
const RATE_WINDOW = 60 * 1000; // 1 minuto

// Função para verificar rate limit
function checkRateLimit(phone) {
  const now = Date.now();
  const userData = messageCache.get(phone);

  if (!userData) {
    messageCache.set(phone, { count: 1, timestamp: now });
    return true;
  }

  if (now - userData.timestamp > RATE_WINDOW) {
    messageCache.set(phone, { count: 1, timestamp: now });
    return true;
  }

  if (userData.count >= RATE_LIMIT) {
    return false;
  }

  userData.count++;
  return true;
}

// Função para ler configurações
function getStoredConfig() {
  try {
    const configPath = path.join(process.cwd(), '..', 'config', 'settings.json');
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const settings = JSON.parse(configData);
      return {
        whatsappConfig: settings.whatsappConfig || null,
        secretaryInfo: settings.secretaryInfo || null,
        aiConfig: settings.aiConfig || null
      };
    }
  } catch (error) {
    console.log('📱 [whatsapp-webhook] Erro ao ler configurações:', error.message);
  }
  return { whatsappConfig: null, secretaryInfo: null, aiConfig: null };
}

// Função para sanitizar número de telefone
function sanitizePhoneNumber(phone) {
  return phone.replace(/\D/g, '');
}

// Função para validar payload do webhook
function validateWebhookPayload(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.instance === 'string' &&
    data.data &&
    typeof data.data.key === 'object' &&
    typeof data.data.key.remoteJid === 'string' &&
    typeof data.data.message === 'object'
  );
}

// Função para processar mensagem via AI Chatbot
async function processMessageWithAI(phone, message, senderName) {
  try {
    console.log(`🤖 [whatsapp-webhook] Processando mensagem via AI para ${phone}: ${message}`);
    
    // Chamar o AI Chatbot local
    const response = await fetch('http://localhost:3003/functions/ai-chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: phone, // Usar telefone como userId
        context: {
          platform: 'whatsapp',
          senderName: senderName
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro AI Chatbot: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.response;
    } else {
      throw new Error(result.error || 'Erro desconhecido no AI Chatbot');
    }

  } catch (error) {
    console.error('🤖 [whatsapp-webhook] Erro ao processar mensagem:', error);
    return `Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.

📞 Para atendimento humano:
- Segunda a Sexta: 8h às 17h
- Telefone: (63) 3221-1234
- Email: contato@eetad.com.br

🙏 Obrigado pela compreensão!`;
  }
}

// Função para enviar resposta via WhatsApp
async function sendWhatsAppResponse(phone, message) {
  try {
    const storedConfig = getStoredConfig();
    
    const evolutionApiUrl = storedConfig.whatsappConfig?.url || process.env.EVOLUTION_API_URL;
    const evolutionApiKey = storedConfig.whatsappConfig?.apiKey || process.env.EVOLUTION_API_KEY;
    const instanceName = storedConfig.whatsappConfig?.instance || process.env.EVOLUTION_INSTANCE_NAME;

    if (!evolutionApiUrl || !evolutionApiKey || !instanceName) {
      throw new Error('Configuração Evolution API incompleta');
    }

    const endpoint = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instanceName)}`;
    
    const payload = {
      number: phone,
      text: message
    };

    console.log(`📱 [whatsapp-webhook] Enviando resposta para ${phone}:`, endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao enviar mensagem: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📱 [whatsapp-webhook] Resposta enviada com sucesso:', result);
    
    return result;

  } catch (error) {
    console.error('📱 [whatsapp-webhook] Erro ao enviar resposta:', error);
    throw error;
  }
}

// Endpoint principal do webhook
router.post('/', async (req, res) => {
  try {
    console.log('📱 [whatsapp-webhook] Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    const webhookData = req.body;
    
    // Validar payload
    if (!validateWebhookPayload(webhookData)) {
      console.log('📱 [whatsapp-webhook] Payload inválido');
      return res.status(400).json({ error: 'Payload inválido' });
    }

    // Verificar se é uma mensagem válida e não é do próprio bot
    if (!webhookData.data || webhookData.data.key.fromMe) {
      console.log('📱 [whatsapp-webhook] Mensagem ignorada (do próprio bot ou inválida)');
      return res.json({ status: 'OK', message: 'Mensagem ignorada' });
    }

    const message = webhookData.data.message;
    const messageText = message.conversation || message.extendedTextMessage?.text || '';
    
    if (!messageText.trim()) {
      console.log('📱 [whatsapp-webhook] Mensagem vazia ignorada');
      return res.json({ status: 'OK', message: 'Mensagem vazia' });
    }

    const senderPhone = sanitizePhoneNumber(webhookData.data.key.remoteJid.replace('@s.whatsapp.net', ''));
    const senderName = webhookData.data.pushName;

    console.log(`📱 [whatsapp-webhook] Mensagem recebida de ${senderPhone} (${senderName}): ${messageText}`);

    // Verificar rate limit
    if (!checkRateLimit(senderPhone)) {
      console.log(`📱 [whatsapp-webhook] Rate limit atingido para ${senderPhone}`);
      await sendWhatsAppResponse(senderPhone, "🕐 Você está enviando muitas mensagens. Aguarde um momento antes de enviar mais mensagens. Obrigado!");
      return res.json({ status: 'OK', message: 'Rate limit aplicado' });
    }

    // Processar mensagem com AI
    const aiResponse = await processMessageWithAI(senderPhone, messageText, senderName);

    // Enviar resposta
    await sendWhatsAppResponse(senderPhone, aiResponse);

    console.log('📱 [whatsapp-webhook] Processamento concluído com sucesso');

    return res.json({ 
      status: 'OK', 
      message: 'Mensagem processada e resposta enviada',
      processed: {
        phone: senderPhone,
        name: senderName,
        message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
        responseLength: aiResponse.length
      }
    });

  } catch (error) {
    console.error('📱 [whatsapp-webhook] Erro geral:', error);
    
    // Tentar enviar mensagem de erro para o usuário
    try {
      const senderPhone = sanitizePhoneNumber(req.body?.data?.key?.remoteJid?.replace('@s.whatsapp.net', '') || '');
      if (senderPhone) {
        await sendWhatsAppResponse(senderPhone, 
          `🤖 Desculpe, ocorreu um erro técnico. Nossa equipe foi notificada.

📞 Para atendimento imediato:
- Segunda a Sexta: 8h às 17h  
- WhatsApp: (63) 9 8511-2006

🙏 Pedimos desculpas pelo inconveniente!`
        );
      }
    } catch (errorSendError) {
      console.error('📱 [whatsapp-webhook] Erro ao enviar mensagem de erro:', errorSendError);
    }
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: '✅ Webhook WhatsApp operacional',
    timestamp: new Date().toISOString(),
    rateLimit: {
      messagesPerMinute: RATE_LIMIT,
      windowMs: RATE_WINDOW
    }
  });
});

// Endpoint para testar o webhook manualmente
router.post('/test', async (req, res) => {
  try {
    const { phone, message, name } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        error: 'Telefone e mensagem são obrigatórios',
        example: {
          phone: '5563985112006',
          message: 'Olá, gostaria de saber sobre meus pedidos',
          name: 'João Silva'
        }
      });
    }

    console.log(`📱 [whatsapp-webhook] Teste manual iniciado para ${phone}: ${message}`);

    // Processar mensagem com AI
    const aiResponse = await processMessageWithAI(phone, message, name || 'Usuário Teste');

    return res.json({
      success: true,
      test: {
        phone: phone,
        message: message,
        name: name,
        aiResponse: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('📱 [whatsapp-webhook] Erro no teste:', error);
    return res.status(500).json({
      error: 'Erro no teste',
      message: error.message
    });
  }
});

export default router;