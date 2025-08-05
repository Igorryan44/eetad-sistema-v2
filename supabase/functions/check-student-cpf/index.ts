
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CPFCheckRequest {
  cpf: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf }: CPFCheckRequest = await req.json();
    
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    
    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      throw new Error('Configuração do Google Sheets não encontrada');
    }

    console.log('=== INÍCIO DA CONSULTA CPF ===');
    console.log('CPF recebido:', cpf);
    console.log('Spreadsheet ID:', spreadsheetId);

    // Limpar e formatar a chave privada corretamente
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Verificar se a chave tem os headers corretos
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    console.log('Chave privada formatada corretamente');

    // Criar JWT para autenticação Google
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

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
    
    // Converter a chave privada PEM para ArrayBuffer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
    
    // Decodificar base64
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Importando chave privada...');
    
    // Importar chave privada
    const keyData = await crypto.subtle.importKey(
      'pkcs8',
      bytes.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    console.log('Chave privada importada com sucesso');

    // Assinar o token
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyData,
      encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${unsignedToken}.${signatureB64}`;

    console.log('JWT criado com sucesso');

    // Obter access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Erro ao obter token:', tokenData);
      throw new Error('Falha na autenticação Google');
    }
    
    const accessToken = tokenData.access_token;
    console.log('Token obtido com sucesso');

    // Consultar especificamente a coluna I (CPF) da aba "alunos matriculados"
    const range = 'alunos matriculados!A:Z'; // Pega todas as colunas para ter acesso aos dados completos
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    
    console.log('URL da consulta:', sheetsUrl);
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!sheetsResponse.ok) {
      console.error('Erro na resposta do Sheets:', sheetsResponse.status, sheetsResponse.statusText);
      throw new Error(`Erro ao consultar planilha: ${sheetsResponse.status}`);
    }

    const sheetsData = await sheetsResponse.json();
    
    console.log('Resposta do Sheets recebida');
    console.log('Dados brutos:', JSON.stringify(sheetsData, null, 2));
    
    if (!sheetsData.values || sheetsData.values.length === 0) {
      console.log('Nenhum dado encontrado na planilha');
      return new Response(JSON.stringify({ found: false, error: 'Planilha vazia' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Primeira linha são os cabeçalhos
    const headers = sheetsData.values[0];
    const rows = sheetsData.values.slice(1);
    
    console.log('=== ANÁLISE DOS DADOS ===');
    console.log('Cabeçalhos da planilha:', headers);
    console.log('Número de linhas de dados:', rows.length);
    console.log('Primeira linha de dados:', rows[0]);
    
    // CPF está na coluna I (índice 8, pois I é a 9ª coluna)
    const cpfColumnIndex = 8; // Coluna I
    const nomeColumnIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('nome'));
    const emailColumnIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('email'));
    
    console.log('Índices das colunas:', { cpfColumnIndex, nomeColumnIndex, emailColumnIndex });
    
    // Verificar se a coluna I existe
    if (headers.length <= cpfColumnIndex) {
      console.error(`Coluna I (índice ${cpfColumnIndex}) não existe. Total de colunas: ${headers.length}`);
      return new Response(JSON.stringify({ found: false, error: 'Coluna CPF não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Cabeçalho da coluna I (índice ${cpfColumnIndex}):`, headers[cpfColumnIndex]);
    
    // Procurar pelo CPF (removendo formatação para comparação)
    const cpfLimpo = cpf.replace(/\D/g, '');
    console.log('CPF limpo para busca:', cpfLimpo);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowCpf = row[cpfColumnIndex]?.toString().replace(/\D/g, '') || '';
      
      console.log(`Linha ${i + 2}: CPF encontrado na coluna I:`, row[cpfColumnIndex], '-> limpo:', rowCpf);
      
      if (rowCpf === cpfLimpo) {
        console.log('=== CPF ENCONTRADO! ===');
        console.log('Linha correspondente:', row);
        
        const student = {
          cpf: cpf,
          nome: row[nomeColumnIndex] || '',
          email: row[emailColumnIndex] || ''
        };
        
        console.log('Dados do aluno retornados:', student);
        
        return new Response(JSON.stringify({
          found: true,
          student: student
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('=== CPF NÃO ENCONTRADO ===');
    console.log('CPF procurado:', cpfLimpo);
    console.log('CPFs encontrados na planilha:');
    rows.forEach((row, i) => {
      const rowCpf = row[cpfColumnIndex]?.toString().replace(/\D/g, '') || '';
      if (rowCpf) {
        console.log(`  Linha ${i + 2}: ${rowCpf}`);
      }
    });
    
    return new Response(JSON.stringify({ found: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('=== ERRO NA CONSULTA CPF ===');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message, found: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
