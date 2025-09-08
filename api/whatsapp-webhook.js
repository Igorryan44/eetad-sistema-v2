// Versão Serverless para Vercel
import { corsMiddleware } from '../local-server/utils/cors.js';

// Cache para rate limiting
const messageCache = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

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

function sanitizePhoneNumber(phone) {
  return phone.replace(/\D/g, '');
}

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

async function processMessageWithAI(phone, message, senderName) {
  try {
    console.log(`🤖 Processando mensagem via AI para ${phone}: ${message}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sistema.eetad.com.br'}/api/ai-chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: phone,
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
    console.error('🤖 Erro ao processar mensagem:', error);
    return `Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.

📞 Para atendimento humano:
- Segunda a Sexta: 8h às 17h
- Telefone: (63) 3221-1234
- Email: contato@eetad.com.br

🙏 Obrigado pela compreensão!`;
  }
}

async function sendWhatsAppResponse(phone, message) {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!evolutionApiUrl || !evolutionApiKey || !instanceName) {
      throw new Error('Configuração Evolution API incompleta');
    }

    const endpoint = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instanceName)}`;
    
    const payload = {
      number: phone,
      text: message
    };

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
    console.log('📱 Resposta enviada com sucesso:', result);
    
    return result;

  } catch (error) {
    console.error('📱 Erro ao enviar resposta:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ 
      status: '✅ Webhook WhatsApp operacional (Vercel)',
      timestamp: new Date().toISOString(),
      rateLimit: {
        messagesPerMinute: RATE_LIMIT,
        windowMs: RATE_WINDOW
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('📱 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    const webhookData = req.body;
    
    if (!validateWebhookPayload(webhookData)) {
      console.log('📱 Payload inválido');
      return res.status(400).json({ error: 'Payload inválido' });
    }

    if (!webhookData.data || webhookData.data.key.fromMe) {
      console.log('📱 Mensagem ignorada (do próprio bot ou inválida)');
      return res.json({ status: 'OK', message: 'Mensagem ignorada' });
    }

    const message = webhookData.data.message;
    const messageText = message.conversation || message.extendedTextMessage?.text || '';
    
    if (!messageText.trim()) {
      console.log('📱 Mensagem vazia ignorada');
      return res.json({ status: 'OK', message: 'Mensagem vazia' });
    }

    const senderPhone = sanitizePhoneNumber(webhookData.data.key.remoteJid.replace('@s.whatsapp.net', ''));
    const senderName = webhookData.data.pushName;

    console.log(`📱 Mensagem recebida de ${senderPhone} (${senderName}): ${messageText}`);

    if (!checkRateLimit(senderPhone)) {
      console.log(`📱 Rate limit atingido para ${senderPhone}`);
      await sendWhatsAppResponse(senderPhone, "🕐 Você está enviando muitas mensagens. Aguarde um momento antes de enviar mais mensagens. Obrigado!");
      return res.json({ status: 'OK', message: 'Rate limit aplicado' });
    }

    const aiResponse = await processMessageWithAI(senderPhone, messageText, senderName);
    await sendWhatsAppResponse(senderPhone, aiResponse);

    console.log('📱 Processamento concluído com sucesso');

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
    console.error('📱 Erro geral:', error);
    
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
      console.error('📱 Erro ao enviar mensagem de erro:', errorSendError);
    }
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}