// Teste de integrações corrigido - sem problemas de codificação
console.log('🧪 TESTE DE INTEGRAÇÕES - VERSÃO CORRIGIDA');
console.log('=' .repeat(60));

const https = require('https');
const http = require('http');

const FUNCTIONS_TO_TEST = [
  {
    name: 'OpenAI Chatbot',
    url: 'https://your-project.supabase.co/functions/v1/openai-chatbot',
    method: 'POST',
    testData: { message: 'Teste de conexão' }
  },
  {
    name: 'Google Sheets - Gerenciar Usuários Secretária',
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
    method: 'POST',
    testData: { type: 'test' }
  },
  {
    name: 'Evolution API',
    url: 'https://your-project.supabase.co/functions/v1/evolution-webhook',
    method: 'POST',
    testData: { test: true }
  }
];

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EETAD-Test/1.0',
        'Accept': 'application/json'
      },
      timeout: 15000
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers,
            raw: responseData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            raw: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        error: error.message,
        code: error.code
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        error: 'Request timeout after 15 seconds'
      });
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testFunction(func) {
  console.log(`\n🧪 Testando: ${func.name}`);
  console.log(`   URL: ${func.url}`);
  console.log(`   Método: ${func.method}`);
  
  try {
    const result = await makeRequest(func.url, func.method, func.testData);
    
    if (result.status === 200) {
      console.log(`   ✅ ${func.name}: SUCESSO`);
      if (result.data && typeof result.data === 'object') {
        console.log(`   📋 Resposta: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
      return { status: 'success', details: result };
    } else if (result.status === 401) {
      console.log(`   ❌ ${func.name}: NÃO AUTORIZADO (401)`);
      console.log(`   💡 Solução: Configurar credenciais no Supabase Dashboard`);
      return { status: 'auth_error', details: result };
    } else if (result.status === 404) {
      console.log(`   ❌ ${func.name}: FUNÇÃO NÃO ENCONTRADA (404)`);
      console.log(`   💡 Solução: Verificar se a função foi deployada`);
      return { status: 'not_found', details: result };
    } else if (result.status === 500) {
      console.log(`   ❌ ${func.name}: ERRO INTERNO DO SERVIDOR (500)`);
      console.log(`   💡 Solução: Verificar logs da função no Supabase`);
      return { status: 'server_error', details: result };
    } else if (result.status === 'ERROR') {
      console.log(`   ❌ ${func.name}: ERRO DE CONEXÃO`);
      console.log(`   💡 Erro: ${result.error}`);
      return { status: 'connection_error', details: result };
    } else if (result.status === 'TIMEOUT') {
      console.log(`   ⏱️  ${func.name}: TIMEOUT`);
      console.log(`   💡 Solução: Verificar se o serviço está respondendo`);
      return { status: 'timeout', details: result };
    } else {
      console.log(`   ⚠️  ${func.name}: STATUS ${result.status}`);
      if (result.data) {
        console.log(`   📋 Resposta: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
      return { status: 'other', details: result };
    }
  } catch (error) {
    console.log(`   ❌ ${func.name}: ERRO INESPERADO`);
    console.log(`   💡 Erro: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function runTests() {
  console.log('\n🚀 INICIANDO TESTES...');
  
  const results = [];
  const summary = {
    success: 0,
    auth_error: 0,
    server_error: 0,
    not_found: 0,
    connection_error: 0,
    timeout: 0,
    other: 0,
    error: 0
  };

  for (const func of FUNCTIONS_TO_TEST) {
    const result = await testFunction(func);
    results.push({ function: func.name, result });
    summary[result.status]++;
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 RESUMO DOS RESULTADOS:');
  console.log('=' .repeat(60));
  console.log(`   ✅ Sucessos: ${summary.success}/${FUNCTIONS_TO_TEST.length}`);
  console.log(`   ❌ Erros de autorização: ${summary.auth_error}`);
  console.log(`   ❌ Erros de servidor (500): ${summary.server_error}`);
  console.log(`   ❌ Funções não encontradas: ${summary.not_found}`);
  console.log(`   ❌ Erros de conexão: ${summary.connection_error}`);
  console.log(`   ⏱️  Timeouts: ${summary.timeout}`);
  console.log(`   ⚠️  Outros: ${summary.other + summary.error}`);

  console.log('\n🔧 RECOMENDAÇÕES:');
  
  if (summary.auth_error > 0 || summary.server_error > 0) {
    console.log('\n📋 CONFIGURAR VARIÁVEIS NO SUPABASE:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Vá para: Project Settings > Environment Variables');
    console.log('   3. Configure estas variáveis:');
    console.log('      - MERCADOPAGO_ACCESS_TOKEN');
    console.log('      - OPENAI_API_KEY');
    console.log('      - GOOGLE_SHEETS_CLIENT_EMAIL');
    console.log('      - GOOGLE_SHEETS_PRIVATE_KEY');
    console.log('      - GOOGLE_SHEETS_SPREADSHEET_ID');
    console.log('      - EVOLUTION_API_URL');
    console.log('      - EVOLUTION_API_KEY');
    console.log('      - SMTP_HOST');
    console.log('      - SMTP_PASSWORD');
  }

  if (summary.not_found > 0) {
    console.log('\n🚀 VERIFICAR DEPLOYMENT DAS FUNÇÕES:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Vá para: Edge Functions');
    console.log('   3. Verifique se todas as funções estão deployadas');
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  if (summary.success === FUNCTIONS_TO_TEST.length) {
    console.log('   🎉 PARABÉNS! Todas as integrações estão funcionando!');
    console.log('   ✅ Sistema 100% operacional');
  } else {
    console.log('   1. Configure as variáveis de ambiente no Supabase Dashboard');
    console.log('   2. Execute novamente: node testar-integracoes-corrigido.js');
    console.log('   3. Para diagnóstico rápido: node diagnostico-rapido.js');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 TESTE CONCLUÍDO');
  console.log('='.repeat(60));
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ ERRO DURANTE OS TESTES:', error.message);
  console.log('\n💡 SOLUÇÃO: Verifique sua conexão com a internet e tente novamente');
});