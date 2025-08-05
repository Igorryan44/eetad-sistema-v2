import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppNotification {
  type: 'registration' | 'book_order' | 'payment_confirmed' | 'student_payment_confirmed' | 'student_registration';
  studentData?: any;
  orderData?: any;
  paymentData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: WhatsAppNotification = await req.json();
    
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    const secretaryWhatsApp = Deno.env.get('SECRETARY_WHATSAPP_NUMBER');

    console.log("[send-whatsapp-notification] Verificando variáveis de ambiente:", {
      evolutionApiUrl: evolutionApiUrl ? "✓ Configurada" : "✗ Não configurada",
      evolutionApiKey: evolutionApiKey ? "✓ Configurada" : "✗ Não configurada",
      instanceName: instanceName ? "✓ Configurada" : "✗ Não configurada",
      secretaryWhatsApp: secretaryWhatsApp ? "✓ Configurada" : "✗ Não configurada",
    });

    if (!evolutionApiUrl || !evolutionApiKey || !instanceName || !secretaryWhatsApp) {
      console.error("[send-whatsapp-notification] Variáveis de ambiente faltando");
      return new Response(
        JSON.stringify({ 
          error: 'Configuração incompleta: verifique as variáveis de ambiente',
          missing: {
            evolutionApiUrl: !evolutionApiUrl,
            evolutionApiKey: !evolutionApiKey,
            instanceName: !instanceName,
            secretaryWhatsApp: !secretaryWhatsApp
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[send-whatsapp-notification] Processando notificação:', notification.type);

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

      case 'book_order':
        message = `📚 NOVO PEDIDO DE LIVRO

👤 Aluno: ${notification.orderData.nome_do_aluno}
📄 CPF: ${notification.orderData.cpf}
📖 Livro: ${notification.orderData.livro}
🎯 Ciclo: ${notification.orderData.ciclo}
📅 Data: ${notification.orderData.data_pedido}

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

    console.log("[send-whatsapp-notification] Tentando conectar com Evolution API:", {
      endpoint,
      instanceName,
      recipient
    });

    const whatsappPayload = {
      number: recipient,
      text: message
    };

    // Configurar timeout e retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify(whatsappPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log("[send-whatsapp-notification] Resposta da Evolution API:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[send-whatsapp-notification] Erro na resposta da Evolution API:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Retornar sucesso parcial em vez de erro total
        return new Response(JSON.stringify({ 
          success: false, 
          warning: `Falha ao enviar WhatsApp (${response.status}): ${response.statusText}`,
          details: errorText
        }), {
          status: 200, // Retorna 200 para não quebrar o fluxo principal
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await response.json();
      console.log('[send-whatsapp-notification] WhatsApp enviado com sucesso:', result);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'WhatsApp enviado com sucesso',
        result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.error('[send-whatsapp-notification] Erro de conexão com Evolution API:', {
        error: fetchError.message,
        name: fetchError.name,
        endpoint
      });

      // Verificar se é erro de timeout
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({ 
          success: false, 
          warning: 'Timeout ao conectar com Evolution API (30s)',
          error: 'TIMEOUT'
        }), {
          status: 200, // Retorna 200 para não quebrar o fluxo principal
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Outros erros de rede
      return new Response(JSON.stringify({ 
        success: false, 
        warning: 'Falha na conexão com Evolution API',
        error: fetchError.message,
        endpoint
      }), {
        status: 200, // Retorna 200 para não quebrar o fluxo principal
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('[send-whatsapp-notification] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor',
        type: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);