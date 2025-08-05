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

// Cache para rate limiting
const messageCache = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 5; // mensagens por minuto
const RATE_WINDOW = 60 * 1000; // 1 minuto em milissegundos

// Função para verificar rate limit
function checkRateLimit(phone: string): boolean {
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
      throw new Error('Falha na autenticação Google');
    }

    // Buscar dados acadêmicos
    const academicRange = 'dados academicos!A:Z';
    const academicUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${academicRange}`;
    
    const academicResponse = await fetch(academicUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    const academicData = await academicResponse.json();
    if (!academicData.values || academicData.values.length === 0) {
      return null;
    }

    const academicHeaders = academicData.values[0];
    const academicRows = academicData.values.slice(1);

    // Buscar dados de matrícula
    const enrollmentRange = 'alunos matriculados!A:Z';
    const enrollmentUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${enrollmentRange}`;
    
    const enrollmentResponse = await fetch(enrollmentUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    const enrollmentData = await enrollmentResponse.json();
    if (!enrollmentData.values || enrollmentData.values.length === 0) {
      return null;
    }

    const enrollmentHeaders = enrollmentData.values[0];
    const enrollmentRows = enrollmentData.values.slice(1);
    
    const phoneClean = phone.replace(/\D/g, '');
    
    // Encontrar aluno nas planilhas
    let studentData = null;
    
    // Buscar em dados acadêmicos
    for (const row of academicRows) {
      const rowPhone = row[academicHeaders.findIndex((h: string) => h && h.toLowerCase().includes('telefone'))]?.toString().replace(/\D/g, '') || '';
      if (rowPhone.includes(phoneClean.slice(-8)) || phoneClean.includes(rowPhone.slice(-8))) {
        studentData = {
          ...studentData,
          notas: row[academicHeaders.findIndex((h: string) => h && h.toLowerCase().includes('nota'))] || '',
          disciplinas: row[academicHeaders.findIndex((h: string) => h && h.toLowerCase().includes('disciplina'))] || '',
          frequencia: row[academicHeaders.findIndex((h: string) => h && h.toLowerCase().includes('frequencia'))] || '',
          status_academico: row[academicHeaders.findIndex((h: string) => h && h.toLowerCase().includes('status'))] || ''
        };
        break;
      }
    }
    
    // Buscar em matrículas
    for (const row of enrollmentRows) {
      const rowPhone = row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('telefone'))]?.toString().replace(/\D/g, '') || '';
      if (rowPhone.includes(phoneClean.slice(-8)) || phoneClean.includes(rowPhone.slice(-8))) {
        studentData = {
          ...studentData,
          nome: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('nome'))] || '',
          cpf: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('cpf'))] || '',
          telefone: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('telefone'))] || '',
          curso: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('curso'))] || '',
          turma: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('turma'))] || '',
          data_matricula: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('data'))] || '',
          status_matricula: row[enrollmentHeaders.findIndex((h: string) => h && h.toLowerCase().includes('status'))] || ''
        };
        break;
      }
    }
    
    return studentData;
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    return null;
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

  // Implementar retry com backoff exponencial
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
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
      
      // Verificar se a mensagem foi realmente enviada
      if (!result.success) {
        throw new Error(`Falha ao enviar mensagem: ${result.message || 'Erro desconhecido'}`);
      }

      return result;

    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        // Backoff exponencial
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError;
}

// Função para processar mensagens com OpenAI
async function processMessage(phone: string, message: string, studentName?: string) {
  try {
    // Verificar rate limit
    if (!checkRateLimit(phone)) {
      return "Desculpe, você atingiu o limite de mensagens por minuto. Por favor, aguarde um momento antes de enviar mais mensagens.";
    }

    // Buscar dados do aluno
    const student = await getStudentByPhone(phone);
    
    // Preparar contexto para o OpenAI
    const context = {
      student: student ? {
        nome: student.nome,
        cpf: student.cpf,
        telefone: student.telefone,
        curso: student.curso,
        turma: student.turma,
        data_matricula: student.data_matricula,
        status_matricula: student.status_matricula,
        notas: student.notas,
        disciplinas: student.disciplinas,
        frequencia: student.frequencia,
        status_academico: student.status_academico
      } : null,
      timestamp: new Date().toLocaleString('pt-BR'),
      message: message,
      senderName: studentName || 'Usuário'
    };

    // Chamar OpenAI API com retry
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
          },
          body: JSON.stringify({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: 'system',
                content: `Você é o Assistente Virtual da EETAD (Escola de Educação Teológica das Assembleias de Deus), um chatbot amigável e prestativo que ajuda alunos com suas dúvidas e necessidades.

INFORMAÇÕES SOBRE A EETAD:
- Instituição de ensino teológico das Assembleias de Deus
- Oferece cursos em diferentes ciclos: Básico, Médio e Bacharel
- Sistema de ensino semipresencial com encontros mensais
- Material didático próprio e exclusivo

SERVIÇOS DISPONÍVEIS:
1. Cursos:
   - Curso Básico em Teologia (2 anos)
   - Curso Médio em Teologia (2 anos)
   - Bacharel em Teologia (4 anos)
   - Cursos de Extensão

2. Livros e Materiais:
   - Sistema online de pedidos
   - Entrega via correios
   - Pagamento via PIX
   - Preços especiais para alunos matriculados

3. Pagamentos:
   - Aceita PIX
   - Parcelamento disponível
   - Descontos para pagamento à vista
   - Comprovantes automáticos

HORÁRIOS E ATENDIMENTO:
- Segunda a Sexta: 8h às 17h
- Sábados: 8h às 12h
- Feriados: Fechado
- Atendimento presencial e online

REGRAS DE COMUNICAÇÃO:
1. Tom e Estilo:
   - Use linguagem formal mas amigável
   - Mantenha respostas concisas e objetivas
   - Use emojis moderadamente para tornar a conversa mais agradável
   - Seja sempre educado e prestativo
   - Use o nome do aluno quando disponível
   - Adapte o tom baseado no contexto da conversa

2. Formatação:
   - Use *negrito* para destacar informações importantes
   - Use - para listas
   - Use números para passos ou sequências
   - Mantenha parágrafos curtos
   - Use emojis relevantes para o contexto

3. Limitações:
   - Não forneça informações confidenciais
   - Não faça promessas que não pode cumprir
   - Não dê conselhos teológicos complexos
   - Em caso de dúvida, sugira falar com um atendente humano
   - NUNCA forneça informações de outros alunos
   - NUNCA compartilhe dados sensíveis como CPF completo

4. Prioridades:
   - Sempre verifique se o aluno está matriculado
   - Priorize informações sobre cursos e matrículas
   - Forneça instruções claras para pedidos de livros
   - Explique processos de pagamento de forma detalhada

5. Personalização:
   - Use o nome do aluno quando disponível
   - Adapte o tom baseado no contexto da conversa
   - Mantenha um histórico mental da conversa
   - Faça referência a interações anteriores quando relevante

6. Informações Acadêmicas:
   - Forneça apenas informações do aluno que está fazendo a consulta
   - Ao informar notas, explique o significado de cada uma
   - Ao informar frequência, explique as implicações
   - Ao informar status acadêmico, explique as possíveis ações
   - Mantenha um tom encorajador ao discutir desempenho acadêmico
   - Sugira recursos de apoio quando necessário

Lembre-se: Seu objetivo é ajudar os alunos da melhor forma possível, mantendo um atendimento profissional e eficiente.`
              },
              {
                role: 'user',
                content: JSON.stringify(context)
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6, // Incentiva o modelo a explorar novos tópicos
            frequency_penalty: 0.3 // Reduz repetições
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`Erro na API OpenAI: ${openaiResponse.statusText}`);
        }

        const data = await openaiResponse.json();
        return data.choices[0].message.content;

      } catch (error) {
        lastError = error as Error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries))); // Backoff exponencial
          continue;
        }
        throw error;
      }
    }

    throw lastError;

  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return `Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde ou entre em contato com nossa equipe.`;
  }
}

// Função para sanitizar número de telefone
function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Função para validar payload do webhook
function validateWebhookPayload(data: any): data is WebhookData {
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    
    // Validar payload
    if (!validateWebhookPayload(webhookData)) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const senderPhone = sanitizePhoneNumber(webhookData.data.key.remoteJid.replace('@s.whatsapp.net', ''));
    const senderName = webhookData.data.pushName;

    console.log(`Mensagem recebida de ${senderPhone} (${senderName}): ${messageText}`);

    // Processar mensagem com OpenAI
    const response = await processMessage(senderPhone, messageText, senderName);

    // Enviar resposta
    await sendWhatsAppMessage(senderPhone, response);

    console.log('Resposta enviada com sucesso');

    return new Response('OK', { headers: corsHeaders });

  } catch (error: any) {
    console.error('Erro no webhook WhatsApp:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);