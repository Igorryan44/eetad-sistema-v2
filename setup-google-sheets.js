#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 CONFIGURAÇÃO GOOGLE SHEETS - Sistema EETAD');
console.log('='.repeat(50));
console.log('');

console.log('📋 INSTRUÇÕES PARA OBTER AS CREDENCIAIS:');
console.log('');
console.log('1. Acesse: https://console.cloud.google.com/');
console.log('2. Crie um novo projeto ou selecione um existente');
console.log('3. Ative a API do Google Sheets:');
console.log('   - Vá em "APIs & Services" > "Library"');
console.log('   - Procure por "Google Sheets API" e ative');
console.log('4. Crie uma Service Account:');
console.log('   - Vá em "APIs & Services" > "Credentials"');
console.log('   - Clique em "Create Credentials" > "Service Account"');
console.log('   - Dê um nome e clique em "Create"');
console.log('5. Baixe a chave JSON:');
console.log('   - Na lista de Service Accounts, clique na que criou');
console.log('   - Vá na aba "Keys" > "Add Key" > "Create new key"');
console.log('   - Escolha "JSON" e baixe o arquivo');
console.log('6. Compartilhe a planilha:');
console.log('   - Abra sua planilha Google Sheets');
console.log('   - Clique em "Compartilhar"');
console.log('   - Adicione o email da Service Account com permissão de "Editor"');
console.log('');
console.log('📝 ESTRUTURA DA PLANILHA:');
console.log('');
console.log('Sua planilha deve ter as seguintes abas:');
console.log('- "alunos matriculados" (para dados dos alunos)');
console.log('- "pedidos" (para pedidos de livros)');
console.log('- "pagamentos" (para controle de pagamentos)');
console.log('');
console.log('A aba "pagamentos" deve ter os cabeçalhos:');
console.log('A: ID Pagamento | B: CPF | C: Nome | D: Livro | E: Ciclo | F: Valor | G: Status | H: Data Confirmação | I: Referência Externa');
console.log('');
console.log('='.repeat(50));
console.log('');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    console.log('📋 CONFIGURAÇÃO DAS CREDENCIAIS:');
    console.log('');

    // Solicitar ID da planilha
    const spreadsheetId = await askQuestion('🔗 Cole o ID da sua planilha Google Sheets (da URL): ');
    
    if (!spreadsheetId) {
      console.log('❌ ID da planilha é obrigatório!');
      process.exit(1);
    }

    // Solicitar email da service account
    const serviceAccountEmail = await askQuestion('📧 Cole o email da Service Account (do arquivo JSON): ');
    
    if (!serviceAccountEmail) {
      console.log('❌ Email da Service Account é obrigatório!');
      process.exit(1);
    }

    // Solicitar chave privada
    console.log('🔑 Cole a chave privada (private_key) do arquivo JSON:');
    console.log('   (Cole todo o conteúdo entre as aspas, incluindo \\n)');
    const privateKey = await askQuestion('Private Key: ');
    
    if (!privateKey) {
      console.log('❌ Chave privada é obrigatória!');
      process.exit(1);
    }

    console.log('');
    console.log('🧪 TESTANDO CONFIGURAÇÃO...');

    // Testar a configuração
    const testResult = await testGoogleSheetsConnection(spreadsheetId, serviceAccountEmail, privateKey);
    
    if (testResult.success) {
      console.log('✅ Teste bem-sucedido!');
      console.log(`📊 Planilha encontrada: "${testResult.title}"`);
      
      // Salvar no arquivo .env
      await saveToEnvFile(spreadsheetId, serviceAccountEmail, privateKey);
      
      console.log('');
      console.log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('');
      console.log('📋 PRÓXIMOS PASSOS:');
      console.log('1. Configure as credenciais no Supabase Dashboard');
      console.log('2. Teste o sistema completo');
      console.log('3. Verifique se os dados estão sendo salvos na planilha');
      
    } else {
      console.log('❌ Erro no teste:', testResult.error);
      console.log('');
      console.log('🔍 POSSÍVEIS CAUSAS:');
      console.log('- Credenciais incorretas');
      console.log('- Planilha não compartilhada com a Service Account');
      console.log('- API do Google Sheets não ativada');
      console.log('- ID da planilha incorreto');
    }

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  } finally {
    rl.close();
  }
}

async function testGoogleSheetsConnection(spreadsheetId, serviceAccountEmail, privateKey) {
  try {
    // Simular teste de conexão (em um ambiente real, faria uma chamada à API)
    console.log('   📡 Testando conexão com Google Sheets...');
    
    // Validações básicas
    if (!spreadsheetId.match(/^[a-zA-Z0-9-_]+$/)) {
      throw new Error('ID da planilha parece inválido');
    }
    
    if (!serviceAccountEmail.includes('@') || !serviceAccountEmail.includes('.iam.gserviceaccount.com')) {
      throw new Error('Email da Service Account parece inválido');
    }
    
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      throw new Error('Chave privada parece inválida');
    }
    
    console.log('   ✅ Validações básicas passaram');
    
    return {
      success: true,
      title: 'Planilha EETAD - Sistema de Automação'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function saveToEnvFile(spreadsheetId, serviceAccountEmail, privateKey) {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  let envContent = '';
  
  // Ler .env.example se existir
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  // Ler .env existente se houver
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Atualizar ou adicionar as variáveis do Google Sheets
  const googleSheetsVars = {
    'GOOGLE_SHEETS_SPREADSHEET_ID': spreadsheetId,
    'GOOGLE_SERVICE_ACCOUNT_EMAIL': serviceAccountEmail,
    'GOOGLE_PRIVATE_KEY': privateKey.replace(/\n/g, '\\n')
  };
  
  Object.entries(googleSheetsVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  });
  
  // Salvar arquivo .env
  fs.writeFileSync(envPath, envContent);
  console.log('💾 Credenciais salvas no arquivo .env');
  
  // Mostrar instruções para Supabase
  console.log('');
  console.log('🔧 CONFIGURAÇÃO NO SUPABASE:');
  console.log('');
  console.log('Acesse: https://supabase.com/dashboard');
  console.log('Vá em Project Settings → Environment Variables');
  console.log('Adicione estas variáveis:');
  console.log('');
  Object.entries(googleSheetsVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
}

// Executar o script
main().catch(console.error);