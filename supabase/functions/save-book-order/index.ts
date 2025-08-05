import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookOrderData {
  external_reference: string;
  cpf: string;
  nome_do_aluno: string;
  ciclo: string;
  livro: string;
  data_pedido: string;
  observacao: string;
  status_pedido: string;
}

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
    throw new Error(`[save-book-order] Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: BookOrderData = await req.json();

    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      console.error("[save-book-order] Secrets faltando.");
      return new Response(
        JSON.stringify({ error: "Configuração incompleta da função: verifique as secrets do Google Sheets." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Preparar dados para a aba "pedidos" conforme as novas colunas
    const rowData = [
      orderData.external_reference || `EETAD_${orderData.cpf}_${Date.now()}`, // A - external_reference
      orderData.cpf,                                                          // B - cpf
      orderData.nome_do_aluno,                                               // C - nome_do_aluno
      orderData.ciclo || '',                                                 // D - ciclo
      orderData.livro,                                                       // E - livro
      orderData.data_pedido,                                                 // F - data_pedido
      orderData.observacao || 'Pedido via sistema online',                  // G - observacao
      orderData.status_pedido || 'Pendente'                                 // H - status_pedido
    ];

    // Criar o JWT e obter um access token do Google
    const jwt = await getGoogleJwt(serviceAccountEmail, privateKey);
    const accessToken = await getGoogleAccessToken(jwt);

    // Montar o payload de adição de linha via API do Sheets
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/pedidos!A:H:append?valueInputOption=USER_ENTERED`;
    const sheetsBody = { values: [rowData] };

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
      console.error("[save-book-order] Erro no Google Sheets:", apiResp.status, errorText);
      throw new Error("Erro ao salvar pedido no Google Sheets: " + errorText);
    }

    const result = await apiResp.json();
    console.log('[save-book-order] Pedido salvo na planilha com sucesso:', result);

    const response = {
      success: true,
      message: 'Pedido salvo com sucesso na aba "pedidos"',
      data: orderData
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro ao salvar pedido:', error);
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