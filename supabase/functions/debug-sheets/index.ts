import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GOOGLE_SHEETS_SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID') || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL');
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    console.log('📊 Verificando credenciais...');
    console.log('Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configurado' : 'NÃO configurado');
    console.log('Private Key:', GOOGLE_PRIVATE_KEY ? 'Configurado' : 'NÃO configurado');
    console.log('Sheet ID:', GOOGLE_SHEETS_SPREADSHEET_ID);

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Credenciais não configuradas' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Função para criar JWT
    function createJWT() {
      const header = { alg: 'RS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const signatureInput = encodedHeader + '.' + encodedPayload;
      
      const keyData = GOOGLE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, '')
                                      .replace(/-----END PRIVATE KEY-----/, '')
                                      .replace(/\s/g, '');
      
      const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
      
      return crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
        .then(key => crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signatureInput)))
        .then(signature => {
          const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
                                 .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
          return signatureInput + '.' + encodedSignature;
        });
    }

    const jwt = await createJWT();
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
    });

    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ error: 'Erro ao obter token: ' + tokenResponse.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Buscar dados pessoais
    const dadosPessoaisResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/dados pessoais`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let dadosPessoais = [];
    if (dadosPessoaisResponse.ok) {
      const dadosPessoaisData = await dadosPessoaisResponse.json();
      dadosPessoais = dadosPessoaisData.values || [];
    }

    // Buscar matrículas
    const matriculasResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let matriculas = [];
    if (matriculasResponse.ok) {
      const matriculasData = await matriculasResponse.json();
      matriculas = matriculasData.values || [];
    }

    const result = {
      credenciais: {
        email: GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configurado' : 'NÃO configurado',
        privateKey: GOOGLE_PRIVATE_KEY ? 'Configurado' : 'NÃO configurado',
        sheetId: GOOGLE_SHEETS_SPREADSHEET_ID
      },
      dadosPessoais: {
        total: dadosPessoais.length,
        cabecalho: dadosPessoais[0] || [],
        primeiras5Linhas: dadosPessoais.slice(1, 6),
        indices: {
          nome: 4,
          cpf: 6,
          telefone: 7,
          email: 8
        }
      },
      matriculas: {
        total: matriculas.length,
        cabecalho: matriculas[0] || [],
        primeiras5Linhas: matriculas.slice(1, 6)
      },
      analise: {
        alunosEsperados: [
          { nome: 'Simião Alves da Costa Junior', cpf: '61767735120' },
          { nome: 'Bruno Alexandre Barros dos Santos', cpf: '003.807.533-40' }
        ]
      }
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})