// Teste específico para verificar a estrutura da aba matriculas
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Configurações
const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';

// Credenciais corretas do Google Service Account
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

// Função para obter token de acesso
async function getAccessToken() {
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };
    
    const token = jwt.sign(payload, GOOGLE_PRIVATE_KEY, { algorithm: 'RS256' });
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });
    
    const data = await response.json();
    return data.access_token;
}

async function testMatriculasStructure() {
    console.log('🔍 TESTE ESTRUTURA - Verificando aba "matriculas" detalhadamente\n');
    
    try {
        const accessToken = await getAccessToken();
        
        // 1. Verificar dados existentes na aba matriculas
        console.log('1️⃣ Verificando dados existentes na aba "matriculas"...');
        const getResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas!A:H`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );
        
        const getData = await getResponse.json();
        console.log('📊 Resposta da API:', JSON.stringify(getData, null, 2));
        
        if (getData.values) {
            console.log(`📈 Total de linhas: ${getData.values.length}`);
            console.log('📋 Cabeçalhos:', getData.values[0]);
            
            if (getData.values.length > 1) {
                console.log('📝 Primeiras 3 linhas de dados:');
                for (let i = 1; i < Math.min(4, getData.values.length); i++) {
                    console.log(`   Linha ${i}:`, getData.values[i]);
                }
                
                console.log('📝 Últimas 3 linhas de dados:');
                for (let i = Math.max(1, getData.values.length - 3); i < getData.values.length; i++) {
                    console.log(`   Linha ${i}:`, getData.values[i]);
                }
            }
        } else {
            console.log('❌ Nenhum dado encontrado na aba matriculas');
        }
        
        // 2. Testar adição de uma linha específica
        console.log('\n2️⃣ Testando adição de linha específica...');
        const testData = [
            'João Teste',
            '123.456.789-00',
            'Núcleo Teste',
            'Subnúcleo Teste',
            'Ciclo Teste',
            new Date().toISOString().split('T')[0],
            'ativo',
            'Teste de adição'
        ];
        
        const appendResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas!A:H:append?valueInputOption=RAW`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [testData]
                })
            }
        );
        
        const appendResult = await appendResponse.json();
        console.log('📝 Resultado da adição:', JSON.stringify(appendResult, null, 2));
        
        // 3. Verificar se a linha foi adicionada
        console.log('\n3️⃣ Verificando se a linha foi adicionada...');
        const verifyResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas!A:H`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );
        
        const verifyData = await verifyResponse.json();
        if (verifyData.values) {
            console.log(`📈 Total de linhas após adição: ${verifyData.values.length}`);
            const lastRow = verifyData.values[verifyData.values.length - 1];
            console.log('📝 Última linha:', lastRow);
            
            if (lastRow && lastRow[0] === 'João Teste') {
                console.log('✅ Linha de teste encontrada com sucesso!');
            } else {
                console.log('❌ Linha de teste não encontrada');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testMatriculasStructure();