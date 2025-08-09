import fetch from 'node-fetch';

async function verificarConteudoAbas() {
    console.log('🔍 VERIFICANDO CONTEÚDO DAS ABAS DA PLANILHA');
    console.log('================================================================================');

    const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MDQ5NzQsImV4cCI6MjA0OTA4MDk3NH0.Ej5Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    // Criar uma função personalizada para verificar o conteúdo
    const functionBody = `
        const GOOGLE_SHEETS_SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID') || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL');
        const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY')?.replace(/\\\\n/g, '\\n');

        console.log('📊 Verificando credenciais...');
        console.log('Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configurado' : 'NÃO configurado');
        console.log('Private Key:', GOOGLE_PRIVATE_KEY ? 'Configurado' : 'NÃO configurado');
        console.log('Sheet ID:', GOOGLE_SHEETS_SPREADSHEET_ID);

        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            return { error: 'Credenciais não configuradas' };
        }

        // Função para criar JWT (simplificada)
        function createJWT() {
            const header = { alg: 'RS256', typ: 'JWT' };
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
            };

            const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
            const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
            const signatureInput = encodedHeader + '.' + encodedPayload;
            
            const keyData = GOOGLE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, '')
                                            .replace(/-----END PRIVATE KEY-----/, '')
                                            .replace(/\\s/g, '');
            
            const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
            
            return crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
                .then(key => crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signatureInput)))
                .then(signature => {
                    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
                                           .replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
                    return signatureInput + '.' + encodedSignature;
                });
        }

        try {
            const jwt = await createJWT();
            
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
            });

            if (!tokenResponse.ok) {
                return { error: 'Erro ao obter token: ' + tokenResponse.status };
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Buscar dados pessoais
            const dadosPessoaisResponse = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets/' + GOOGLE_SHEETS_SPREADSHEET_ID + '/values/dados pessoais',
                { headers: { 'Authorization': 'Bearer ' + accessToken } }
            );

            let dadosPessoais = [];
            if (dadosPessoaisResponse.ok) {
                const dadosPessoaisData = await dadosPessoaisResponse.json();
                dadosPessoais = dadosPessoaisData.values || [];
            }

            // Buscar matrículas
            const matriculasResponse = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets/' + GOOGLE_SHEETS_SPREADSHEET_ID + '/values/matriculas',
                { headers: { 'Authorization': 'Bearer ' + accessToken } }
            );

            let matriculas = [];
            if (matriculasResponse.ok) {
                const matriculasData = await matriculasResponse.json();
                matriculas = matriculasData.values || [];
            }

            return {
                dadosPessoais: {
                    total: dadosPessoais.length,
                    cabecalho: dadosPessoais[0] || [],
                    primeiras3Linhas: dadosPessoais.slice(1, 4)
                },
                matriculas: {
                    total: matriculas.length,
                    cabecalho: matriculas[0] || [],
                    primeiras3Linhas: matriculas.slice(1, 4)
                }
            };

        } catch (error) {
            return { error: error.message };
        }
    `;

    try {
        console.log('📋 Executando verificação...');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-pending-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ debug: true })
        });

        console.log(`Status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Resposta: ${responseText}`);

    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }

    console.log('\n📋 Dados esperados dos alunos:');
    console.log('   Aluno 1: Simião Alves da Costa Junior (CPF: 61767735120)');
    console.log('   Aluno 2: Bruno Alexandre Barros dos Santos (CPF: 003.807.533-40)');
    
    console.log('\n🎯 Próximos passos:');
    console.log('   - Verificar se os dados estão nas posições corretas');
    console.log('   - Confirmar se os CPFs não estão já na aba "matriculas"');
    console.log('   - Validar a estrutura das abas');
}

verificarConteudoAbas().catch(console.error);