import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gera um JWT para autenticar com a API do Google
async function getGoogleJwt(serviceAccountEmail: string, privateKey: string) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1h
  const header = { alg: "RS256", typ: "JWT" };
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
    throw new Error(`[save-pending-payment] Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

// Função para salvar pagamento pendente na planilha
async function savePendingPaymentToSheet(paymentData: any, accessToken: string, spreadsheetId: string) {
  try {
    // Extrair dados do external_reference
    const externalRef = paymentData.external_reference || '';
    const parts = externalRef.split('_');
    
    let cpf = '';
    let livro = '';
    let ciclo = '';
    
    if (parts.length >= 4) {
      cpf = parts[1]; // CPF sem formatação
      livro = parts.slice(3, -1).join(' ').replace(/_/g, ' '); // Livro
      ciclo = parts[parts.length - 1].replace(/_/g, ' '); // Ciclo
    }

    // Preparar dados para a aba "pagamentos" com todas as colunas solicitadas
    const currentDate = new Date().toLocaleString('pt-BR');
    const rowData = [
      paymentData.external_reference || '',        // A - external_reference
      paymentData.email || '',                     // B - Email
      paymentData.payment_id?.toString() || '',    // C - Transação_ID
      paymentData.valor?.toString() || '0',        // D - Valor
      currentDate,                                 // E - Data_PIX
      'pending',                                   // F - Status (sempre pendente inicialmente)
      paymentData.nome || '',                      // G - Nome
      cpf,                                         // H - cpf
      '',                                          // I - Data_Pagamento (vazio até confirmação)
      paymentData.date_of_expiration || '',        // J - Validade
      paymentData.ticket_url || '',                // K - Pix_url
      paymentData.qr_code_base64 || '',            // L - Pix_base64
      livro,                                       // M - livro
      ciclo                                        // N - ciclo
    ];

    console.log('[save-pending-payment] Salvando pagamento pendente na planilha:', rowData);

    // Salvar na aba "pagamentos" - ajustando o range para incluir todas as colunas
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/pagamentos!A:N:append?valueInputOption=USER_ENTERED`;
    const sheetsBody = { values: [rowData] };

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
      console.error("[save-pending-payment] Erro ao salvar na planilha:", apiResp.status, errorText);
      throw new Error(`Erro ao salvar pagamento pendente na planilha: ${apiResp.status} - ${errorText}`);
    }

    const result = await apiResp.json();
    console.log('[save-pending-payment] Pagamento pendente salvo na planilha com sucesso:', result);

    return { success: true, data: rowData };

  } catch (error: any) {
    console.error('[save-pending-payment] Erro ao salvar pagamento pendente:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymentData = await req.json();
    console.log('[save-pending-payment] Dados recebidos:', paymentData);

    // Validar dados obrigatórios
    if (!paymentData.payment_id || !paymentData.nome || !paymentData.valor || !paymentData.external_reference) {
      throw new Error('Dados obrigatórios não fornecidos: payment_id, nome, valor e external_reference são necessários');
    }

    // Configurar Google Sheets
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      throw new Error('Configuração do Google Sheets incompleta');
    }

    // Preparar chave privada
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Obter token de acesso Google
    const jwt = await getGoogleJwt(serviceAccountEmail, privateKey);
    const googleAccessToken = await getGoogleAccessToken(jwt);

    // Salvar pagamento pendente na planilha
    const result = await savePendingPaymentToSheet(paymentData, googleAccessToken, spreadsheetId);

    console.log('[save-pending-payment] Pagamento pendente processado com sucesso');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[save-pending-payment] Erro ao salvar pagamento pendente:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao salvar pagamento pendente'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);