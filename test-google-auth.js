// Teste específico para autenticação do Google

import { validateGoogleCredentials, getGoogleAccessToken } from './local-server/utils/google-auth.js';

async function testGoogleAuth() {
  console.log('🔐 TESTE: Autenticação Google\n');
  
  try {
    // 1. Verificar se as variáveis de ambiente estão carregadas
    console.log('1️⃣ Verificando variáveis de ambiente...');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurado' : '❌ Não configurado');
    console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ Não configurado');
    console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Configurado' : '❌ Não configurado');
    
    // 2. Validar credenciais
    console.log('\n2️⃣ Validando credenciais...');
    const validation = await validateGoogleCredentials();
    console.log('Resultado da validação:', validation);
    
    if (!validation.isValid) {
      console.log('❌ Credenciais inválidas:', validation.error);
      return;
    }
    
    // 3. Testar geração de access token
    console.log('\n3️⃣ Testando geração de access token...');
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    const accessToken = await getGoogleAccessToken(serviceAccountEmail, privateKey);
    console.log('✅ Access token gerado com sucesso');
    console.log('Token (primeiros 50 caracteres):', accessToken.substring(0, 50) + '...');
    
    // 4. Testar uma requisição simples à API
    console.log('\n4️⃣ Testando requisição à API do Google Sheets...');
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API do Google Sheets respondeu com sucesso');
      console.log('Título da planilha:', data.properties?.title || 'N/A');
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API do Google Sheets:', response.status);
      console.log('Detalhes:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste
testGoogleAuth();