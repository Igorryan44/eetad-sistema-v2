// Teste específico para verificar configuração do Google Sheets
console.log('🔍 TESTANDO CONFIGURAÇÃO GOOGLE SHEETS');
console.log('=====================================');

// Teste da função get-pending-enrollments
async function testarMatriculasPendentes() {
    try {
        console.log('\n📋 Testando função get-pending-enrollments...');
        
        const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-pending-enrollments', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
            }
        });

        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Resposta recebida: ${JSON.stringify(data)}`);
            console.log(`   📊 Total de matrículas pendentes: ${data.length}`);
            
            if (data.length === 0) {
                console.log('\n⚠️  POSSÍVEIS CAUSAS:');
                console.log('   1. Variáveis GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY não configuradas no Supabase');
                console.log('   2. Não há alunos com status "Pendente" na planilha');
                console.log('   3. Problema de permissão na planilha Google Sheets');
                console.log('   4. ID da planilha incorreto');
            }
        } else {
            console.log(`   ❌ Erro: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

// Teste da função get-enrollments para comparação
async function testarMatriculas() {
    try {
        console.log('\n📚 Testando função get-enrollments...');
        
        const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-enrollments', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
            }
        });

        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Resposta recebida: ${JSON.stringify(data)}`);
            console.log(`   📊 Total de matrículas: ${data.length}`);
        } else {
            console.log(`   ❌ Erro: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
}

// Executar testes
async function executarTestes() {
    await testarMatriculasPendentes();
    await testarMatriculas();
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('================');
    console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Vá em Settings > Environment Variables');
    console.log('3. Configure as variáveis:');
    console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.log('   - GOOGLE_PRIVATE_KEY');
    console.log('4. Verifique se a planilha tem alunos com status "Pendente" na coluna 23');
    console.log('5. Confirme que a service account tem acesso à planilha');
}

executarTestes();