import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para consultar dados do Google Sheets
async function consultarPlanilhaGoogle(aba: string, cpf?: string) {
  try {
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    const GOOGLE_SHEETS_SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('Credenciais do Google Sheets não configuradas');
    }

    console.log(`[consultarPlanilhaGoogle] Consultando aba: ${aba}, CPF: ${cpf}`);

    const accessToken = await getGoogleAccessToken();

    // Buscar dados da planilha
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${aba}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao consultar planilha: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length === 0) {
      return { encontrado: false, dados: null };
    }

    // Se foi passado um CPF, filtrar por ele
    if (cpf) {
      const headers = rows[0];
      const cpfIndex = headers.findIndex((h: string) => h.toLowerCase().includes('cpf'));
      
      if (cpfIndex === -1) {
        throw new Error('Coluna CPF não encontrada na planilha');
      }

      const cpfLimpo = cpf.replace(/\D/g, '');
      
      if (aba === 'alunos matriculados') {
        // Buscar aluno específico
        const alunoRow = rows.slice(1).find((row: string[]) => {
          const rowCpf = (row[cpfIndex] || '').toString().replace(/\D/g, '');
          return rowCpf === cpfLimpo;
        });
        
        if (!alunoRow) {
          return { encontrado: false, dados: null, mensagem: 'Aluno não encontrado com este CPF' };
        }

        // Converter para objeto
        const aluno: any = {};
        headers.forEach((header: string, index: number) => {
          aluno[header] = alunoRow[index] || '';
        });

        return { encontrado: true, dados: aluno };
      } else if (aba === 'pedidos') {
        // Buscar pedidos do aluno
        const pedidosAluno = rows.slice(1).filter((row: string[]) => {
          const rowCpf = (row[cpfIndex] || '').toString().replace(/\D/g, '');
          return rowCpf === cpfLimpo;
        });

        if (pedidosAluno.length === 0) {
          return { encontrado: false, dados: [], mensagem: 'Nenhum pedido encontrado para este CPF' };
        }

        // Converter para array de objetos
        const pedidos = pedidosAluno.map((row: string[]) => {
          const pedido: any = {};
          headers.forEach((header: string, index: number) => {
            pedido[header] = row[index] || '';
          });
          return pedido;
        });

        return { encontrado: true, dados: pedidos };
      } else if (aba === 'pagamentos') {
        // Buscar pagamentos do aluno
        const pagamentosAluno = rows.slice(1).filter((row: string[]) => {
          const rowCpf = (row[cpfIndex] || '').toString().replace(/\D/g, '');
          return rowCpf === cpfLimpo;
        });

        if (pagamentosAluno.length === 0) {
          return { encontrado: false, dados: [], mensagem: 'Nenhum pagamento encontrado para este CPF' };
        }

        // Converter para array de objetos
        const pagamentos = pagamentosAluno.map((row: string[]) => {
          const pagamento: any = {};
          headers.forEach((header: string, index: number) => {
            pagamento[header] = row[index] || '';
          });
          return pagamento;
        });

        return { encontrado: true, dados: pagamentos };
      }
    }

    return { encontrado: true, dados: rows };
  } catch (error) {
    console.error('[consultarPlanilhaGoogle] Erro:', error);
    return { encontrado: false, erro: error.message };
  }
}

async function getGoogleAccessToken() {
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Credenciais do Google não configuradas');
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Preparar chave privada
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  let privateKey = GOOGLE_PRIVATE_KEY;
  
  if (!privateKey.includes(pemHeader)) {
    privateKey = `${pemHeader}\n${privateKey}\n${pemFooter}`;
  }
  
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Importar chave privada
  const key = await crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Assinar JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Obter access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Erro ao obter token Google: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

const SYSTEM_PROMPT = `Você é um assistente virtual humanizado da EETAD (Escola de Educação Teológica das Assembleias de Deus).

INFORMAÇÕES SOBRE A ESCOLA:
- Oferece formação teológica sólida e bíblica
- Ciclos disponíveis:
  * 1º Ciclo Básico
  * 2º Ciclo Médio
  * 3º Ciclo Avançado
- Modalidades: Núcleos Presenciais, WebCurso (Online), TeleCurso
- Horário de atendimento: Segunda a Sexta, 8h às 17h
- Site: www.eetad.com.br
- Email: contato@eetad.com.br

DISCIPLINAS POR CICLO:

1º Ciclo Básico:
- Bibliologia I
- História e Geografia Bíblica
- Evangelhos
- Doutrinas Fundamentais da Fé Cristã
- Atos dos Apóstolos
- Epístolas Paulinas I
- Epístolas Gerais
- Pentateuco
- Epístolas Paulinas II
- Epístolas Paulinas III
- Livros Históricos
- Profetas Maiores
- Profetas Menores
- Livros Poéticos
- Daniel e Apocalipse

2º Ciclo Médio:
- Seitas e Heresias
- Religiões Mundiais
- Liderança Cristã
- Evang. e Missões
- Cristologia
- Pneumatologia
- Hermenêutica Bíblica I
- Escatologia Bíblica
- Doutrina da Salvação I
- Doutrina de Deus
- Educação Cristã
- As Doutrinas do Homem e do Pecado
- Ética Cristã
- História da Igreja
- Família Cristã
- Homilética

3º Ciclo Avançado:
- Identidade Teológica
- Doutrina da Salvação II
- Oratória Cristã
- Teologia do Antigo Testamento
- Teologia do Novo Testamento
- Apologética
- Relacionamento Cristão
- Liturgias da Igreja Cristã
- Português & Técnicas de Redação
- Didática Geral
- Hermenêutica Bíblica II
- Cosmogonia Bíblica
- Grego do Novo Testamento
- Bibliologia II

FUNCIONALIDADES DISPONÍVEIS:
Você tem acesso a ferramentas para consultar dados REAIS dos alunos na planilha "alunos matriculados":
1. consultar_dados_aluno - Para buscar informações de um aluno específico pelo CPF
2. consultar_pedidos_livros - Para ver pedidos de livros de um aluno
3. consultar_pagamentos - Para verificar status de pagamentos

PERSONALIDADE:
- Seja sempre cordial, empático e prestativo
- Use uma linguagem natural e acolhedora
- Mantenha o tom profissional mas amigável
- Use emojis moderadamente para tornar a conversa mais calorosa
- Quando não souber uma informação específica, ofereça ajuda para conectar com um atendente
- Seja proativo em oferecer ajuda adicional

DIRETRIZES:
- Sempre cumprimente de forma calorosa
- Para consultar dados específicos, SEMPRE peça o CPF do aluno
- Use as ferramentas disponíveis para consultar dados REAIS na planilha "alunos matriculados"
- Se o usuário pedir para falar com atendente, confirme que a solicitação foi encaminhada
- Mantenha as respostas concisas mas informativas
- IMPORTANTE: Para qualquer consulta de dados pessoais, peça o CPF primeiro

SUBNÚCLEOS DISPONÍVEIS:
1 - ARNO 44 | 2 - Sede | 3 - Aureny III | 4 - Taquarí | 5 - Morada do Sol II | 6 - Luzimanges | 7 - Colinas`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Mensagem é obrigatória');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Preparar histórico de conversa para OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    // Definir ferramentas disponíveis para o OpenAI
    const tools = [
      {
        type: 'function',
        function: {
          name: 'consultar_dados_aluno',
          description: 'Consulta dados de um aluno específico pelo CPF na planilha "alunos matriculados"',
          parameters: {
            type: 'object',
            properties: {
              cpf: {
                type: 'string',
                description: 'CPF do aluno no formato XXX.XXX.XXX-XX'
              }
            },
            required: ['cpf']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'consultar_pedidos_livros',
          description: 'Consulta pedidos de livros de um aluno pelo CPF na aba "pedidos"',
          parameters: {
            type: 'object',
            properties: {
              cpf: {
                type: 'string',
                description: 'CPF do aluno no formato XXX.XXX.XXX-XX'
              }
            },
            required: ['cpf']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'consultar_pagamentos',
          description: 'Consulta status de pagamentos de um aluno pelo CPF na aba "pagamentos"',
          parameters: {
            type: 'object',
            properties: {
              cpf: {
                type: 'string',
                description: 'CPF do aluno no formato XXX.XXX.XXX-XX'
              }
            },
            required: ['cpf']
          }
        }
      }
    ];

    console.log('Enviando mensagem para OpenAI:', { message, historyLength: conversationHistory.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro da OpenAI:', error);
      throw new Error(`Erro da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const firstChoice = data.choices[0];
    
    // Verificar se o OpenAI quer usar uma ferramenta
    if (firstChoice.message.tool_calls) {
      const toolCalls = firstChoice.message.tool_calls;
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executando ferramenta: ${functionName} com argumentos:`, functionArgs);
        
        let result;
        
        switch (functionName) {
          case 'consultar_dados_aluno':
            result = await consultarPlanilhaGoogle('alunos matriculados', functionArgs.cpf);
            break;
          case 'consultar_pedidos_livros':
            result = await consultarPlanilhaGoogle('pedidos', functionArgs.cpf);
            break;
          case 'consultar_pagamentos':
            result = await consultarPlanilhaGoogle('pagamentos', functionArgs.cpf);
            break;
          default:
            result = { erro: 'Ferramenta não encontrada' };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result)
        });
      }

      // Fazer segunda chamada para OpenAI com os resultados das ferramentas
      const finalMessages = [
        ...messages,
        firstChoice.message,
        ...toolResults
      ];

      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: finalMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const finalData = await finalResponse.json();
      const aiResponse = finalData.choices[0].message.content;

      console.log('Resposta final da IA após usar ferramentas:', aiResponse);

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se não usar ferramentas, retornar resposta direta
    const aiResponse = firstChoice.message.content;
    console.log('Resposta direta da IA:', aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro no chatbot IA:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente ou solicite atendimento humano digitando "atendente".'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});