import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelOrderRequest {
  cpf: string;
  livro: string;
  payment_id?: string;
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
    throw new Error(`[cancel-order] Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

// Função para obter o sheetId de uma aba específica
async function getSheetId(sheetName: string, accessToken: string, spreadsheetId: string): Promise<number> {
  try {
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const response = await fetch(metadataUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter metadados da planilha: ${response.status}`);
    }

    const metadata = await response.json();
    const sheet = metadata.sheets?.find((s: any) => s.properties.title === sheetName);
    
    if (!sheet) {
      throw new Error(`Aba "${sheetName}" não encontrada`);
    }

    return sheet.properties.sheetId;
  } catch (error) {
    console.error(`[cancel-order] Erro ao obter sheetId para ${sheetName}:`, error);
    // Fallback para IDs padrão se não conseguir obter dinamicamente
    return sheetName === 'pedidos' ? 0 : 1;
  }
}
async function cancelMercadoPagoPayment(paymentId: string) {
  try {
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken || !paymentId) {
      console.log('[cancel-order] Token MercadoPago ou payment_id não disponível, pulando cancelamento');
      return;
    }

    console.log('[cancel-order] Cancelando pagamento MercadoPago:', paymentId);

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    if (response.ok) {
      console.log('[cancel-order] Pagamento MercadoPago cancelado com sucesso');
    } else {
      console.log('[cancel-order] Erro ao cancelar pagamento MercadoPago:', response.status);
    }
  } catch (error) {
    console.error('[cancel-order] Erro ao cancelar pagamento MercadoPago:', error);
  }
}

// Função para remover linha da planilha
async function removeFromSheet(sheetName: string, cpf: string, livro: string, accessToken: string, spreadsheetId: string) {
  try {
    console.log(`[cancel-order] Iniciando remoção de ${sheetName} para CPF: ${cpf}, Livro: ${livro}`);
    
    // Buscar dados da planilha
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`;
    const getResponse = await fetch(getUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!getResponse.ok) {
      throw new Error(`Erro ao buscar dados da planilha ${sheetName}: ${getResponse.status}`);
    }

    const data = await getResponse.json();
    if (!data.values || data.values.length === 0) {
      console.log(`[cancel-order] Planilha ${sheetName} vazia`);
      return;
    }

    const rows = data.values;
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    console.log(`[cancel-order] Planilha ${sheetName} tem ${rows.length} linhas. Procurando por CPF: ${cpfLimpo}, Livro: ${livro}`);
    
    // Encontrar linhas para remover
    const rowsToDelete: number[] = [];
    
    for (let i = 1; i < rows.length; i++) { // Pular cabeçalho
      const row = rows[i];
      
      if (sheetName === 'pedidos') {
        // Estrutura da aba "pedidos": A=external_reference, B=cpf, C=nome, D=ciclo, E=livro, F=data, G=observacao, H=status
        const rowCpf = (row[1] || '').toString().replace(/\D/g, ''); // Coluna B (CPF)
        const rowLivro = (row[4] || '').toString().trim(); // Coluna E (Livro)
        
        console.log(`[cancel-order] Linha ${i}: CPF=${rowCpf}, Livro=${rowLivro}`);
        
        if (rowCpf === cpfLimpo && rowLivro.toLowerCase() === livro.toLowerCase()) {
          rowsToDelete.push(i + 1); // +1 porque as linhas no Sheets começam em 1
          console.log(`[cancel-order] ✓ Linha ${i + 1} marcada para remoção`);
        }
      } else if (sheetName === 'pagamentos') {
        // Nova estrutura da aba "pagamentos": 
        // A=external_reference, B=Email, C=Transação_ID, D=Valor, E=Data_PIX, F=Status, G=Nome, H=cpf, I=Data_Pagamento, J=Validade, K=Pix_url, L=Pix_base64, M=livro, N=ciclo
        const rowCpf = (row[7] || '').toString().replace(/\D/g, ''); // Coluna H (cpf)
        const rowLivro = (row[12] || '').toString().trim(); // Coluna M (livro)
        
        console.log(`[cancel-order] Linha ${i}: CPF=${rowCpf}, Livro=${rowLivro}`);
        
        if (rowCpf === cpfLimpo && rowLivro.toLowerCase() === livro.toLowerCase()) {
          rowsToDelete.push(i + 1); // +1 porque as linhas no Sheets começam em 1
          console.log(`[cancel-order] ✓ Linha ${i + 1} marcada para remoção`);
        }
      }
    }

    console.log(`[cancel-order] Encontradas ${rowsToDelete.length} linhas para remover em ${sheetName}`);

    if (rowsToDelete.length === 0) {
      console.log(`[cancel-order] Nenhuma linha encontrada para remover em ${sheetName}`);
      return;
    }

    // Obter o sheetId dinamicamente
    const sheetId = await getSheetId(sheetName, accessToken, spreadsheetId);
    console.log(`[cancel-order] SheetId para ${sheetName}: ${sheetId}`);

    // Remover linhas (de trás para frente para não afetar os índices)
    for (const rowIndex of rowsToDelete.reverse()) {
      console.log(`[cancel-order] Removendo linha ${rowIndex} da aba ${sheetName}`);
      
      const deleteUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      const deletePayload = {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }]
      };

      const deleteResponse = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deletePayload)
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error(`[cancel-order] Erro ao remover linha ${rowIndex} de ${sheetName}:`, errorText);
        throw new Error(`Erro ao remover linha ${rowIndex} de ${sheetName}: ${deleteResponse.status}`);
      }

      console.log(`[cancel-order] ✓ Linha ${rowIndex} removida com sucesso de ${sheetName}`);
    }

    console.log(`[cancel-order] Remoção concluída para ${sheetName}`);
  } catch (error) {
    console.error(`[cancel-order] Erro ao remover de ${sheetName}:`, error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf, livro, payment_id }: CancelOrderRequest = await req.json();

    if (!cpf || !livro) {
      return new Response(
        JSON.stringify({ error: 'CPF e livro são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[cancel-order] Cancelando pedido - CPF: ${cpf}, Livro: ${livro}, Payment ID: ${payment_id}`);

    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      console.error('[cancel-order] Credenciais do Google Sheets não configuradas');
      throw new Error('Configuração do Google Sheets incompleta');
    }

    console.log(`[cancel-order] Credenciais obtidas - SpreadsheetId: ${spreadsheetId}, ServiceAccount: ${serviceAccountEmail}`);

    // Preparar chave privada
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Obter token de acesso
    console.log('[cancel-order] Obtendo token de acesso do Google...');
    const jwt = await getGoogleJwt(serviceAccountEmail, privateKey);
    const accessToken = await getGoogleAccessToken(jwt);
    console.log('[cancel-order] Token de acesso obtido com sucesso');

    // Cancelar pagamento no MercadoPago (se existir)
    if (payment_id) {
      console.log(`[cancel-order] Cancelando pagamento MercadoPago: ${payment_id}`);
      await cancelMercadoPagoPayment(payment_id);
      console.log('[cancel-order] Pagamento MercadoPago cancelado');
    }

    // Remover registros das planilhas
    console.log('[cancel-order] Removendo registros da aba "pedidos"...');
    await removeFromSheet('pedidos', cpf, livro, accessToken, spreadsheetId);
    console.log('[cancel-order] Removendo registros da aba "pagamentos"...');
    await removeFromSheet('pagamentos', cpf, livro, accessToken, spreadsheetId);

    console.log('[cancel-order] Cancelamento concluído com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pedido cancelado e registros removidos com sucesso' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[cancel-order] Erro ao cancelar pedido:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);