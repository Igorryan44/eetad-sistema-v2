import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id } = await req.json();
    
    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'Payment ID é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do MercadoPago não configurado' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[MercadoPago] Verificando status do pagamento:', payment_id);

    // Consultar status do pagamento no MercadoPago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MercadoPago] Erro ao consultar pagamento:', response.status, errorText);
      throw new Error(`Erro ao consultar pagamento: ${response.status}`);
    }

    const payment = await response.json();
    
    console.log('[MercadoPago] Status do pagamento:', payment.status);

    // Se o pagamento foi aprovado, atualizar status no banco de dados
    if (payment.status === 'approved') {
      try {
        console.log('[MercadoPago] Pagamento aprovado, atualizando status no banco de dados...');
        
        const updateStatusResponse = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/update-payment-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: payment.id,
            status: 'approved'
          })
        });

        if (updateStatusResponse.ok) {
          console.log('[MercadoPago] Status atualizado com sucesso no banco de dados');
        } else {
          console.error('[MercadoPago] Erro ao atualizar status no banco de dados:', updateStatusResponse.status);
        }
      } catch (updateError) {
        console.error('[MercadoPago] Erro ao atualizar status no banco de dados:', updateError);
        // Não falhar a verificação por causa do erro de atualização
      }
    }

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        external_reference: payment.external_reference
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[MercadoPago] Erro ao verificar status do pagamento:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao consultar status no MercadoPago'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);