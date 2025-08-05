import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentData {
  nome: string;
  cpf: string;
  email: string;
  valor: number;
  livro: string;
  ciclo: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymentData: PaymentData = await req.json();
    
    // Validar dados obrigatórios
    if (!paymentData.nome || !paymentData.cpf || !paymentData.valor || !paymentData.livro) {
      throw new Error('Dados obrigatórios não fornecidos: nome, cpf, valor e livro são necessários');
    }
    
    // Validar CPF (deve ter 11 dígitos)
    const cpfNumbers = paymentData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos');
    }
    
    // Validar valor (deve ser positivo)
    if (paymentData.valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
    
    console.log('[MercadoPago] Dados recebidos e validados:', {
      nome: paymentData.nome,
      cpf: cpfNumbers.substring(0, 3) + '***',
      valor: paymentData.valor,
      livro: paymentData.livro,
      ciclo: paymentData.ciclo
    });
    
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('[MercadoPago] MERCADOPAGO_ACCESS_TOKEN não encontrado nas variáveis de ambiente');
      throw new Error('Sistema não configurado. Contate o administrador.');
    }
    
    // Validar formato do token
    if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
      console.error('[MercadoPago] Token com formato inválido');
      throw new Error('Token de acesso com formato inválido');
    }
    
    console.log('[MercadoPago] Token encontrado e validado, comprimento:', accessToken.length);
    console.log('[MercadoPago] Criando pagamento PIX para:', paymentData.nome);

    // Criar external_reference com informações do livro e ciclo
    const externalReference = `EETAD_${cpfNumbers}_${Date.now()}_${paymentData.livro.replace(/\s+/g, '_')}_${paymentData.ciclo.replace(/\s+/g, '_')}`;

    // Criar pagamento PIX no MercadoPago
    const paymentPayload = {
      transaction_amount: paymentData.valor,
      description: `EETAD - ${paymentData.livro} - ${paymentData.ciclo}`,
      payment_method_id: "pix",
      payer: {
        email: paymentData.email,
        first_name: paymentData.nome.split(' ')[0],
        last_name: paymentData.nome.split(' ').slice(1).join(' ') || 'Cliente',
        identification: {
          type: "CPF",
          number: cpfNumbers
        }
      },
      external_reference: externalReference,
      notification_url: `https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/mercadopago-webhook`
    };

    console.log('[MercadoPago] Payload do pagamento:', {
      ...paymentPayload,
      payer: {
        ...paymentPayload.payer,
        identification: {
          type: "CPF",
          number: cpfNumbers.substring(0, 3) + '***'
        }
      }
    });

    console.log('[MercadoPago] Enviando requisição para API...');
    const startTime = Date.now();

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': externalReference
      },
      body: JSON.stringify(paymentPayload)
    });

    const requestTime = Date.now() - startTime;
    console.log(`[MercadoPago] Resposta recebida em ${requestTime}ms`);

    const paymentResponse = await response.json();
    
    console.log('[MercadoPago] Status da resposta:', response.status);
    console.log('[MercadoPago] Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('[MercadoPago] Erro na API:', {
        status: response.status,
        statusText: response.statusText,
        response: paymentResponse
      });
      
      let errorMessage = 'Erro desconhecido na API do MercadoPago';
      
      if (response.status === 401) {
        errorMessage = 'Token de acesso inválido ou expirado. Verifique a configuração do MERCADOPAGO_ACCESS_TOKEN.';
      } else if (response.status === 400) {
        if (paymentResponse.cause && paymentResponse.cause.length > 0) {
          const causes = paymentResponse.cause.map(c => c.description).join(', ');
          errorMessage = `Dados inválidos: ${causes}`;
        } else {
          errorMessage = `Dados inválidos: ${paymentResponse.message || JSON.stringify(paymentResponse)}`;
        }
      } else if (response.status === 403) {
        errorMessage = 'Acesso negado. Verifique as permissões do token MercadoPago.';
      } else if (response.status === 429) {
        errorMessage = 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
      } else if (paymentResponse.message) {
        errorMessage = paymentResponse.message;
      }
      
      throw new Error(`MercadoPago API Error (${response.status}): ${errorMessage}`);
    }

    console.log('[MercadoPago] Pagamento criado com sucesso:', {
      id: paymentResponse.id,
      status: paymentResponse.status,
      external_reference: paymentResponse.external_reference
    });

    // Verificar se os dados do PIX foram retornados
    const pixData = paymentResponse.point_of_interaction?.transaction_data;
    if (!pixData) {
      console.error('[MercadoPago] Dados do PIX não encontrados na resposta:', paymentResponse);
      throw new Error('Dados do PIX não foram gerados. Tente novamente.');
    }

    console.log('[MercadoPago] Dados do PIX:', {
      qr_code_length: pixData.qr_code?.length || 0,
      qr_code_base64_length: pixData.qr_code_base64?.length || 0,
      ticket_url: !!pixData.ticket_url
    });

    // Salvar pagamento com status pendente no banco de dados
    try {
      console.log('[MercadoPago] Salvando pagamento pendente no banco de dados...');
      
      const pendingPaymentData = {
        payment_id: paymentResponse.id,
        nome: paymentData.nome,
        email: paymentData.email,
        valor: paymentData.valor,
        external_reference: paymentResponse.external_reference,
        date_of_expiration: paymentResponse.date_of_expiration || '',
        ticket_url: pixData.ticket_url || '',
        qr_code_base64: pixData.qr_code_base64 || ''
      };

      const savePendingResponse = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/save-pending-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify(pendingPaymentData)
      });

      if (savePendingResponse.ok) {
        console.log('[MercadoPago] Pagamento pendente salvo com sucesso no banco de dados');
      } else {
        const errorText = await savePendingResponse.text();
        console.error('[MercadoPago] Erro ao salvar pagamento pendente:', savePendingResponse.status, errorText);
        // Não falhar a criação do PIX por causa do erro de salvamento
      }
    } catch (saveError) {
      console.error('[MercadoPago] Erro ao salvar pagamento pendente:', saveError);
      // Não falhar a criação do PIX por causa do erro de salvamento
    }

    // Retornar dados do PIX para o frontend
    const result = {
      payment_id: paymentResponse.id,
      status: paymentResponse.status,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64,
      ticket_url: pixData.ticket_url,
      external_reference: paymentResponse.external_reference
    };

    console.log('[MercadoPago] Dados retornados:', {
      payment_id: result.payment_id,
      status: result.status,
      has_qr_code: !!result.qr_code,
      has_qr_code_base64: !!result.qr_code_base64,
      qr_code_preview: result.qr_code ? result.qr_code.substring(0, 50) + '...' : 'N/A'
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[MercadoPago] Erro ao criar pagamento:', error);
    console.error('[MercadoPago] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro na integração com MercadoPago',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);