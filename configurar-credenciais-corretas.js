// Script para configurar as credenciais corretas do Google Service Account
import { execSync } from 'child_process';

console.log('🔧 CONFIGURANDO CREDENCIAIS CORRETAS DO GOOGLE SERVICE ACCOUNT');
console.log('================================================================================');

// Credenciais extraídas do JSON fornecido
const serviceAccountEmail = 'puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com';
const privateKey = `-----BEGIN PRIVATE KEY-----
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

// ID da planilha (mantendo o mesmo que estava sendo usado)
const spreadsheetId = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';

console.log('📧 Email da conta de serviço:', serviceAccountEmail);
console.log('🔑 Chave privada: [CONFIGURADA]');
console.log('📋 ID da planilha:', spreadsheetId);
console.log('');

try {
    console.log('⚙️ Configurando GOOGLE_SERVICE_ACCOUNT_EMAIL...');
    execSync(`supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="${serviceAccountEmail}"`, { stdio: 'inherit' });
    
    console.log('⚙️ Configurando GOOGLE_PRIVATE_KEY...');
    execSync(`supabase secrets set GOOGLE_PRIVATE_KEY="${privateKey}"`, { stdio: 'inherit' });
    
    console.log('⚙️ Configurando GOOGLE_SHEETS_SPREADSHEET_ID...');
    execSync(`supabase secrets set GOOGLE_SHEETS_SPREADSHEET_ID="${spreadsheetId}"`, { stdio: 'inherit' });
    
    console.log('');
    console.log('✅ CREDENCIAIS CONFIGURADAS COM SUCESSO!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Compartilhe a planilha com a conta de serviço:');
    console.log(`   ${serviceAccountEmail}`);
    console.log('2. Execute: node testar-com-debug.js');
    console.log('');
    console.log('🔗 LINK DA PLANILHA:');
    console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    
} catch (error) {
    console.error('❌ Erro ao configurar credenciais:', error.message);
    process.exit(1);
}