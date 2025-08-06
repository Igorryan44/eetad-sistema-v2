// Diagnóstico Avançado - Google Sheets Integration
console.log('🔍 DIAGNÓSTICO AVANÇADO - GOOGLE SHEETS');
console.log('=====================================');

// Função para testar com logs detalhados
async function testarComLogs() {
    try {
        console.log('\n📋 Testando get-pending-enrollments com logs detalhados...');
        
        const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-pending-enrollments', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs',
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}`);
        
        // Verificar headers de resposta
        console.log('\n📄 Headers de Resposta:');
        for (let [key, value] of response.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }
        
        if (response.ok) {
            const data = await response.json();
            console.log(`\n✅ Resposta JSON: ${JSON.stringify(data, null, 2)}`);
            console.log(`📊 Total de registros: ${data.length}`);
            
            if (Array.isArray(data) && data.length === 0) {
                console.log('\n🔍 INVESTIGAÇÃO DETALHADA:');
                console.log('   A função está retornando array vazio. Possíveis causas:');
                console.log('   1. ❌ Credenciais não configuradas ou inválidas');
                console.log('   2. ❌ Planilha sem dados ou sem status "Pendente"');
                console.log('   3. ❌ Problema de permissão na planilha');
                console.log('   4. ❌ Estrutura da planilha diferente do esperado');
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ Erro: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ Erro de conexão: ${error.message}`);
    }
}

// Função para verificar logs do Supabase
async function verificarLogsSupabase() {
    console.log('\n📊 VERIFICAÇÃO DE LOGS SUPABASE');
    console.log('================================');
    console.log('Para ver logs detalhados:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá em Edge Functions > get-pending-enrollments');
    console.log('3. Clique na aba "Logs"');
    console.log('4. Execute a função e veja os logs em tempo real');
}

// Função para testar estrutura da planilha
async function testarEstruturaPlanilha() {
    console.log('\n📋 VERIFICAÇÃO DA ESTRUTURA DA PLANILHA');
    console.log('=======================================');
    console.log('ID da Planilha: 1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA');
    console.log('Aba: dados pessoais');
    console.log('');
    console.log('Estrutura esperada (colunas):');
    console.log('0: Data Cadastro');
    console.log('1: Nome');
    console.log('2: RG');
    console.log('3: CPF');
    console.log('4: Telefone');
    console.log('5: Email');
    console.log('...');
    console.log('22: Status (deve conter "Pendente")');
    console.log('');
    console.log('⚠️ IMPORTANTE: A coluna 23 (índice 22) deve ter o valor "Pendente"');
}

// Função para verificar permissões
async function verificarPermissoes() {
    console.log('\n🔐 VERIFICAÇÃO DE PERMISSÕES');
    console.log('============================');
    console.log('Verifique se:');
    console.log('1. ✅ A service account foi compartilhada na planilha');
    console.log('2. ✅ Permissão definida como "Editor" ou "Viewer"');
    console.log('3. ✅ Email da service account: [seu-email]@[projeto].iam.gserviceaccount.com');
    console.log('4. ✅ Planilha está acessível publicamente ou compartilhada');
}

// Função para testar outras funções relacionadas
async function testarOutrasFuncoes() {
    console.log('\n🔄 TESTANDO OUTRAS FUNÇÕES RELACIONADAS');
    console.log('=======================================');
    
    // Testar check-student-cpf
    try {
        console.log('\n📞 Testando check-student-cpf...');
        const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/check-student-cpf', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf: '123.456.789-00' })
        });
        
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Resposta: ${JSON.stringify(data)}`);
        } else {
            console.log(`   ❌ Erro: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

// Executar todos os testes
async function executarDiagnosticoCompleto() {
    await testarComLogs();
    await verificarLogsSupabase();
    await testarEstruturaPlanilha();
    await verificarPermissoes();
    await testarOutrasFuncoes();
    
    console.log('\n🎯 PRÓXIMAS AÇÕES RECOMENDADAS:');
    console.log('===============================');
    console.log('1. 🔍 Verificar logs no Supabase Dashboard');
    console.log('2. 📋 Confirmar estrutura da planilha');
    console.log('3. 🔐 Validar permissões da service account');
    console.log('4. 📊 Verificar se existem dados com status "Pendente"');
    console.log('5. 🔄 Reiniciar as Edge Functions se necessário');
}

executarDiagnosticoCompleto();