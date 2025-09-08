/**
 * 📱 Função: send-whatsapp-notification
 * Envia notificações via WhatsApp usando Evolution API
 */

import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.post('/', async (req, res) => {
  try {
    console.log('📱 [send-whatsapp-notification] Processando notificação...');
    
    const notification = req.body;
    
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
    const secretaryWhatsApp = process.env.SECRETARY_WHATSAPP_NUMBER;

    console.log("📱 [send-whatsapp-notification] Verificando variáveis de ambiente:", {
      evolutionApiUrl: evolutionApiUrl ? "✓ Configurada" : "✗ Não configurada",
      evolutionApiKey: evolutionApiKey ? "✓ Configurada" : "✗ Não configurada",
      instanceName: instanceName ? "✓ Configurada" : "✗ Não configurada",
      secretaryWhatsApp: secretaryWhatsApp ? "✓ Configurada" : "✗ Não configurada",
    });

    if (!evolutionApiUrl || !evolutionApiKey || !instanceName || !secretaryWhatsApp) {
      console.error("📱 [send-whatsapp-notification] Variáveis de ambiente faltando");
      return res.status(500).json({ 
        error: 'Configuração incompleta: verifique as variáveis de ambiente',
        missing: {
          evolutionApiUrl: !evolutionApiUrl,
          evolutionApiKey: !evolutionApiKey,
          instanceName: !instanceName,
          secretaryWhatsApp: !secretaryWhatsApp
        }
      });
    }

    console.log('📱 [send-whatsapp-notification] Processando notificação:', notification.type);

    let message = '';
    let recipient = secretaryWhatsApp;

    switch (notification.type) {
      case 'registration':
        message = `🎓 NOVA MATRÍCULA REALIZADA

📋 Dados do Aluno:
• Nome: ${notification.studentData.nome}
• CPF: ${notification.studentData.cpf}
• Email: ${notification.studentData.email}
• Telefone: ${notification.studentData.telefone}
• Ciclo: ${notification.studentData.ciclo}

📍 Verificar dados na planilha "alunos matriculados"`;
        break;

      case 'pending_registration':
        message = `📝 NOVA SOLICITAÇÃO DE MATRÍCULA

👤 Dados do Interessado:
• Nome: ${notification.studentData.nome}
• CPF: ${notification.studentData.cpf}
• Email: ${notification.studentData.email}
• Telefone: ${notification.studentData.telefone || 'Não informado'}

⏳ Aguardando aprovação da secretaria
📍 Verificar dados na planilha "pendentes"`;
        break;

      case 'student_pending':
        message = `🎓 Solicitação de matrícula recebida!

✅ Sua solicitação foi enviada com sucesso!

👤 Nome: ${notification.studentData.nome}
📄 CPF: ${notification.studentData.cpf}
📧 Email: ${notification.studentData.email}

⏳ Sua solicitação está sendo analisada pela secretaria.
📞 Você será contatado em breve com o resultado.

Obrigado pelo interesse na EETAD Núcleo Palmas - TO! 🙏`;
        
        // Para notificação do aluno, usar o telefone do aluno
        recipient = notification.studentData.telefone || secretaryWhatsApp;
        break;

      case 'book_order':
        message = `📚 NOVO PEDIDO DE LIVRO

👤 Aluno: ${notification.studentData.nome}
📄 CPF: ${notification.studentData.cpf}
📖 Livro: ${notification.studentData.livro}
🎯 Ciclo: ${notification.studentData.ciclo}
💰 Preço: R$ ${notification.studentData.preco}

💰 Aguardando pagamento PIX`;
        break;

      case 'payment_confirmed':
        message = `✅ PAGAMENTO CONFIRMADO

💰 Valor: R$ ${notification.paymentData.valor}
👤 Aluno: ${notification.paymentData.nome}
📄 CPF: ${notification.paymentData.cpf}
📖 Livro: ${notification.paymentData.livro}
🎯 Ciclo: ${notification.paymentData.ciclo}
🆔 ID Pagamento: ${notification.paymentData.pagamento_id}

📦 Processar envio do livro`;
        break;

      case 'student_payment_confirmed':
        message = `🎉 Parabéns! Seu pagamento foi confirmado!

✅ Pagamento aprovado com sucesso
📖 Livro: ${notification.paymentData.livro}
🎯 Ciclo: ${notification.paymentData.ciclo}
💰 Valor: R$ ${notification.paymentData.valor}

📦 Seu livro será enviado em breve!
📞 Em caso de dúvidas, entre em contato conosco.

Obrigado por escolher a EETAD Núcleo Palmas - TO! 🙏`;
        
        // Para notificação do aluno, usar o telefone do aluno
        recipient = notification.paymentData.telefone || secretaryWhatsApp;
        break;

      case 'student_registration':
        message = `🎓 Bem-vindo(a) à EETAD Núcleo Palmas - TO!

✅ Sua matrícula foi realizada com sucesso!

👤 Nome: ${notification.studentData.nome}
🎯 Ciclo: ${notification.studentData.ciclo}
📧 Email: ${notification.studentData.email}

📚 Em breve você receberá mais informações sobre como adquirir seus livros e iniciar seus estudos.

📞 Em caso de dúvidas, entre em contato conosco.

Que Deus abençoe seus estudos! 🙏`;
        
        // Para notificação do aluno, usar o telefone do aluno
        recipient = notification.studentData.telefone || secretaryWhatsApp;
        break;

      default:
        throw new Error(`Tipo de notificação não suportado: ${notification.type}`);
    }

    // Normalizar URL da Evolution API
    const baseUrl = evolutionApiUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`;

    console.log("📱 [send-whatsapp-notification] Tentando conectar com Evolution API:", {
      endpoint,
      instanceName,
      recipient
    });

    const whatsappPayload = {
      number: recipient,
      text: message
    };

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
          'User-Agent': 'Local-Server/1.0'
        },
        body: JSON.stringify(whatsappPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log("📱 [send-whatsapp-notification] Resposta da Evolution API:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("📱 [send-whatsapp-notification] Erro na resposta da Evolution API:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Retornar sucesso parcial em vez de erro total
        return res.json({ 
          success: false, 
          warning: `Falha ao enviar WhatsApp (${response.status}): ${response.statusText}`,
          details: errorText
        });
      }

      const result = await response.json();
      console.log('📱 [send-whatsapp-notification] WhatsApp enviado com sucesso:', result);

      res.json({ 
        success: true, 
        message: 'WhatsApp enviado com sucesso',
        result 
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('📱 [send-whatsapp-notification] Erro de conexão com Evolution API:', {
        error: fetchError.message,
        name: fetchError.name,
        endpoint
      });

      // Verificar se é erro de timeout
      if (fetchError.name === 'AbortError') {
        return res.json({ 
          success: false, 
          warning: 'Timeout ao conectar com Evolution API (30s)',
          error: 'TIMEOUT'
        });
      }

      // Outros erros de rede
      res.json({ 
        success: false, 
        warning: 'Falha na conexão com Evolution API',
        error: fetchError.message,
        endpoint
      });
    }

  } catch (error) {
    console.error('📱 [send-whatsapp-notification] Erro geral:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro interno do servidor',
      type: 'INTERNAL_ERROR'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função send-whatsapp-notification operacional' });
});

export default router;