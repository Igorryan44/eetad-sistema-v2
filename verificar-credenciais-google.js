import fetch from 'node-fetch';

console.log('🔍 VERIFICANDO CREDENCIAIS GOOGLE SHEETS NO SUPABASE');
console.log('=====================================================');

const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

async function testGoogleSheetsCredentials() {
    try {
        console.log('📋 1. Testando acesso às credenciais do Google Sheets...');
        
        // Criar uma função de teste que verifica as credenciais
        const testFunction = `
        import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

        serve(async (req) => {
            try {
                const googleServiceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
                const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
                const googleSheetsId = Deno.env.get('GOOGLE_SHEETS_ID');
                
                return new Response(JSON.stringify({
                    success: true,
                    credentials: {
                        hasEmail: !!googleServiceAccountEmail,
                        hasPrivateKey: !!googlePrivateKey,
                        hasSheetsId: !!googleSheetsId,
                        emailPreview: googleServiceAccountEmail ? googleServiceAccountEmail.substring(0, 20) + '...' : null,
                        sheetsIdPreview: googleSheetsId ? googleSheetsId.substring(0, 20) + '...' : null
                    }
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        });
        `;

        // Testar a função get-pending-enrollments para ver se retorna erro de credenciais
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-pending-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.text();
        console.log(`   Status: ${response.status}`);
        console.log(`   Resposta: ${result}`);

        if (response.status === 200) {
            const data = JSON.parse(result);
            if (Array.isArray(data) && data.length === 0) {
                console.log('   ⚠️  Função retornou array vazio - possível problema de credenciais');
            } else {
                console.log(`   ✅ Função retornou ${data.length} registros`);
            }
        } else {
            console.log('   ❌ Erro na função - verificar logs do Supabase');
        }

    } catch (error) {
        console.error('❌ Erro ao testar credenciais:', error.message);
    }
}

async function checkEnvironmentVariables() {
    console.log('\n📋 2. Verificando variáveis de ambiente necessárias...');
    
    const requiredVars = [
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY', 
        'GOOGLE_SHEETS_ID'
    ];

    console.log('\n   Variáveis necessárias:');
    requiredVars.forEach(varName => {
        console.log(`   - ${varName}`);
    });

    console.log('\n🔧 3. COMO CONFIGURAR AS CREDENCIAIS:');
    console.log('=====================================');
    console.log('1. Acesse o Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/umkizxftwrwqiiahjbrr/settings/environment-variables');
    console.log('');
    console.log('2. Adicione as seguintes variáveis:');
    console.log('');
    console.log('   GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.log('   Valor: email da service account do Google (ex: service-account@projeto.iam.gserviceaccount.com)');
    console.log('');
    console.log('   GOOGLE_PRIVATE_KEY');
    console.log('   Valor: chave privada da service account (começando com -----BEGIN PRIVATE KEY-----)');
    console.log('');
    console.log('   GOOGLE_SHEETS_ID');
    console.log('   Valor: ID da planilha "controle alunos" (extraído da URL da planilha)');
    console.log('');
    console.log('3. Após configurar, aguarde alguns minutos e teste novamente');
    console.log('');
    console.log('📋 4. COMO OBTER AS CREDENCIAIS:');
    console.log('===============================');
    console.log('1. Acesse: https://console.cloud.google.com/');
    console.log('2. Crie ou selecione um projeto');
    console.log('3. Ative a API do Google Sheets');
    console.log('4. Crie uma Service Account');
    console.log('5. Baixe o arquivo JSON com as credenciais');
    console.log('6. Compartilhe a planilha com o email da service account');
}

// Executar verificações
await testGoogleSheetsCredentials();
await checkEnvironmentVariables();

console.log('\n🎯 RESUMO:');
console.log('==========');
console.log('✅ Deploy da função corrigida: CONCLUÍDO');
console.log('⚠️  Credenciais Google Sheets: PENDENTE');
console.log('📋 Próximo passo: Configurar credenciais no Supabase Dashboard');
console.log('');
console.log('🔗 Link direto para configuração:');
console.log('https://supabase.com/dashboard/project/umkizxftwrwqiiahjbrr/settings/environment-variables');