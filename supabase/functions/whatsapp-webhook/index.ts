import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName: string;
}

interface WebhookData {
  instance: string;
  data: WhatsAppMessage;
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

// Função para buscar dados do aluno por telefone
async function getStudentByPhone(phone: string) {
  try {
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    
    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      throw new Error('Configuração do Google Sheets não encontrada');
    }

    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Criar JWT para autenticação Google
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${headerB64}.${payloadB64}`;
    
    // Converter chave privada
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const keyData = await crypto.subtle.importKey(
      'pkcs8', bytes.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5', keyData, encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = `${unsignedToken}.${signatureB64}`;

    // Obter access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Falha na autenticação Google');
    }

    // Buscar na planilha de alunos
    const range = 'alunos matriculados!A:Z';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    const sheetsData = await sheetsResponse.json();
    if (!sheetsData.values || sheetsData.values.length === 0) {
      return null;
    }

    const headers = sheetsData.values[0];
    const rows = sheetsData.values.slice(1);
    
    const phoneColumnIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('telefone'));
    const nomeColumnIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('nome'));
    const cpfColumnIndex = 8; // Coluna I
    
    const phoneClean = phone.replace(/\D/g, '');
    
    for (const row of rows) {
      const rowPhone = row[phoneColumnIndex]?.toString().replace(/\D/g, '') || '';
      if (rowPhone.includes(phoneClean.slice(-8)) || phoneClean.includes(rowPhone.slice(-8))) {
        return {
          nome: row[nomeColumnIndex] || '',
          cpf: row[cpfColumnIndex] || '',
          telefone: row[phoneColumnIndex] || ''
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    return null;
  }
}

// Função para buscar pedidos do aluno
async function getStudentOrders(cpf: string) {
  try {
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    
    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      return [];
    }

    // Mesmo processo de autenticação...
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${headerB64}.${payloadB64}`;
    
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const keyData = await crypto.subtle.importKey(
      'pkcs8', bytes.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5', keyData, encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = `${unsignedToken}.${signatureB64}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return [];
    }

    // Buscar na planilha de pedidos
    const range = 'pedidos!A:E';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    const sheetsData = await sheetsResponse.json();
    if (!sheetsData.values || sheetsData.values.length === 0) {
      return [];
    }

    const rows = sheetsData.values.slice(1);
    const cpfClean = cpf.replace(/\D/g, '');
    
    return rows.filter((row: string[]) => {
      const rowCpf = row[0]?.toString().replace(/\D/g, '') || '';
      return rowCpf === cpfClean;
    }).map((row: string[]) => ({
      cpf: row[0],
      nome: row[1],
      livro: row[2],
      data: row[3],
      observacao: row[4]
    }));
    
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

// Função para enviar mensagem via Evolution API
async function sendWhatsAppMessage(phone: string, message: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

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
    throw new Error(`Erro ao enviar mensagem: ${response.statusText}`);
  }

  return await response.json();
}

// Função para processar mensagens e gerar respostas
async function processMessage(phone: string, message: string, studentName?: string) {
  const messageText = message.toLowerCase().trim();
  
  // Buscar dados do aluno
  const student = await getStudentByPhone(phone);
  const studentOrders = student ? await getStudentOrders(student.cpf) : [];

  // Menu principal
  if (messageText.includes('menu') || messageText === '0') {
    return `🎓 *EETAD - Menu Principal*

Olá${student ? ` ${student.nome}` : ''}! Como posso ajudá-lo hoje?

*1* - 📚 Informações sobre o curso
*2* - 📖 Meus pedidos de livros
*3* - 💰 Informações sobre pagamentos
*4* - 📞 Falar com atendente
*5* - ℹ️ Informações gerais

Digite o número da opção desejada ou *menu* para ver este menu novamente.`;
  }

  // Opção 1 - Informações sobre o curso
  if (messageText === '1' || messageText.includes('curso') || messageText.includes('teologia')) {
    return `📚 *Informações sobre o Curso de Teologia*

🎯 *Sobre a EETAD:*
A Escola de Educação Teológica das Assembleias de Deus oferece formação teológica sólida e bíblica.

📖 *Ciclos disponíveis:*
• 1º Ciclo Básico
• 2º Ciclo Médio I
• 2º Ciclo Médio II  
• 3º Ciclo Avançado

⏰ *Modalidades:*
• Núcleos Presenciais
• WebCurso (Online)
• TeleCurso

💡 *Livros de apoio disponíveis:*
• Bibliologia I
• História e Geografia Bíblica
• Evangelhos
• Doutrinas Fundamentais
• E muitos outros...

Digite *menu* para voltar ao menu principal ou *2* para ver seus pedidos.`;
  }

  // Opção 2 - Pedidos de livros
  if (messageText === '2' || messageText.includes('pedido') || messageText.includes('livro')) {
    if (!student) {
      return `❌ Não consegui identificar seus dados pelo número de telefone.

📱 *Para fazer um pedido de livro:*
Acesse a plataforma da *EETAD Núcleo Palmas - TO*

💻 Entre em contato com a secretaria para obter o link de acesso.

Digite *menu* para ver outras opções.`;
    }

    if (studentOrders.length === 0) {
      return `📖 *Meus Pedidos de Livros*

Olá ${student.nome}!

Você ainda não possui pedidos de livros registrados em nosso sistema.

📱 *Para fazer um novo pedido:*
Acesse a plataforma da *EETAD Núcleo Palmas - TO*

💻 Entre em contato com a secretaria para obter o link de acesso ou digite *4* para falar com um atendente.

Digite *menu* para voltar ao menu principal.`;
    }

    let response = `📖 *Meus Pedidos de Livros*\n\nOlá ${student.nome}!\n\n`;
    
    studentOrders.forEach((order, index) => {
      response += `📚 *Pedido ${index + 1}:*
• Livro: ${order.livro}
• Data: ${order.data}
• Status: ${order.observacao}

`;
    });

    response += `💰 Para verificar pagamentos, digite *3*
📞 Para falar com atendente, digite *4*
🔙 Digite *menu* para voltar ao menu principal`;

    return response;
  }

  // Opção 3 - Pagamentos
  if (messageText === '3' || messageText.includes('pagamento') || messageText.includes('pix')) {
    return `💰 *Informações sobre Pagamentos*

💳 *Formas de pagamento aceitas:*
• PIX (instantâneo)
• Transferência bancária

💡 *Como pagar:*
1. Faça seu pedido pelo sistema online
2. Será gerado um QR Code PIX
3. Pague pelo seu app bancário
4. Confirmação automática

⏱️ *Prazos:*
• PIX: Confirmação imediata
• Envio: Até 10 dias úteis após confirmação

❓ *Dúvidas sobre pagamento?*
Digite *4* para falar com um atendente.

Digite *menu* para voltar ao menu principal.`;
  }

  // Opção 4 - Falar com atendente
  if (messageText === '4' || messageText.includes('atendente') || messageText.includes('humano')) {
    // Notificar secretaria sobre solicitação de atendimento
    const secretaryPhone = Deno.env.get('SECRETARY_WHATSAPP_NUMBER');
    if (secretaryPhone) {
      try {
        await sendWhatsAppMessage(secretaryPhone, 
          `🔔 *SOLICITAÇÃO DE ATENDIMENTO*

👤 Aluno: ${student?.nome || 'Não identificado'}
📱 Telefone: ${phone}
⏰ Horário: ${new Date().toLocaleString('pt-BR')}

O aluno solicitou atendimento humano.`);
      } catch (error) {
        console.error('Erro ao notificar secretaria:', error);
      }
    }

    return `📞 *Atendimento Humano*

Sua solicitação foi encaminhada para nossa equipe!

⏰ *Horário de atendimento:*
Segunda a Sexta: 8h às 17h

📱 Nossa equipe entrará em contato em breve.

Enquanto isso, posso ajudá-lo com:
• Digite *1* - Informações do curso
• Digite *2* - Consultar pedidos
• Digite *3* - Informações de pagamento

Digite *menu* para ver todas as opções.`;
  }

  // Opção 5 - Informações gerais
  if (messageText === '5' || messageText.includes('informações') || messageText.includes('contato')) {
    return `ℹ️ *Informações Gerais - EETAD*

🏢 *Escola de Educação Teológica das Assembleias de Deus*

📧 *Contatos:*
• Site: www.eetad.com.br
• Email: contato@eetad.com.br

⏰ *Horário de atendimento:*
Segunda a Sexta: 8h às 17h

🎓 *Missão:*
Formar líderes cristãos com excelência bíblica e teológica.

📱 *Sistema Online:*
Acesse nosso sistema para matrículas e pedidos de livros.

Digite *menu* para voltar ao menu principal.`;
  }

  // Saudações
  if (messageText.includes('oi') || messageText.includes('olá') || messageText.includes('bom dia') || 
      messageText.includes('boa tarde') || messageText.includes('boa noite')) {
    return `👋 Olá${student ? ` ${student.nome}` : ''}! Bem-vindo(a) à EETAD!

Sou o assistente virtual da Escola de Educação Teológica das Assembleias de Deus.

Digite *menu* para ver como posso ajudá-lo ou escolha uma opção:

*1* - 📚 Informações sobre o curso
*2* - 📖 Meus pedidos de livros  
*3* - 💰 Informações sobre pagamentos
*4* - 📞 Falar com atendente`;
  }

  // Agradecimentos
  if (messageText.includes('obrigad') || messageText.includes('valeu') || messageText.includes('thanks')) {
    return `😊 Por nada! Fico feliz em ajudar!

Se precisar de mais alguma coisa, digite *menu* para ver todas as opções disponíveis.

Que Deus abençoe seus estudos! 🙏`;
  }

  // Como fazer pedido
  if (messageText.includes('como fazer pedido') || messageText.includes('fazer pedido') || 
      messageText.includes('como pedir') || messageText.includes('como comprar') ||
      messageText.includes('onde fazer pedido') || messageText.includes('onde pedir')) {
    return `📱 *Como Fazer um Pedido de Livro*

Para fazer seu pedido, siga estes passos:

🌐 *Acesse a plataforma da EETAD Núcleo Palmas - TO*

📋 *Passos:*
1️⃣ Entre em contato com a secretaria para obter o link
2️⃣ Faça seu login na plataforma
3️⃣ Escolha o livro desejado
4️⃣ Confirme seus dados
5️⃣ Gere o PIX para pagamento
6️⃣ Pague e aguarde a confirmação

📞 *Precisa de ajuda?*
Digite *4* para falar com um atendente

Digite *menu* para voltar ao menu principal.`;
  }

  // Resposta padrão para mensagens não reconhecidas
  return `🤖 Desculpe, não entendi sua mensagem.

Digite *menu* para ver todas as opções disponíveis ou escolha:

*1* - 📚 Informações sobre o curso
*2* - 📖 Meus pedidos de livros
*3* - 💰 Informações sobre pagamentos  
*4* - 📞 Falar com atendente

Ou digite palavras como: *curso*, *pedido*, *pagamento*, *atendente*`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData: WebhookData = await req.json();
    
    console.log('Webhook WhatsApp recebido:', JSON.stringify(webhookData, null, 2));

    // Verificar se é uma mensagem válida e não é do próprio bot
    if (!webhookData.data || webhookData.data.key.fromMe) {
      return new Response('OK', { headers: corsHeaders });
    }

    const message = webhookData.data.message;
    const messageText = message.conversation || message.extendedTextMessage?.text || '';
    
    if (!messageText.trim()) {
      return new Response('OK', { headers: corsHeaders });
    }

    const senderPhone = webhookData.data.key.remoteJid.replace('@s.whatsapp.net', '');
    const senderName = webhookData.data.pushName;

    console.log(`Mensagem recebida de ${senderPhone} (${senderName}): ${messageText}`);

    // Processar mensagem e gerar resposta
    const response = await processMessage(senderPhone, messageText, senderName);

    // Enviar resposta
    await sendWhatsAppMessage(senderPhone, response);

    console.log('Resposta enviada com sucesso');

    return new Response('OK', { headers: corsHeaders });

  } catch (error: any) {
    console.error('Erro no webhook WhatsApp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);