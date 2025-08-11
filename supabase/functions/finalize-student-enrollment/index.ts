import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrollmentData {
  cpf: string;
  ciclo: string;
  subnucleo: string;
  status: string;
  observacao?: string;
  dataEvento?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const enrollmentData: EnrollmentData = await req.json();
    console.log('📝 Iniciando efetivação de matrícula:', enrollmentData);

    // Validar dados obrigatórios
    if (!enrollmentData.cpf || !enrollmentData.ciclo || !enrollmentData.subnucleo || !enrollmentData.status) {
      throw new Error('Dados obrigatórios não fornecidos: CPF, Ciclo, Subnúcleo e Status são obrigatórios');
    }

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!GOOGLE_SHEETS_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Variáveis de ambiente do Google Sheets não configuradas');
    }

    // Função para obter token de acesso
    async function getAccessToken() {
      const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      const encoder = new TextEncoder();
      const keyData = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        encoder.encode(keyData),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const jwtHeaderEncoded = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const jwtPayloadEncoded = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const jwtData = `${jwtHeaderEncoded}.${jwtPayloadEncoded}`;
      
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(jwtData)
      );

      const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      const jwt = `${jwtData}.${jwtSignature}`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      });

      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    }

    // Função para ler dados da planilha
    async function readSheetData(spreadsheetId: string, range: string) {
      const accessToken = await getAccessToken();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Erro ao ler planilha: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.values || [];
    }

    // Função para atualizar dados na planilha
    async function updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
      const accessToken = await getAccessToken();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar planilha: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    }

    // Função para adicionar dados na planilha
    async function appendSheetData(spreadsheetId: string, range: string, values: any[][]) {
      const accessToken = await getAccessToken();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error(`Erro ao adicionar dados na planilha: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    }

    // 1. Buscar dados do aluno na aba "dados pessoais"
    console.log('🔍 Buscando dados do aluno na aba "dados pessoais"...');
    const dadosPessoaisData = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, 'dados pessoais!A:Y');
    
    let studentRow: any[] = [];
    let studentRowIndex = -1;
    
    // Procurar o aluno pelo CPF
    for (let i = 1; i < dadosPessoaisData.length; i++) {
      const row = dadosPessoaisData[i];
      const cpfPlanilha = (row[6] || '').replace(/\D/g, ''); // Coluna G - CPF
      const cpfBusca = enrollmentData.cpf.replace(/\D/g, '');
      
      if (cpfPlanilha === cpfBusca) {
        studentRow = row;
        studentRowIndex = i + 1; // 1-indexed para Google Sheets
        break;
      }
    }

    if (studentRowIndex === -1) {
      throw new Error(`Aluno com CPF ${enrollmentData.cpf} não encontrado na aba "dados pessoais"`);
    }

    console.log(`✅ Aluno encontrado na linha ${studentRowIndex}: ${studentRow[4]}`);

    // 2. Atualizar status na aba "dados pessoais" (coluna Y - índice 24)
    console.log('📝 Atualizando status na aba "dados pessoais"...');
    const statusRange = `dados pessoais!Y${studentRowIndex}`;
    await updateSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, statusRange, [['Matriculado']]);
    console.log('✅ Status atualizado para "Matriculado"');

    // 3. Gerar número de matrícula único
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const timestamp = Date.now();
    const matriculaNumber = `MAT-${timestamp}`;

    // 4. Adicionar registro na aba "matriculas"
    console.log('📝 Adicionando registro na aba "matriculas"...');
    const matriculaRowData = [
      currentDate,                           // Data de efetivação
      matriculaNumber,                       // Número da matrícula
      enrollmentData.cpf,                    // CPF
      studentRow[4] || '',                   // Nome (coluna E)
      enrollmentData.ciclo,                  // Ciclo
      enrollmentData.subnucleo,              // Subnúcleo
      enrollmentData.dataEvento || currentDate, // Data do evento
      enrollmentData.status,                 // Status
      enrollmentData.observacao || '',       // Observação
      studentRow[8] || '',                   // Email (coluna I)
      studentRow[7] || ''                    // Telefone (coluna H)
    ];

    await appendSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, 'matriculas!A:K', [matriculaRowData]);
    console.log('✅ Registro adicionado na aba "matriculas"');

    // 5. Resposta de sucesso
    const response = {
      success: true,
      message: 'Matrícula efetivada com sucesso',
      data: {
        numeroMatricula: matriculaNumber,
        cpf: enrollmentData.cpf,
        nome: studentRow[4] || '',
        ciclo: enrollmentData.ciclo,
        subnucleo: enrollmentData.subnucleo,
        status: enrollmentData.status,
        dataEfetivacao: currentDate
      }
    };

    console.log('🎉 Matrícula efetivada com sucesso:', response.data);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro ao efetivar matrícula:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro ao efetivar matrícula',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});