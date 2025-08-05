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
    throw new Error(`[update-payment-status] Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

// Função para atualizar status do pagamento na planilha
async function updatePaymentStatusInSheet(paymentId: string, newStatus: string, accessToken: string, spreadsheetId: string) {
  try {
    console.log('[update-payment-status] Atualizando status do pagamento:', paymentId, 'para:', newStatus);

    // Primeiro, buscar a linha do pagamento na planilha
    const searchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/pagamentos!A:I`;
    
    const searchResp = await fetch(searchUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      }
    });

    if (!searchResp.ok) {
      throw new Error(`Erro ao buscar dados da planilha: ${searchResp.status}`);
    }

    const searchData = await searchResp.json();
    const rows = searchData.values || [];

    // Encontrar a linha com o payment_id
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === paymentId.toString()) {
        rowIndex = i + 1; // +1 porque as linhas no Google Sheets começam em 1
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Pagamento com ID ${paymentId} não encontrado na planilha`);
    }

    // Atualizar o status (coluna G) e a data de confirmação (coluna H)
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/pagamentos!G${rowIndex}:H${rowIndex}?valueInputOption=USER_ENTERED`;
    const updateBody = {
      values: [[
        newStatus,
        new Date().toLocaleString('pt-BR')
      ]]
    };

    const updateResp = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateBody)
    });

    if (!updateResp.ok) {
      const errorText = await updateResp.text();
      console.error("[update-payment-status] Erro ao atualizar na planilha:", updateResp.status, errorText);
      throw new Error(`Erro ao atualizar status na planilha: ${updateResp.status} - ${errorText}`);
    }

    const result = await updateResp.json();
    console.log('[update-payment-status] Status atualizado na planilha com sucesso:', result);

    return { success: true, rowIndex, newStatus };

  } catch (error: any) {
    console.error('[update-payment-status] Erro ao atualizar status:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id, status } = await req.json();
    console.log('[update-payment-status] Dados recebidos:', { payment_id, status });

    // Validar dados obrigatórios
    if (!payment_id || !status) {
      throw new Error('Dados obrigatórios não fornecidos: payment_id e status são necessários');
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

    // Atualizar status do pagamento na planilha
    const result = await updatePaymentStatusInSheet(payment_id, status, googleAccessToken, spreadsheetId);

    console.log('[update-payment-status] Status do pagamento atualizado com sucesso');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[update-payment-status] Erro ao atualizar status do pagamento:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao atualizar status do pagamento'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);