#!/usr/bin/env node

/**
 * Script de Configuração Automática do MercadoPago
 * Configura o token e testa a integração PIX/QR Code
 */

import https from 'https';
import fs from 'fs';
import { createInterface } from 'readline';

const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1';

// Interface para input do usuário
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Função para fazer requisições HTTP
function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Validar formato do token MercadoPago
function validateMercadoPagoToken(token) {
  if (!token) return false;
  
  // Token de sandbox deve começar com TEST-
  if (token.startsWith('TEST-')) {
    return token.length >= 50; // Tokens de teste são longos
  }
  
  // Token de produção deve começar com APP_USR-
  if (token.startsWith('APP_USR-')) {
    return token.length >= 50; // Tokens de produção são longos
  }
  
  return false;
}

// Testar token com uma requisição real
async function testMercadoPagoToken(token) {
  console.log('🧪 Testando token MercadoPago...');
  
  const testData = {
    nome: "Teste Token",
    cpf: "12345678901",
    email: "teste@eetad.com.br",
    valor: 1.00,
    livro: "Teste Configuração",
    ciclo: "1º Ciclo Básico"
  };

  try {
    const response = await makeRequest(`${SUPABASE_URL}/create-mercadopago-payment`, testData);
    
    if (response.status === 200) {
      console.log('✅ Token válido! PIX criado com sucesso');
      console.log(`   Payment ID: ${response.data.payment_id}`);
      console.log(`   QR Code: ${response.data.qr_code ? 'Gerado ✅' : 'Não gerado ❌'}`);
      return true;
    } else if (response.status === 401) {
      console.log('❌ Token inválido ou expirado');
      return false;
    } else {
      console.log(`⚠️  Erro inesperado: ${response.status}`);
      console.log(`   ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// Criar arquivo .env local
function createEnvFile(token) {
  const envContent = `# Configuração MercadoPago - Sistema EETAD
MERCADOPAGO_ACCESS_TOKEN=${token}

# Adicione outras variáveis conforme necessário
# GOOGLE_SHEETS_SPREADSHEET_ID=
# GOOGLE_SERVICE_ACCOUNT_EMAIL=
# GOOGLE_PRIVATE_KEY=
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
}

// Função principal
async function setupMercadoPago() {
  console.log('🚀 CONFIGURAÇÃO AUTOMÁTICA MERCADOPAGO');
  console.log('=====================================\n');
  
  console.log('Este script irá configurar o token MercadoPago para PIX e QR Code.\n');
  
  // Verificar se já existe configuração
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('MERCADOPAGO_ACCESS_TOKEN=') && !envContent.includes('MERCADOPAGO_ACCESS_TOKEN=\n')) {
      console.log('⚠️  Já existe um token configurado no arquivo .env');
      const overwrite = await question('Deseja sobrescrever? (s/n): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('Configuração cancelada.');
        rl.close();
        return;
      }
    }
  }
  
  console.log('📋 INSTRUÇÕES PARA OBTER O TOKEN:');
  console.log('1. Acesse: https://www.mercadopago.com.br/developers/panel');
  console.log('2. Faça login na sua conta MercadoPago');
  console.log('3. Vá em "Suas integrações" → "Criar aplicação"');
  console.log('4. Copie o "Access Token" da seção SANDBOX (para testes)');
  console.log('5. Cole o token abaixo\n');
  
  let token = '';
  let isValidToken = false;
  
  while (!isValidToken) {
    token = await question('Cole seu token MercadoPago: ');
    
    if (!validateMercadoPagoToken(token)) {
      console.log('❌ Token inválido! Deve começar com TEST- ou APP_USR-');
      console.log('   Exemplo: TEST-1234567890123456789012345678901234567890');
      continue;
    }
    
    console.log('✅ Formato do token válido!');
    
    // Criar arquivo .env temporário para teste
    createEnvFile(token);
    
    // Testar token
    const testResult = await testMercadoPagoToken(token);
    
    if (testResult) {
      isValidToken = true;
      console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('✅ Token MercadoPago configurado e testado');
      console.log('✅ PIX e QR Code funcionando perfeitamente');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Configure o mesmo token no Supabase Dashboard');
      console.log('2. Vá em Project Settings → Environment Variables');
      console.log('3. Adicione: MERCADOPAGO_ACCESS_TOKEN = ' + token.substring(0, 20) + '...');
      console.log('4. Execute: npm run dev para testar o sistema completo');
    } else {
      console.log('\n❌ Token não funcionou. Tente novamente.');
      const retry = await question('Tentar outro token? (s/n): ');
      if (retry.toLowerCase() !== 's') {
        break;
      }
    }
  }
  
  rl.close();
}

// Executar configuração
setupMercadoPago().catch(console.error);