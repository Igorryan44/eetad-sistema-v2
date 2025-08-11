// Script para limpar dados de teste da planilha Google Sheets
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Usar as mesmas credenciais que funcionaram no script anterior
const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'eetad-service@testen8n-448514.iam.gserviceaccount.com';
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

async function limparDadosTeste() {
    console.log('🧹 LIMPEZA DE DADOS DE TESTE');
    console.log('============================\n');
    
    try {
        const accessToken = await getAccessToken();
        
        // 1. Verificar dados na aba matriculas
        console.log('1️⃣ Verificando dados na aba "matriculas"...');
        const getResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas!A:H`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );
        
        const getData = await getResponse.json();
        
        if (!getData.values || getData.values.length <= 1) {
            console.log('✅ Nenhum dado encontrado na aba matriculas');
            return;
        }
        
        console.log(`📊 Total de linhas: ${getData.values.length}`);
        
        // 2. Identificar linhas de teste
        const linhasTeste = [];
        for (let i = 1; i < getData.values.length; i++) {
            const row = getData.values[i];
            const nome = row[0] || '';
            const nucleo = row[2] || '';
            const subnucleo = row[3] || '';
            const ciclo = row[4] || '';
            const observacao = row[7] || '';
            
            // Verificar se é linha de teste
            if (nome.includes('Teste') || 
                nucleo.includes('Teste') || 
                subnucleo.includes('Teste') || 
                ciclo.includes('Teste') ||
                observacao.includes('Teste') ||
                observacao.includes('teste')) {
                
                linhasTeste.push({
                    linha: i + 1,
                    dados: row
                });
            }
        }
        
        console.log(`🔍 Encontradas ${linhasTeste.length} linhas de teste:`);
        linhasTeste.forEach(item => {
            console.log(`   Linha ${item.linha}: ${item.dados[0]} | ${item.dados[2]} | ${item.dados[7]}`);
        });
        
        if (linhasTeste.length === 0) {
            console.log('✅ Nenhuma linha de teste encontrada');
            return;
        }
        
        // 3. Limpar dados de teste (substituir por linhas vazias)
        console.log('\n2️⃣ Limpando linhas de teste...');
        
        for (const item of linhasTeste) {
            const range = `matriculas!A${item.linha}:H${item.linha}`;
            
            console.log(`   🧹 Limpando linha ${item.linha}...`);
            
            const clearResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${range}:clear`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (clearResponse.ok) {
                console.log(`   ✅ Linha ${item.linha} limpa com sucesso`);
            } else {
                console.log(`   ❌ Erro ao limpar linha ${item.linha}`);
            }
            
            // Aguardar um pouco entre as operações
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 4. Verificar resultado final
        console.log('\n3️⃣ Verificando resultado final...');
        const finalResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/matriculas!A:H`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );
        
        const finalData = await finalResponse.json();
        const totalFinal = finalData.values ? finalData.values.length : 0;
        
        console.log(`📊 Total de linhas após limpeza: ${totalFinal}`);
        console.log('✅ Limpeza concluída com sucesso!');
        
        // 5. Mostrar dados restantes
        if (finalData.values && finalData.values.length > 1) {
            console.log('\n📋 Dados restantes na planilha:');
            for (let i = 1; i < finalData.values.length; i++) {
                const row = finalData.values[i];
                if (row[0]) { // Se há nome na linha
                    console.log(`   ${i}: ${row[0]} | ${row[1]} | ${row[2]} | ${row[4]}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
    }
}

// Executar limpeza
limparDadosTeste();