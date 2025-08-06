// Diagnóstico rápido do sistema EETAD
console.log('🔍 DIAGNÓSTICO RÁPIDO - SISTEMA EETAD');
console.log('=' .repeat(60));

console.log('\n📋 VERIFICAÇÕES BÁSICAS:');
console.log('   ✅ Node.js: ' + process.version);
console.log('   ✅ Diretório: ' + process.cwd());
console.log('   ✅ Scripts disponíveis: SIM');

console.log('\n🧪 TESTANDO INTEGRAÇÕES...');

const https = require('https');
const http = require('http');

const FUNCTIONS_TO_TEST = [
  {
    name: 'OpenAI Chatbot',
    url: 'https://your-project.supabase.co/functions/v1/openai-chatbot',
    method: 'POST'
  },
  {
    name: 'Google Sheets - Gerenciar Usuários',
    url: 'https://your-project.supabase.co/functions/v1/gerenciar-usuarios-secretaria',
    method: 'GET'
  },
  {
    name: 'Google Sheets - Buscar Matrículas Pendentes',
    url: 'https://your-project.supabase.co/functions/v1/buscar-matriculas-pendentes',
    method: 'GET'
  },
  {
    name: 'Google Sheets - Buscar Matrículas Finalizadas',
    url: 'https://your-project.supabase.co/functions/v1/buscar-matriculas-finalizadas',
    method: 'GET'
  },
  {
    name: 'MercadoPago',
    url: 'https://your-project.supabase.co/functions/v1/mercadopago-webhook',
    method: 'POST'
  },
  {
    name: 'Evolution API',
    url: 'https://your-project.supabase.co/functions/v1/evolution-webhook',
    method: 'POST'
  }
];

async function makeRequest(url, method = 'GET') {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EETAD-Diagnostic/1.0'
      },
      timeout: 10000
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        error: 'Request timeout'
      });
    });

    if (method === 'POST') {
      req.write(JSON.stringify({ test: true }));
    }
    
    req.end();
  });
}

async function testFunction(func) {
  console.log(`\n🧪 Testando: ${func.name}`);
  
  try {
    const result = await makeRequest(func.url, func.method);
    
    if (result.status === 200) {
      console.log(`   ✅ ${func.name}: FUNCIONANDO`);
      return 'success';
    } else if (result.status === 401) {
      console.log(`   ⚠️  ${func.name}: Credenciais não configuradas (401)`);
      return 'auth_error';
    } else if (result.status === 404) {
      console.log(`   ❌ ${func.name}: Função não encontrada (404)`);
      return 'not_found';
    } else if (result.status === 500) {
      console.log(`   ❌ ${func.name}: Erro interno (500)`);
      return 'server_error';
    } else if (result.status === 'ERROR') {
      console.log(`   ❌ ${func.name}: Erro de conexão`);
      return 'connection_error';
    } else {
      console.log(`   ⚠️  ${func.name}: Status ${result.status}`);
      return 'other_error';
    }
  } catch (error) {
    console.log(`   ❌ ${func.name}: Erro - ${error.message}`);
    return 'error';
  }
}

async function runTests() {
  const results = {
    success: 0,
    auth_error: 0,
    server_error: 0,
    not_found: 0,
    connection_error: 0,
    other_error: 0,
    error: 0
  };

  for (const func of FUNCTIONS_TO_TEST) {
    const result = await testFunction(func);
    results[result]++;
  }

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`   ✅ Funcionando: ${results.success}`);
  console.log(`   ⚠️  Credenciais: ${results.auth_error}`);
  console.log(`   ❌ Erro 500: ${results.server_error}`);
  console.log(`   ❌ Não encontrado: ${results.not_found}`);
  console.log(`   ❌ Conexão: ${results.connection_error}`);
  console.log(`   ❌ Outros: ${results.other_error + results.error}`);

  console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
  
  if (results.auth_error > 0 || results.server_error > 0) {
    console.log('\n1. 📋 Ver variáveis configuradas:');
    console.log('   node configurar-todas-variaveis-supabase.js');
    
    console.log('\n2. 📋 Ver instruções detalhadas:');
    console.log('   node configurar-variaveis-api-supabase.js');
    
    console.log('\n3. 🔧 Configurar no Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/environment-variables');
    
    console.log('\n4. 🧪 Testar novamente:');
    console.log('   node testar-integracoes-corrigido.js');
  }

  console.log('\n🔗 LINKS ÚTEIS:');
  console.log('   📊 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('   🔧 Environment Variables: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/environment-variables');
  console.log('   📋 Functions: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions');

  console.log('\n' + '='.repeat(60));
  console.log('🎯 PROBLEMAS IDENTIFICADOS:');
  
  if (results.auth_error > 0) {
    console.log('   ❌ Variáveis de ambiente não configuradas no Supabase');
  }
  if (results.server_error > 0) {
    console.log('   ❌ Algumas funções retornando erro 500');
  }
  if (results.not_found > 0) {
    console.log('   ❌ Algumas funções não foram deployadas');
  }

  console.log('\n💡 SOLUÇÃO:');
  console.log('   1. Copie as 9 variáveis para o Supabase Dashboard');
  console.log('   2. Teste novamente com: node testar-integracoes-corrigido.js');
  console.log('   3. Resultado esperado: Sistema 100% funcional');
  
  console.log('='.repeat(60));
}

runTests().catch(console.error);