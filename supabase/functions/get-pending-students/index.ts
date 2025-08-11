import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PendingStudent {
  id: string;
  rowIndex: number;
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
  congregacao?: string;
  status: string;
  dataCadastro?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando busca por alunos pendentes na aba "dados pessoais"');

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

    // Buscar dados da aba "dados pessoais"
    console.log('📊 Buscando dados da aba "dados pessoais"...');
    const dadosPessoaisRange = 'dados pessoais!A:Y'; // Incluindo coluna Y para status
    const dadosPessoaisData = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, dadosPessoaisRange);

    if (!dadosPessoaisData || dadosPessoaisData.length === 0) {
      console.log('📭 Nenhum dado encontrado na aba "dados pessoais"');
      return new Response(
        JSON.stringify({ pendingStudents: [] }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log(`📋 ${dadosPessoaisData.length} linhas encontradas na aba "dados pessoais"`);

    // Processar dados (pular cabeçalho)
    const pendingStudents: PendingStudent[] = [];
    
    for (let i = 1; i < dadosPessoaisData.length; i++) {
      const row = dadosPessoaisData[i];
      
      // Verificar se a linha tem dados essenciais
      const nome = row[4] || ''; // Coluna E - Nome
      const cpf = row[6] || '';   // Coluna G - CPF
      const status = row[24] || 'Pendente'; // Coluna Y - Status (padrão: Pendente)
      
      // Só incluir se tiver nome e CPF, e status for "Pendente"
      if (nome.trim() && cpf.trim() && status.toLowerCase() === 'pendente') {
        const student: PendingStudent = {
          id: cpf.replace(/\D/g, ''), // Usar CPF limpo como ID
          rowIndex: i + 1, // Linha na planilha (1-indexed)
          nome: nome.trim(),
          cpf: cpf.trim(),
          telefone: row[7] || '', // Coluna H - Telefone
          email: row[8] || '',    // Coluna I - Email
          congregacao: row[3] || '', // Coluna D - Congregação
          status: status,
          dataCadastro: row[23] || '' // Coluna X - Data Cadastro
        };
        
        pendingStudents.push(student);
        console.log(`✅ Aluno pendente encontrado: ${nome} (CPF: ${cpf})`);
      }
    }

    console.log(`🎯 Total de alunos pendentes: ${pendingStudents.length}`);

    return new Response(
      JSON.stringify({ 
        pendingStudents,
        total: pendingStudents.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro ao buscar alunos pendentes:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message,
        pendingStudents: []
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