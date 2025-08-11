#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const BASE_URL = `http://localhost:${process.env.LOCAL_SERVER_PORT || 3003}`;

console.log('🧪 Testando funções migradas...\n');
console.log(`🌐 URL Base: ${BASE_URL}\n`);

// Lista de funções para testar
const functions = [
  'finalize-enrollment',
  'get-pending-enrollments', 
  'get-enrollments',
  'save-student-personal-data',
  'save-student-registration',
  'create-mercadopago-payment',
  'check-payment-status',
  'mercadopago-webhook',
  'manage-secretary-users',
  'ai-chatbot',
  'cancel-order',
  'send-email-notification'
];

async function testFunction(functionName) {
  try {
    console.log(`🔍 Testando: ${functionName}`);
    
    // Teste de health check
    const healthResponse = await fetch(`${BASE_URL}/functions/${functionName}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`  ✅ Health check: ${healthData.status}`);
      
      if (healthData.hasOpenAIKey !== undefined) {
        console.log(`  🔑 OpenAI Key: ${healthData.hasOpenAIKey ? 'Configurada' : 'Não configurada'}`);
      }
      
      if (healthData.hasGoogleCredentials !== undefined) {
        console.log(`  🔑 Google Credentials: ${healthData.hasGoogleCredentials ? 'Configuradas' : 'Não configuradas'}`);
      }
      
    } else {
      console.log(`  ❌ Health check falhou: ${healthResponse.status}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
  }
  
  console.log('');
}

async function testServer() {
  try {
    console.log('🏥 Testando servidor principal...');
    
    const response = await fetch(`${BASE_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ Servidor online');
      console.log(`  📊 Status: ${data.status}`);
      console.log(`  ⏰ Timestamp: ${data.timestamp}`);
      console.log(`  🔧 Ambiente: ${data.environment}`);
    } else {
      console.log(`  ❌ Servidor com problemas: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Servidor offline: ${error.message}`);
    console.log('\n💡 Certifique-se de que o servidor está rodando:');
    console.log('   cd local-server && npm start\n');
    return false;
  }
  
  console.log('');
  return true;
}

async function runTests() {
  // Testar servidor principal primeiro
  const serverOnline = await testServer();
  
  if (!serverOnline) {
    process.exit(1);
  }
  
  // Testar cada função
  for (const functionName of functions) {
    await testFunction(functionName);
  }
  
  console.log('🎉 Testes concluídos!\n');
  
  // Verificar credenciais
  console.log('🔐 Verificação de credenciais:');
  
  const requiredEnvVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY', 
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'MERCADOPAGO_ACCESS_TOKEN',
    'OPENAI_API_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value && value !== 'seu_valor_aqui') {
      console.log(`  ✅ ${envVar}: Configurada`);
    } else {
      console.log(`  ❌ ${envVar}: Não configurada`);
    }
  });
  
  console.log('\n📝 Para configurar as credenciais:');
  console.log('   1. Edite o arquivo .env.local');
  console.log('   2. Adicione suas credenciais reais');
  console.log('   3. Reinicie o servidor\n');
}

// Executar testes
runTests().catch(console.error);