/**
 * 📱 Função: send-whatsapp-notification
 * Envia notificações via WhatsApp usando Evolution API
 * Configuração via localStorage (menu Configurações) ou fallback para .env
 */

import { Router } from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const router = Router();

// Função para ler configurações do localStorage (salvas via frontend)
function getStoredConfig() {
  try {
    // Caminho para arquivo de configurações salvas pelo frontend
    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    
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
    console.log('📱 [send-whatsapp-notification] Erro ao ler configurações salvas:', error.message);
  }
  return { whatsappConfig: null, secretaryInfo: null, aiConfig: null };
}

router.post('/', async (req, res) => {
  try {
    console.log('📱 [send-whatsapp-notification] Processando notificação...');
    
    const notification = req.body;
    
    // Tentar ler configurações salvas no menu Configurações
    const storedConfig = getStoredConfig();
    
    // Prioridade: Configurações do menu > Variáveis de ambiente
    const evolutionApiUrl = storedConfig.whatsappConfig?.url || process.env.EVOLUTION_API_URL;
    const evolutionApiKey = storedConfig.whatsappConfig?.apiKey || process.env.EVOLUTION_API_KEY;
    const instanceName = storedConfig.whatsappConfig?.instance || process.env.EVOLUTION_INSTANCE_NAME;
    const secretaryWhatsApp = storedConfig.secretaryInfo?.phone || process.env.SECRETARY_WHATSAPP_NUMBER;

    console.log("📱 [send-whatsapp-notification] Verificando configurações:", {
      evolutionApiUrl: evolutionApiUrl ? "✓ Configurada" : "✗ Não configurada",
      evolutionApiKey: evolutionApiKey ? "✓ Configurada" : "✗ Não configurada",
      instanceName: instanceName ? "✓ Configurada" : "✗ Não configurada",
      secretaryWhatsApp: secretaryWhatsApp ? "✓ Configurada" : "✗ Não configurada",
      fonte: storedConfig.whatsappConfig ? "Menu Configurações" : "Variáveis de ambiente"
    });

    if (!evolutionApiUrl || !evolutionApiKey || !instanceName || !secretaryWhatsApp) {
      console.error("📱 [send-whatsapp-notification] Configurações faltando");
      return res.status(500).json({ 
        error: 'Configuração incompleta: verifique as configurações no menu Configurações ou variáveis de ambiente',
        missing: {
          evolutionApiUrl: !evolutionApiUrl,
          evolutionApiKey: !evolutionApiKey,
          instanceName: !instanceName,
          secretaryWhatsApp: !secretaryWhatsApp
        },
        hint: 'Configure o WhatsApp Evolution API no menu Configurações da Secretaria'
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

    // Normalizar URL da Evolution API e tentar diferentes formatos de endpoint
    const baseUrl = evolutionApiUrl.replace(/\/$/, '');
    const endpoints = [
      `${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`,
      `${baseUrl}/message/text/${encodeURIComponent(instanceName)}`,
      `${baseUrl}/sendMessage/${encodeURIComponent(instanceName)}`,
      `${baseUrl}/${encodeURIComponent(instanceName)}/sendText`,
      `${baseUrl}/api/v1/message/sendText/${encodeURIComponent(instanceName)}`
    ];

    console.log("📱 [send-whatsapp-notification] Tentando conectar com Evolution API:", {
      instanceName,
      recipient,
      endpointsToTry: endpoints.length
    });

    const whatsappPayload = {
      number: recipient,
      text: message
    };

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    let lastError = null;
    let successfulEndpoint = null;

    // Tentar diferentes endpoints até encontrar um que funcione
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      
      try {
        console.log(`📱 [send-whatsapp-notification] Tentativa ${i + 1}/${endpoints.length}: ${endpoint}`);
        
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

        console.log(`📱 [send-whatsapp-notification] Resposta do endpoint ${i + 1}:`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          clearTimeout(timeoutId);
          
          const result = await response.json();
          console.log('📱 [send-whatsapp-notification] WhatsApp enviado com sucesso:', result);
          successfulEndpoint = endpoint;

          return res.json({ 
            success: true, 
            message: 'WhatsApp enviado com sucesso',
            endpoint: successfulEndpoint,
            result 
          });
        } else {
          const errorText = await response.text();
          lastError = {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            endpoint
          };
          console.log(`📱 [send-whatsapp-notification] Endpoint ${i + 1} falhou:`, lastError);
        }
        
      } catch (endpointError) {
        console.log(`📱 [send-whatsapp-notification] Erro no endpoint ${i + 1}:`, {
          endpoint,
          error: endpointError.message,
          name: endpointError.name
        });
        
        lastError = {
          error: endpointError.message,
          name: endpointError.name,
          endpoint
        };
        
        // Se for timeout, parar de tentar outros endpoints
        if (endpointError.name === 'AbortError') {
          clearTimeout(timeoutId);
          return res.json({ 
            success: false, 
            warning: 'Timeout ao conectar com Evolution API (30s)',
            error: 'TIMEOUT',
            triedEndpoints: endpoints.slice(0, i + 1)
          });
        }
      }
    }
    
    // Se chegou aqui, nenhum endpoint funcionou
    clearTimeout(timeoutId);
    
    console.error('📱 [send-whatsapp-notification] Todos os endpoints falharam:', lastError);
    
    return res.json({ 
      success: false, 
      warning: 'Falha ao conectar com todos os endpoints da Evolution API',
      error: lastError,
      triedEndpoints: endpoints
    });

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