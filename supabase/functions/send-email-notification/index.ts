import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotification {
  type: 'registration' | 'payment_confirmed';
  studentData: {
    nome: string;
    email: string;
    cpf?: string;
    telefone?: string;
    ciclo?: string;
    livro?: string;
    valor?: string;
  };
}

// Função para enviar email usando SMTP
async function sendEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPassword = Deno.env.get('SMTP_PASSWORD');
  const fromEmail = Deno.env.get('FROM_EMAIL') || smtpUser;
  const fromName = Deno.env.get('FROM_NAME') || 'EETAD - Núcleo Palmas TO';

  if (!smtpUser || !smtpPassword) {
    console.error('Credenciais SMTP não configuradas');
    throw new Error('Credenciais SMTP não configuradas');
  }

  // Preparar dados do email
  const emailData = {
    from: `${fromName} <${fromEmail}>`,
    to: to,
    subject: subject,
    text: textContent,
    html: htmlContent
  };

  // Usar serviço de email externo (exemplo com API simples)
  try {
    // Para desenvolvimento, vamos simular o envio
    console.log('📧 Email enviado:', {
      to: to,
      subject: subject,
      from: emailData.from
    });
    
    // Em produção, aqui você integraria com um serviço real como:
    // - Resend API
    // - SendGrid API
    // - Amazon SES
    // - Ou SMTP direto
    
    return { success: true, messageId: `sim_${Date.now()}` };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

// Templates de email
function getRegistrationEmailTemplate(studentData: any) {
  const subject = '✅ Matrícula Confirmada - EETAD Núcleo Palmas TO';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 EETAD - Núcleo Palmas TO</h1>
          <p>Matrícula Confirmada com Sucesso!</p>
        </div>
        
        <div class="content">
          <h2>Olá, ${studentData.nome}!</h2>
          
          <p>Sua matrícula foi confirmada com sucesso! Seja bem-vindo(a) à EETAD.</p>
          
          <div class="info-box">
            <h3>📋 Dados da Matrícula:</h3>
            <p><strong>Nome:</strong> ${studentData.nome}</p>
            <p><strong>Email:</strong> ${studentData.email}</p>
            <p><strong>CPF:</strong> ${studentData.cpf || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${studentData.telefone || 'Não informado'}</p>
            ${studentData.ciclo ? `<p><strong>Ciclo:</strong> ${studentData.ciclo}</p>` : ''}
          </div>
          
          <div class="info-box">
            <h3>📚 Próximos Passos:</h3>
            <ul>
              <li>Acesse a plataforma da EETAD para fazer pedidos de livros</li>
              <li>Entre em contato com a secretaria para obter o link de acesso</li>
              <li>Acompanhe suas mensagens no WhatsApp para atualizações</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3>📞 Contato:</h3>
            <p><strong>WhatsApp:</strong> Entre em contato conosco pelo WhatsApp</p>
            <p><strong>Email:</strong> contato@eetad.com.br</p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Em caso de dúvidas, entre em contato conosco.</p>
            <p>© 2024 EETAD - Núcleo Palmas TO</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
EETAD - Núcleo Palmas TO
Matrícula Confirmada com Sucesso!

Olá, ${studentData.nome}!

Sua matrícula foi confirmada com sucesso! Seja bem-vindo(a) à EETAD.

DADOS DA MATRÍCULA:
- Nome: ${studentData.nome}
- Email: ${studentData.email}
- CPF: ${studentData.cpf || 'Não informado'}
- Telefone: ${studentData.telefone || 'Não informado'}
${studentData.ciclo ? `- Ciclo: ${studentData.ciclo}` : ''}

PRÓXIMOS PASSOS:
- Acesse a plataforma da EETAD para fazer pedidos de livros
- Entre em contato com a secretaria para obter o link de acesso
- Acompanhe suas mensagens no WhatsApp para atualizações

CONTATO:
- WhatsApp: Entre em contato conosco pelo WhatsApp
- Email: contato@eetad.com.br

Este é um email automático. Em caso de dúvidas, entre em contato conosco.
© 2024 EETAD - Núcleo Palmas TO
  `;
  
  return { subject, htmlContent, textContent };
}

function getPaymentConfirmationEmailTemplate(studentData: any) {
  const subject = '💰 Pagamento Confirmado - EETAD Núcleo Palmas TO';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
        .success-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 EETAD - Núcleo Palmas TO</h1>
          <p>Pagamento Confirmado!</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 30px;">
            <span class="success-badge">✅ PAGAMENTO APROVADO</span>
          </div>
          
          <h2>Olá, ${studentData.nome}!</h2>
          
          <p>Seu pagamento foi confirmado com sucesso! Obrigado pela confiança.</p>
          
          <div class="info-box">
            <h3>📋 Detalhes do Pagamento:</h3>
            <p><strong>Nome:</strong> ${studentData.nome}</p>
            ${studentData.livro ? `<p><strong>Livro:</strong> ${studentData.livro}</p>` : ''}
            ${studentData.ciclo ? `<p><strong>Ciclo:</strong> ${studentData.ciclo}</p>` : ''}
            ${studentData.valor ? `<p><strong>Valor:</strong> R$ ${studentData.valor}</p>` : ''}
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div class="info-box">
            <h3>📦 Próximos Passos:</h3>
            <ul>
              <li>Seu livro será enviado em breve</li>
              <li>Você receberá o código de rastreamento por WhatsApp</li>
              <li>Acompanhe o status do seu pedido através do nosso assistente virtual</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3>📞 Contato:</h3>
            <p>Em caso de dúvidas, entre em contato conosco:</p>
            <p><strong>WhatsApp:</strong> Envie uma mensagem para nosso assistente virtual</p>
            <p><strong>Email:</strong> contato@eetad.com.br</p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Em caso de dúvidas, entre em contato conosco.</p>
            <p>© 2024 EETAD - Núcleo Palmas TO</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
EETAD - Núcleo Palmas TO
Pagamento Confirmado!

✅ PAGAMENTO APROVADO

Olá, ${studentData.nome}!

Seu pagamento foi confirmado com sucesso! Obrigado pela confiança.

DETALHES DO PAGAMENTO:
- Nome: ${studentData.nome}
${studentData.livro ? `- Livro: ${studentData.livro}` : ''}
${studentData.ciclo ? `- Ciclo: ${studentData.ciclo}` : ''}
${studentData.valor ? `- Valor: R$ ${studentData.valor}` : ''}
- Data: ${new Date().toLocaleDateString('pt-BR')}

PRÓXIMOS PASSOS:
- Seu livro será enviado em breve
- Você receberá o código de rastreamento por WhatsApp
- Acompanhe o status do seu pedido através do nosso assistente virtual

CONTATO:
Em caso de dúvidas, entre em contato conosco:
- WhatsApp: Envie uma mensagem para nosso assistente virtual
- Email: contato@eetad.com.br

Este é um email automático. Em caso de dúvidas, entre em contato conosco.
© 2024 EETAD - Núcleo Palmas TO
  `;
  
  return { subject, htmlContent, textContent };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: EmailNotification = await req.json();
    
    console.log('📧 Processando notificação por email:', notification);

    if (!notification.studentData.email) {
      throw new Error('Email do aluno não fornecido');
    }

    let emailTemplate;
    
    switch (notification.type) {
      case 'registration':
        emailTemplate = getRegistrationEmailTemplate(notification.studentData);
        break;
      case 'payment_confirmed':
        emailTemplate = getPaymentConfirmationEmailTemplate(notification.studentData);
        break;
      default:
        throw new Error(`Tipo de notificação não suportado: ${notification.type}`);
    }

    // Enviar email
    const result = await sendEmail(
      notification.studentData.email,
      emailTemplate.subject,
      emailTemplate.htmlContent,
      emailTemplate.textContent
    );

    console.log('✅ Email enviado com sucesso:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso',
        messageId: result.messageId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
};

serve(handler);