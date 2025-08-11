// Script para configurar credenciais do Google via API do Supabase
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Credenciais corretas
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com';
const GOOGLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvoypC5H++3vN+
WRUXmc2tPZ7HRgGW3KtgmTTGMV02SOAEB3SCmoMkzXpMYbNoH10KlA2aJbMpXGac
4khGHQU1R5btR6o9nU3MKCBYCLR0BWFZhlMQtp4bO+m8GEHttPa34OL09LVedktY
uwQ9NYf74tR8BECQmFRAvxDxt/Xi6ZK7CRFAkdj1X1Og2BK4d6tTdrclSGix3Ng7
FkwYF+cxM9l3pxBqtwZLVwsLKZ6e+T5tB8RPUNPy665+QiRcWYMxFVb30ukxAPrM
NpEfF5fzfL4ys1KFYnIIA+OWfZheXP54bBkbhrrq7y06IyhC+g3fe3KfJ7+F2cKY
24e7nEJzAgMBAAECggEAVzxclkL17DDCkgPfBQzgamaLwYBU88CA4obV/oawPHEv
yvCE/wWNk673So7QVCwXw1RL+T82YJnDYbLGoQRy/MalAQ+yT84cwQVBI1iXgHTX
qGaeRVPe7bnxWvpVbKKQVD4/m9kbaGKrA9RHw7sd4o8EaOCXzPnMByifWt+7Ikt7
DKr2vD3Lm9uNppqzmTKSHl5AcXoT0zOf3kMoJPkUyCLYqerYTLQk5V0FbB/7EY/n
rvk8E/ZMBxGImLPCrlDc93gwendGR71+FXGkayERgkXLvM4eAeALTB39NcEWc/WJ
daa38k3wD1dBdwOfe6nFsuKwicSmQEb74GjX4gn/6QKBgQDt2OOBTVsUwI6V5Bwz
DP/n8MPspJ8XPeqb57BtQ4KBDu+I2mUkc95sta99oToE8SQGICOIYQRbZBjNmVgt
OnFp48f0fjv6NVsQ++uYZxDNKKkplQRi6hf2wb/0Pl3MZgeNNTYBrWO63ZR7oiRK
qzpIIWNqAPkjGsUjhx87Nttu1wKBgQC9Cs53fVXdOe0Uw/Vq0ZIFRILfpQv2FHt+
4nZb+HnL1DzGOyCK8URA5EcCK5UV1z14jA15vrMGcKCQQ8AHRRyx51g48+LCCWu3
gSFQXxUHp1LIPgEFI8/S/KSMewhh3FoGMVFmiDFnvpaHa/YJodZdUb+Tzz1ndXG4
mDjbGLPhxQKBgQCsqqyWnOrHSPb6N+yE3yYUYoRJkkTwYYGlBvDckYr3WDlqt2l/
qiJJ9yfcYyQ0nD7Tt5c0FYJNOoCLGYya4PeesL7jbpTqErv2u3wQWpom5iLQTh8u
E9WrzIImtPPxRAytZXi8hPyGlv+JNW91SZL49Ewwk15KLs/498ojebKZZwKBgDYT
cEo3/SbiWhI1l+9tcYK2PWWyNcC3zTfXmhnm8xg+ZwAhi8aTC34wjqttQiFUR85C
6dvolBeEgjmiV7z8pR+y2Ma55SSyQzDj7F6sRDzDPWfwbKRGwT1ObdeNnjE4MjxR
QUK+NLvDhhXI6UGKHOLm7pFel+cPbm9qg+EQqOwtAoGAR7krzL0NNsRelJ4f3xu4
gnrhMT+bVlFV65TSQbmWF26df19uxzQdGSb+DdnQOCI4ZsgO3q87Lu4EZ5tezT5R
pdUtTvhDoKtflUeiciVTmn6tCSmfrQp9uCMmxQZlkMqzhY+NWlES9R49p+jZI+DT
VoGgXze+8D2Bu7g9qemRGts=
-----END PRIVATE KEY-----`;
const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';

async function testCredentialsConfiguration() {
    console.log('🔧 CONFIGURAÇÃO DE CREDENCIAIS - Testando via função do Supabase\n');
    
    try {
        // Criar uma função de teste para configurar as credenciais
        console.log('1️⃣ Testando configuração das credenciais...');
        
        const testData = {
            action: 'test_credentials',
            credentials: {
                GOOGLE_SERVICE_ACCOUNT_EMAIL,
                GOOGLE_PRIVATE_KEY,
                GOOGLE_SHEETS_SPREADSHEET_ID
            }
        };
        
        // Vou testar diretamente com a função finalize-enrollment para ver o erro
        console.log('2️⃣ Testando função finalize-enrollment com dados de teste...');
        
        const finalizeData = {
            cpf: '61767735120',
            rowIndex: 2,
            ciclo: 'Ciclo 2025',
            subnucleo: 'Subnúcleo Teste',
            data: new Date().toLocaleDateString('pt-BR'),
            status: 'Efetivado',
            observacao: `Teste de credenciais - ${new Date().toLocaleString('pt-BR')}`
        };
        
        console.log('📝 Dados do teste:', JSON.stringify(finalizeData, null, 2));
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/finalize-enrollment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalizeData)
        });
        
        const result = await response.json();
        console.log('📊 Resposta da função:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ Função retornou sucesso');
            
            // Verificar se realmente foi salvo na planilha
            console.log('\n3️⃣ Verificando se foi salvo na planilha...');
            
            // Aguardar um pouco
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar diretamente na planilha
            const { default: jwt } = await import('jsonwebtoken');
            
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
            };
            
            const token = jwt.sign(payload, GOOGLE_PRIVATE_KEY, { algorithm: 'RS256' });
            
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
            });
            
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            
            const sheetsResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas!A:H`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            
            const sheetsData = await sheetsResponse.json();
            console.log('📊 Dados da planilha:', JSON.stringify(sheetsData, null, 2));
            
            if (sheetsData.values && sheetsData.values.length > 2) {
                console.log('✅ Nova matrícula encontrada na planilha!');
                console.log('📝 Última linha:', sheetsData.values[sheetsData.values.length - 1]);
            } else {
                console.log('❌ Matrícula não foi salva na planilha');
            }
            
        } else {
            console.log('❌ Função retornou erro:', result);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testCredentialsConfiguration();