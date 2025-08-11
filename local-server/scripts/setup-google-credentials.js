#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateGoogleCredentials } from '../utils/google-auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Configurador de Credenciais do Google\n');

// Função para ler entrada do usuário
function prompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

async function setupCredentials() {
  try {
    console.log('📋 Este script irá ajudá-lo a configurar as credenciais do Google Sheets\n');
    
    // Verificar se já existem credenciais
    const envPath = path.join(__dirname, '..', '..', '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Arquivo .env.local encontrado\n');
    } else {
      console.log('📝 Criando novo arquivo .env.local\n');
    }
    
    // Solicitar credenciais
    console.log('🔑 Insira suas credenciais do Google:');
    console.log('   (Pressione Enter para manter o valor atual, se existir)\n');
    
    const serviceAccountEmail = await prompt('📧 Email da conta de serviço: ');
    const spreadsheetId = await prompt('📊 ID da planilha: ');
    
    console.log('\n🔐 Chave privada (cole todo o conteúdo, incluindo -----BEGIN/END PRIVATE KEY-----):');
    const privateKey = await prompt('');
    
    // Atualizar ou criar arquivo .env.local
    const newEnvVars = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: serviceAccountEmail,
      GOOGLE_SHEETS_SPREADSHEET_ID: spreadsheetId,
      GOOGLE_PRIVATE_KEY: privateKey.replace(/\\n/g, '\n')
    };
    
    // Processar arquivo .env.local
    let updatedEnvContent = envContent;
    
    Object.entries(newEnvVars).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}="${value}"`;
        
        if (regex.test(updatedEnvContent)) {
          updatedEnvContent = updatedEnvContent.replace(regex, newLine);
        } else {
          updatedEnvContent += `\n${newLine}`;
        }
      }
    });
    
    // Salvar arquivo
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log('\n✅ Credenciais salvas em .env.local\n');
    
    // Testar credenciais
    console.log('🧪 Testando credenciais...');
    
    // Recarregar variáveis de ambiente
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = newEnvVars.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = newEnvVars.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    process.env.GOOGLE_PRIVATE_KEY = newEnvVars.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
    
    const isValid = await validateGoogleCredentials();
    
    if (isValid) {
      console.log('✅ Credenciais válidas! Google Sheets acessível\n');
      
      console.log('🎉 Configuração concluída com sucesso!');
      console.log('\n📝 Próximos passos:');
      console.log('1. Inicie o servidor: npm start');
      console.log('2. Teste as funções: npm test');
      console.log('3. Configure o frontend para usar as URLs locais\n');
      
    } else {
      console.log('❌ Credenciais inválidas ou planilha inacessível');
      console.log('\n🔧 Verifique:');
      console.log('1. Email da conta de serviço está correto');
      console.log('2. Chave privada está completa e válida');
      console.log('3. ID da planilha está correto');
      console.log('4. Conta de serviço tem acesso à planilha\n');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  } finally {
    process.stdin.destroy();
  }
}

// Executar configuração
setupCredentials();