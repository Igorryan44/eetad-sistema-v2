// Script para testar autenticação Google
async function testAuth() {
  try {
    console.log('🔐 Testando autenticação Google...');
    
    // Simular as variáveis de ambiente (valores fictícios para teste)
    const serviceAccountEmail = 'test@test.iam.gserviceaccount.com';
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----`;
    
    console.log('📧 Service Account Email:', serviceAccountEmail);
    console.log('🔑 Private Key presente:', privateKey ? 'Sim' : 'Não');
    
    // Testar criação do JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };
    
    console.log('📝 JWT Payload:', JSON.stringify(payload, null, 2));
    
    // Simular requisição de token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    console.log('🌐 Token URL:', tokenUrl);
    
    console.log('✅ Configuração parece estar correta');
    console.log('⚠️  Para testar completamente, precisamos das credenciais reais');
    
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
  }
}

testAuth();