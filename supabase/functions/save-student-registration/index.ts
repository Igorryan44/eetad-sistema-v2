import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentRegistrationData {
  origem_academica: string;
  em_qual_escola_estudou: string;
  em_qual_modalidade_estudou: string;
  ciclo: string;
  nucleo: string;
  congregacao: string;
  nome: string;
  rg: string;
  cpf: string;
  telefone: string;
  email: string;
  sexo: string;
  estado_civil: string;
  data_nascimento: string;
  uf_nascimento: string;
  escolaridade: string;
  profissao: string;
  nacionalidade: string;
  cargo_igreja: string;
  endereco_rua: string;
  cep: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  matricula_numero: string;
}

// Gera um JWT para autenticar com a API do Google
async function getGoogleJwt(serviceAccountEmail: string, privateKey: string) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1h
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat
  };
  
  function base64url(src: string) {
    return btoa(src).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  
  async function importPrivateKey(pem: string) {
    const pemBody = pem.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\n/g, "");
    const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }
  
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const toSign = `${encHeader}.${encPayload}`;
  const key = await importPrivateKey(privateKey);
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(toSign)));
  const encSignature = base64url(String.fromCharCode(...signature));
  const jwt = `${toSign}.${encSignature}`;
  return jwt;
}

// Troca o JWT por um access token válido da Google API
async function getGoogleAccessToken(jwt: string) {
  const params = new URLSearchParams();
  params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  params.append("assertion", jwt);

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  if (!resp.ok) {
    throw new Error(`[save-student-registration] Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const studentData: StudentRegistrationData = await req.json();

    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      console.error("[save-student-registration] Secrets faltando para Google Sheets");
      return new Response(
        JSON.stringify({ error: "Configuração incompleta da função: verifique as secrets do Google Sheets." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log('[save-student-registration] Salvando dados do aluno:', studentData.nome);

    // Limpar e formatar a chave privada
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Preparar dados para a aba "alunos matriculados" na ordem correta das colunas
    const rowData = [
      studentData.origem_academica || '',           // A - Origem Acadêmica
      studentData.em_qual_escola_estudou || '',     // B - Em qual escola estudou
      studentData.em_qual_modalidade_estudou || '', // C - Em qual modalidade estudou
      studentData.ciclo || '',                      // D - Ciclo
      studentData.nucleo || '',                     // E - Núcleo
      studentData.congregacao || '',                // F - Congregação
      studentData.nome || '',                       // G - Nome
      studentData.rg || '',                         // H - RG
      studentData.cpf || '',                        // I - CPF
      studentData.telefone || '',                   // J - Telefone
      studentData.email || '',                      // K - Email
      studentData.sexo || '',                       // L - Sexo
      studentData.estado_civil || '',               // M - Estado Civil
      studentData.data_nascimento || '',            // N - Data de Nascimento
      studentData.uf_nascimento || '',              // O - UF Nascimento
      studentData.escolaridade || '',               // P - Escolaridade
      studentData.profissao || '',                  // Q - Profissão
      studentData.nacionalidade || '',              // R - Nacionalidade
      studentData.cargo_igreja || '',               // S - Cargo na Igreja
      studentData.endereco_rua || '',               // T - Endereço
      studentData.cep || '',                        // U - CEP
      studentData.numero || '',                     // V - Número
      studentData.bairro || '',                     // W - Bairro
      studentData.cidade || '',                     // X - Cidade
      studentData.uf || '',                         // Y - UF
      studentData.matricula_numero || ''            // Z - Número da Matrícula
    ];

    console.log('[save-student-registration] Dados preparados para a planilha:', rowData);

    // Criar o JWT e obter um access token do Google
    const jwt = await getGoogleJwt(serviceAccountEmail, privateKey);
    const accessToken = await getGoogleAccessToken(jwt);

    console.log('[save-student-registration] Token de acesso obtido com sucesso');

    // Montar o payload de adição de linha via API do Sheets
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/alunos%20matriculados!A:Z:append?valueInputOption=USER_ENTERED`;
    const sheetsBody = {
      values: [rowData]
    };

    console.log('[save-student-registration] Enviando dados para Google Sheets...');

    // Realiza o POST para gravar no Google Sheets
    const apiResp = await fetch(sheetsApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sheetsBody)
    });

    if (!apiResp.ok) {
      const errorText = await apiResp.text();
      console.error("[save-student-registration] Erro no Google Sheets:", apiResp.status, errorText);
      throw new Error(`Erro ao salvar matrícula no Google Sheets: ${apiResp.status} - ${errorText}`);
    }

    const result = await apiResp.json();
    console.log('[save-student-registration] Matrícula salva na planilha com sucesso:', result);

    const response = {
      success: true,
      message: 'Matrícula salva com sucesso na aba "alunos matriculados"',
      data: studentData,
      spreadsheet_result: result
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[save-student-registration] Erro ao salvar matrícula:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao salvar dados de matrícula na planilha Google Sheets'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);