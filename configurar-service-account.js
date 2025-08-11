import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Configurador de Service Account do Google\n');

console.log('📋 PASSOS PARA CRIAR UM SERVICE ACCOUNT:');
console.log('1. Acesse: https://console.cloud.google.com/');
console.log('2. Selecione seu projeto: testen8n-448514');
console.log('3. Vá em "IAM & Admin" > "Service Accounts"');
console.log('4. Clique em "CREATE SERVICE ACCOUNT"');
console.log('5. Preencha:');
console.log('   - Nome: eetad-service');
console.log('   - ID: eetad-service');
console.log('   - Descrição: Service account para EETAD Sistema');
console.log('6. Clique em "CREATE AND CONTINUE"');
console.log('7. Em "Grant this service account access to project":');
console.log('   - Adicione a role: "Editor" ou "Google Sheets API"');
console.log('8. Clique em "CONTINUE" e depois "DONE"');
console.log('9. Na lista de Service Accounts, clique no email do service account criado');
console.log('10. Vá na aba "KEYS"');
console.log('11. Clique em "ADD KEY" > "Create new key"');
console.log('12. Selecione "JSON" e clique em "CREATE"');
console.log('13. Um arquivo JSON será baixado automaticamente\n');

console.log('📁 DEPOIS DE BAIXAR O ARQUIVO JSON:');
console.log('1. Coloque o arquivo JSON nesta pasta do projeto');
console.log('2. Execute: node configurar-service-account.js nome-do-arquivo.json');
console.log('3. O script irá extrair as credenciais e configurar o .env.local\n');

// Verifica se foi fornecido um arquivo JSON
const jsonFile = process.argv[2];

if (!jsonFile) {
  console.log('❌ Nenhum arquivo JSON fornecido.');
  console.log('💡 Uso: node configurar-service-account.js caminho-para-arquivo.json');
  process.exit(1);
}

const jsonPath = path.resolve(__dirname, jsonFile);

if (!fs.existsSync(jsonPath)) {
  console.log(`❌ Arquivo não encontrado: ${jsonPath}`);
  process.exit(1);
}

try {
  console.log('📖 Lendo arquivo JSON...');
  const serviceAccountData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Valida se é um arquivo de service account válido
  if (!serviceAccountData.type || serviceAccountData.type !== 'service_account') {
    console.log('❌ Este não é um arquivo de Service Account válido.');
    console.log('💡 Certifique-se de baixar o arquivo JSON do Service Account, não do OAuth2 Client.');
    process.exit(1);
  }
  
  if (!serviceAccountData.client_email || !serviceAccountData.private_key) {
    console.log('❌ Arquivo JSON incompleto. Faltam client_email ou private_key.');
    process.exit(1);
  }
  
  console.log('✅ Arquivo JSON válido encontrado!');
  console.log(`📧 Email: ${serviceAccountData.client_email}`);
  console.log(`🆔 Project ID: ${serviceAccountData.project_id}`);
  
  // Lê o arquivo .env.local atual
  const envLocalPath = path.join(__dirname, '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }
  
  // Atualiza as credenciais do Google
  const newEmail = serviceAccountData.client_email;
  const newPrivateKey = serviceAccountData.private_key;
  
  // Remove quebras de linha extras da chave privada
  const cleanPrivateKey = newPrivateKey.replace(/\n/g, '\\n');
  
  // Atualiza ou adiciona as variáveis
  if (envContent.includes('GOOGLE_SERVICE_ACCOUNT_EMAIL=')) {
    envContent = envContent.replace(
      /GOOGLE_SERVICE_ACCOUNT_EMAIL=.*/,
      `GOOGLE_SERVICE_ACCOUNT_EMAIL=${newEmail}`
    );
  } else {
    envContent += `\nGOOGLE_SERVICE_ACCOUNT_EMAIL=${newEmail}`;
  }
  
  if (envContent.includes('GOOGLE_PRIVATE_KEY=')) {
    // Remove a chave antiga (pode estar em múltiplas linhas)
    envContent = envContent.replace(
      /GOOGLE_PRIVATE_KEY=[\s\S]*?-----END PRIVATE KEY-----/,
      `GOOGLE_PRIVATE_KEY=${cleanPrivateKey}`
    );
  } else {
    envContent += `\nGOOGLE_PRIVATE_KEY=${cleanPrivateKey}`;
  }
  
  // Salva o arquivo atualizado
  fs.writeFileSync(envLocalPath, envContent);
  
  console.log('\n✅ Credenciais configuradas com sucesso!');
  console.log('📁 Arquivo .env.local atualizado');
  
  // Testa as credenciais
  console.log('\n🧪 Testando credenciais...');
  
  // Importa e testa a função de validação
  const { validateGoogleCredentials } = await import('./local-server/utils/google-auth.js');
  
  // Recarrega as variáveis de ambiente
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = newEmail;
  process.env.GOOGLE_PRIVATE_KEY = newPrivateKey;
  
  const validation = await validateGoogleCredentials();
  
  if (validation.isValid) {
    console.log('✅ Credenciais válidas! Sistema pronto para usar.');
  } else {
    console.log(`❌ Erro na validação: ${validation.error}`);
    console.log('💡 Verifique se o Service Account tem permissões para acessar o Google Sheets API');
  }
  
  // Remove o arquivo JSON por segurança
  console.log('\n🗑️ Removendo arquivo JSON por segurança...');
  fs.unlinkSync(jsonPath);
  console.log('✅ Arquivo JSON removido.');
  
  console.log('\n🎉 Configuração concluída!');
  console.log('💡 Agora você pode testar o sistema executando:');
  console.log('   cd local-server && node verificar-dados-teste.js');
  
} catch (error) {
  console.error('❌ Erro ao processar arquivo JSON:', error.message);
  process.exit(1);
}