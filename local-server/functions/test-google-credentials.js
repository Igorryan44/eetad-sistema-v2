import { validateGoogleCredentials, getGoogleJwt, getGoogleAccessToken } from '../utils/google-auth.js';
import crypto from 'crypto';

export async function testGoogleCredentials(req, res) {
  try {
    console.log('🔍 Iniciando teste de credenciais do Google...');
    
    // Verificar variáveis de ambiente
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
    const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');
     const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
     
     // Verificar formato da chave privada
     const processedPrivateKey = privateKey;
    const privateKeyFormat = {
      hasBegin: privateKey?.includes('-----BEGIN PRIVATE KEY-----') || false,
      hasEnd: privateKey?.includes('-----END PRIVATE KEY-----') || false,
      length: privateKey?.length || 0,
      processedLength: processedPrivateKey?.length || 0,
      hasNewlines: processedPrivateKey?.includes('\n') || false
    };
    
    console.log('📧 Service Account Email:', serviceAccountEmail ? 'PRESENTE' : 'AUSENTE');
    console.log('🔑 Private Key Raw:', privateKeyRaw ? 'PRESENTE' : 'AUSENTE');
    console.log('🔑 Private Key Raw length:', privateKeyRaw?.length || 0);
    console.log('🔑 Private Key Raw first 50:', privateKeyRaw?.substring(0, 50) || 'N/A');
    console.log('🔑 Private Key Processed:', privateKey ? 'PRESENTE' : 'AUSENTE');
    console.log('🔑 Private Key Processed length:', privateKey?.length || 0);
    console.log('🔑 Private Key Processed first 50:', privateKey?.substring(0, 50) || 'N/A');
    console.log('📊 Spreadsheet ID:', spreadsheetId ? 'PRESENTE' : 'AUSENTE');
    
    if (privateKey) {
      console.log('🔑 Private Key length:', privateKey.length);
      console.log('🔑 Private Key first 100 chars:', privateKey.substring(0, 100));
      console.log('🔑 Private Key início:', privateKey.substring(0, 50) + '...');
      console.log('🔑 Private Key fim:', '...' + privateKey.substring(privateKey.length - 50));
      console.log('🔑 Private Key contém BEGIN:', privateKey.includes('-----BEGIN PRIVATE KEY-----'));
      console.log('🔑 Private Key contém END:', privateKey.includes('-----END PRIVATE KEY-----'));
      
      // Teste de validação da chave com crypto
      try {
        const keyObject = crypto.createPrivateKey(privateKey);
        console.log('✅ Chave privada é válida segundo crypto.createPrivateKey');
        console.log('🔑 Key type:', keyObject.asymmetricKeyType);
        console.log('🔑 Key size:', keyObject.asymmetricKeySize);
      } catch (cryptoError) {
        console.error('❌ Erro ao validar chave com crypto:', cryptoError.message);
      }
    }
    
    // Teste 1: Validação básica
    console.log('\n📋 Teste 1: Validação básica das credenciais');
    const validation = await validateGoogleCredentials();
    console.log('✅ Resultado da validação:', validation);
    
    // Teste 2: Geração de JWT
    console.log('\n📋 Teste 2: Geração de JWT');
    try {
      const jwt = await getGoogleJwt(serviceAccountEmail, privateKey);
      console.log('✅ JWT gerado com sucesso (primeiros 50 chars):', jwt.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Erro ao gerar JWT:', error.message);
      console.error('❌ Stack trace:', error.stack);
    }
    
    // Teste 3: Obtenção de Access Token
    console.log('\n📋 Teste 3: Obtenção de Access Token');
    try {
      const accessToken = await getGoogleAccessToken(serviceAccountEmail, privateKey);
      console.log('✅ Access Token obtido com sucesso (primeiros 20 chars):', accessToken.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Erro ao obter Access Token:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Teste de credenciais concluído',
      validation,
      hasEmail: !!serviceAccountEmail,
      hasPrivateKey: !!privateKey,
      hasSpreadsheetId: !!spreadsheetId,
      privateKeyFormat: {
        hasBegin: privateKey?.includes('-----BEGIN PRIVATE KEY-----'),
        hasEnd: privateKey?.includes('-----END PRIVATE KEY-----'),
        length: privateKey?.length,
        rawLength: privateKeyRaw?.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de credenciais:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
}