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
    throw new Error(`[mercadopago-webhook] Erro ao obter token Google: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.access_token;
}

// Função para salvar pagamento confirmado na planilha
async function savePaymentToSheet(paymentData: any, accessToken: string, spreadsheetId: string) {
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

    // Preparar dados para a aba "pagamentos"
    const rowData = [
      paymentData.id.toString(),                    // A - ID do Pagamento
      cpf,                                          // B - CPF
      paymentData.payer?.first_name + ' ' + paymentData.payer?.last_name || '', // C - Nome
      livro,                                        // D - Livro
      ciclo,                                        // E - Ciclo
      paymentData.transaction_amount?.toString() || '0', // F - Valor
      paymentData.status || 'unknown',             // G - Status
      new Date().toLocaleString('pt-BR'),          // H - Data de Confirmação
      paymentData.external_reference || ''         // I - Referência Externa
    ];

    console.log('[mercadopago-webhook] Salvando pagamento na planilha:', rowData);

    // Salvar na aba "pagamentos"
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/pagamentos!A:I:append?valueInputOption=USER_ENTERED`;
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
      console.error("[mercadopago-webhook] Erro ao salvar na planilha:", apiResp.status, errorText);
      throw new Error(`Erro ao salvar pagamento na planilha: ${apiResp.status} - ${errorText}`);
    }

    const result = await apiResp.json();
    console.log('[mercadopago-webhook] Pagamento salvo na planilha com sucesso:', result);

    return { success: true, data: rowData };

  } catch (error: any) {
    console.error('[mercadopago-webhook] Erro ao salvar pagamento:', error);
    throw error;
  }
}

// Função para buscar dados do aluno por CPF
async function getStudentDataByCPF(cpf: string, accessToken: string, spreadsheetId: string) {
  try {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Buscar na aba "alunos matriculados"
    const range = 'alunos matriculados!A:Z';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      console.error('[getStudentDataByCPF] Erro ao buscar dados do aluno:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.values || data.values.length === 0) {
      return null;
    }

    const headers = data.values[0];
    const rows = data.values.slice(1);

    // Encontrar índices das colunas
    const cpfIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('cpf'));
    const nomeIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('nome'));
    const telefoneIndex = headers.findIndex((h: string) => h && h.toLowerCase().includes('telefone'));

    if (cpfIndex === -1) {
      console.error('[getStudentDataByCPF] Coluna CPF não encontrada');
      return null;
    }

    // Buscar aluno por CPF
    for (const row of rows) {
      const rowCpf = (row[cpfIndex] || '').toString().replace(/\D/g, '');
      if (rowCpf === cpfLimpo) {
        return {
          nome: row[nomeIndex] || '',
          telefone: row[telefoneIndex] || '',
          cpf: cpf
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[getStudentDataByCPF] Erro:', error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log('[mercadopago-webhook] Webhook recebido:', body);

    // Parse do body
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('[mercadopago-webhook] Erro ao fazer parse do JSON:', parseError);
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    console.log('[mercadopago-webhook] Dados do webhook:', webhookData);

    // Verificar se é uma notificação de pagamento
    if (webhookData.type !== 'payment' || !webhookData.data?.id) {
      console.log('[mercadopago-webhook] Não é uma notificação de pagamento, ignorando');
      return new Response('OK', { headers: corsHeaders });
    }

    const paymentId = webhookData.data.id;
    console.log('[mercadopago-webhook] Processando pagamento ID:', paymentId);

    // Buscar detalhes do pagamento no MercadoPago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('[mercadopago-webhook] Erro ao buscar pagamento:', paymentResponse.status, errorText);
      throw new Error(`Erro ao buscar pagamento: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('[mercadopago-webhook] Dados do pagamento:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount
    });

    // Processar apenas pagamentos aprovados
    if (paymentData.status === 'approved') {
      console.log('[mercadopago-webhook] Pagamento aprovado, atualizando status no banco de dados...');

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

      // Tentar atualizar o status do pagamento existente primeiro
      try {
        const updateStatusResponse = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/update-payment-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: paymentData.id,
            status: 'approved'
          })
        });

        if (updateStatusResponse.ok) {
          console.log('[mercadopago-webhook] Status atualizado com sucesso via update-payment-status');
        } else {
          console.log('[mercadopago-webhook] Pagamento não encontrado para atualização, criando novo registro...');
          // Se não conseguir atualizar, criar um novo registro
          await savePaymentToSheet(paymentData, googleAccessToken, spreadsheetId);
        }
      } catch (updateError) {
        console.log('[mercadopago-webhook] Erro ao atualizar status, criando novo registro:', updateError);
        // Se houver erro na atualização, criar um novo registro
        await savePaymentToSheet(paymentData, googleAccessToken, spreadsheetId);
      }

      // Enviar notificações WhatsApp
      try {
        // Buscar dados do aluno para obter telefone
        const studentData = await getStudentDataByCPF(
          paymentData.payer?.identification?.number || '',
          googleAccessToken,
          spreadsheetId
        );

        // Notificação para a secretaria
        const secretaryNotificationData = {
          type: 'payment_confirmed',
          paymentData: {
            valor: paymentData.transaction_amount,
            nome: `${paymentData.payer?.first_name} ${paymentData.payer?.last_name}`,
            cpf: paymentData.payer?.identification?.number,
            pagamento_id: paymentData.id,
            // Extrair livro e ciclo do external_reference
            livro: paymentData.external_reference?.split('_').slice(3, -1).join(' ').replace(/_/g, ' ') || 'Livro não identificado',
            ciclo: paymentData.external_reference?.split('_').pop()?.replace(/_/g, ' ') || 'Ciclo não identificado'
          }
        };

        const secretaryNotificationResponse = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/send-whatsapp-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(secretaryNotificationData)
        });

        if (secretaryNotificationResponse.ok) {
          console.log('[mercadopago-webhook] Notificação WhatsApp para secretaria enviada com sucesso');
        } else {
          console.error('[mercadopago-webhook] Erro ao enviar notificação WhatsApp para secretaria:', secretaryNotificationResponse.status);
        }

        // Notificação para o aluno (se tiver telefone)
        if (studentData && studentData.telefone) {
          const studentNotificationData = {
            type: 'student_payment_confirmed',
            paymentData: {
              valor: paymentData.transaction_amount,
              nome: studentData.nome,
              cpf: paymentData.payer?.identification?.number,
              telefone: studentData.telefone,
              livro: paymentData.external_reference?.split('_').slice(3, -1).join(' ').replace(/_/g, ' ') || 'Livro não identificado',
              ciclo: paymentData.external_reference?.split('_').pop()?.replace(/_/g, ' ') || 'Ciclo não identificado'
            }
          };

          const studentNotificationResponse = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/send-whatsapp-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentNotificationData)
          });

          if (studentNotificationResponse.ok) {
            console.log('[mercadopago-webhook] Notificação WhatsApp para aluno enviada com sucesso');
          } else {
            console.error('[mercadopago-webhook] Erro ao enviar notificação WhatsApp para aluno:', studentNotificationResponse.status);
          }

          // Enviar email de confirmação de pagamento para o aluno
          if (studentData.email) {
            try {
              const emailNotificationData = {
                type: 'payment_confirmed',
                studentData: {
                  nome: studentData.nome,
                  email: studentData.email,
                  cpf: paymentData.payer?.identification?.number,
                  telefone: studentData.telefone,
                  livro: paymentData.external_reference?.split('_').slice(3, -1).join(' ').replace(/_/g, ' ') || 'Livro não identificado',
                  ciclo: paymentData.external_reference?.split('_').pop()?.replace(/_/g, ' ') || 'Ciclo não identificado',
                  valor: paymentData.transaction_amount
                }
              };

              const emailResponse = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/send-email-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailNotificationData)
              });

              if (emailResponse.ok) {
                console.log('[mercadopago-webhook] Email de confirmação de pagamento enviado com sucesso');
              } else {
                console.error('[mercadopago-webhook] Erro ao enviar email de confirmação:', emailResponse.status);
              }
            } catch (emailError) {
              console.error('[mercadopago-webhook] Erro ao enviar email de confirmação:', emailError);
            }
          } else {
            console.log('[mercadopago-webhook] Email do aluno não disponível');
          }
        } else {
          console.log('[mercadopago-webhook] Dados do aluno não encontrados ou telefone não disponível, enviando apenas para secretaria');
        }

      } catch (notificationError) {
        console.error('[mercadopago-webhook] Erro ao enviar notificações:', notificationError);
        // Não falhar o webhook por causa da notificação
      }

      console.log('[mercadopago-webhook] Pagamento processado com sucesso');
    } else {
      console.log(`[mercadopago-webhook] Pagamento com status '${paymentData.status}', não processando`);
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (error: any) {
    console.error('[mercadopago-webhook] Erro no webhook:', error);
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