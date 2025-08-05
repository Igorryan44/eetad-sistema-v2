
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
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
    throw new Error(`Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

async function getSheetData(sheetName: string, spreadsheetId: string, accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?majorDimension=ROWS`;
  const sheetResp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!sheetResp.ok) {
    throw new Error(`Erro ao buscar dados da planilha: ${sheetResp.status} ${await sheetResp.text()}`);
  }
  
  const json = await sheetResp.json();
  if (!json.values) return [];
  return json.values;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf, livro, observacao } = await req.json();
    if (!cpf || !livro || !observacao) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const spreadsheetId = Deno.env.get("GOOGLE_SHEETS_SPREADSHEET_ID");
    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      console.error("Secrets faltando para Google Sheets");
      return new Response(JSON.stringify({ error: "Configuração incompleta da função" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Criar o JWT e obter um access token do Google
    const jwt = await getGoogleJwt(serviceAccountEmail, privateKey);
    const accessToken = await getGoogleAccessToken(jwt);

    // Carrega dados da aba "pedidos"
    const rows = await getSheetData("pedidos", spreadsheetId, accessToken);

    if (rows.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assume que primeira linha é cabeçalho, mapeia índices
    const headerRow = rows[0].map((h: string) => h.trim().toLowerCase());
    const idxCPF = headerRow.findIndex((h: string) => h.includes("cpf"));
    const idxLivro = headerRow.findIndex((h: string) => h.includes("livro"));
    const idxObs = headerRow.findIndex((h: string) => h.includes("observacao") || h.includes("observação"));

    if (idxCPF === -1 || idxLivro === -1 || idxObs === -1) {
      console.error("Cabeçalhos não encontrados:", headerRow);
      return new Response(JSON.stringify({ error: "Cabeçalhos não encontrados na planilha!" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Procura duplicados
    const duplicated = rows.slice(1).filter((r: string[]) => (
      (r[idxCPF] || "").replace(/\D/g, "") === cpf.replace(/\D/g, "") &&
      (r[idxLivro] || "").trim().toLowerCase() === livro.trim().toLowerCase() &&
      (r[idxObs] || "").trim().toLowerCase() === observacao.trim().toLowerCase()
    ));

    console.log(`Encontrados ${duplicated.length} pedidos duplicados para CPF: ${cpf}, Livro: ${livro}, Observação: ${observacao}`);

    return new Response(JSON.stringify(duplicated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro na função get-book-orders-by-cpf-book-observacao:", err);
    return new Response(JSON.stringify({ error: `Erro: ${err?.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
