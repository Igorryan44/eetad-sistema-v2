// Diagnóstico de Correlação: Login vs Matrículas Pendentes
// Este script verifica se há dependências compartilhadas que causam conflitos

console.log('🔍 DIAGNÓSTICO DE CORRELAÇÃO: Login vs Matrículas Pendentes');
console.log('=' .repeat(70));

const SUPABASE_URL = "https://umkizxftwrwqiiahjbrr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs";

// Função para testar uma função do Supabase
async function testSupabaseFunction(functionName, payload = {}) {
    try {
        console.log(`\n🧪 Testando função: ${functionName}`);
        console.log(`📡 Payload: ${JSON.stringify(payload)}`);
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const statusText = response.statusText;
        
        console.log(`📊 Status: ${status} ${statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Sucesso! Dados recebidos:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
            return { success: true, data, status };
        } else {
            const errorText = await response.text();
            console.log(`❌ Erro! Resposta:`, errorText.substring(0, 300) + '...');
            return { success: false, error: errorText, status };
        }
    } catch (error) {
        console.log(`💥 Exceção:`, error.message);
        return { success: false, error: error.message, status: 'EXCEPTION' };
    }
}

// Função para verificar localStorage
function checkLocalStorage() {
    console.log('\n🗄️ VERIFICANDO LOCALSTORAGE');
    console.log('-'.repeat(40));
    
    // Verificar sessão de autenticação
    const session = localStorage.getItem('eetad_secretary_session');
    console.log('🔐 Sessão ativa:', session ? 'SIM' : 'NÃO');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            console.log('👤 Usuário logado:', sessionData.user?.username || 'Desconhecido');
            console.log('⏰ Expira em:', new Date(sessionData.expiresAt).toLocaleString());
        } catch (e) {
            console.log('❌ Erro ao parsear sessão:', e.message);
        }
    }
    
    // Verificar usuários cadastrados
    const users = localStorage.getItem('secretary-users');
    console.log('👥 Usuários cadastrados:', users ? 'SIM' : 'NÃO');
    if (users) {
        try {
            const userList = JSON.parse(users);
            console.log('📊 Quantidade de usuários:', userList.length);
            userList.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.username} (${user.email})`);
            });
        } catch (e) {
            console.log('❌ Erro ao parsear usuários:', e.message);
        }
    }
}

// Função principal de diagnóstico
async function diagnosticarCorrelacao() {
    console.log('🚀 Iniciando diagnóstico...\n');
    
    // 1. Verificar estado do localStorage
    checkLocalStorage();
    
    // 2. Testar função de login
    console.log('\n🔐 TESTANDO SISTEMA DE LOGIN');
    console.log('-'.repeat(40));
    
    const loginTest = await testSupabaseFunction('manage-secretary-users', {
        action: 'login',
        username: 'Admin',
        password: 'admin1'
    });
    
    // 3. Testar função de matrículas pendentes
    console.log('\n📋 TESTANDO MATRÍCULAS PENDENTES');
    console.log('-'.repeat(40));
    
    const pendingTest = await testSupabaseFunction('get-pending-enrollments', {});
    
    // 4. Testar função de matrículas pendentes com debug
    console.log('\n🐛 TESTANDO MATRÍCULAS PENDENTES (DEBUG)');
    console.log('-'.repeat(40));
    
    const pendingDebugTest = await testSupabaseFunction('get-pending-enrollments', { debug: true });
    
    // 5. Análise de correlação
    console.log('\n🔍 ANÁLISE DE CORRELAÇÃO');
    console.log('='.repeat(50));
    
    console.log('\n📊 RESULTADOS:');
    console.log(`🔐 Login: ${loginTest.success ? '✅ FUNCIONANDO' : '❌ FALHANDO'} (Status: ${loginTest.status})`);
    console.log(`📋 Matrículas: ${pendingTest.success ? '✅ FUNCIONANDO' : '❌ FALHANDO'} (Status: ${pendingTest.status})`);
    console.log(`🐛 Debug Matrículas: ${pendingDebugTest.success ? '✅ FUNCIONANDO' : '❌ FALHANDO'} (Status: ${pendingDebugTest.status})`);
    
    // Análise de possíveis causas
    console.log('\n🧠 POSSÍVEIS CAUSAS DA CORRELAÇÃO:');
    
    if (!loginTest.success && !pendingTest.success) {
        console.log('❌ AMBOS FALHANDO - Possíveis causas:');
        console.log('   1. Problema de conectividade com Supabase');
        console.log('   2. Credenciais do Supabase inválidas');
        console.log('   3. Funções não deployadas corretamente');
        console.log('   4. Problema de CORS');
    } else if (loginTest.success && !pendingTest.success) {
        console.log('⚠️ LOGIN OK, MATRÍCULAS FALHANDO - Possíveis causas:');
        console.log('   1. Credenciais do Google Sheets não configuradas');
        console.log('   2. Problema específico na função get-pending-enrollments');
        console.log('   3. Planilha Google Sheets inacessível');
    } else if (!loginTest.success && pendingTest.success) {
        console.log('⚠️ MATRÍCULAS OK, LOGIN FALHANDO - Possíveis causas:');
        console.log('   1. Problema específico na função manage-secretary-users');
        console.log('   2. Aba "usuarios" na planilha não configurada');
        console.log('   3. Conflito de autenticação');
    } else {
        console.log('✅ AMBOS FUNCIONANDO - Sistema operacional!');
    }
    
    // Verificar dependências compartilhadas
    console.log('\n🔗 DEPENDÊNCIAS COMPARTILHADAS:');
    console.log('   1. Mesma URL do Supabase');
    console.log('   2. Mesma chave de API (ANON_KEY)');
    console.log('   3. Mesmas credenciais do Google Sheets');
    console.log('   4. Mesma planilha Google Sheets');
    console.log('   5. Mesmo sistema de CORS');
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (loginTest.status === pendingTest.status && !loginTest.success) {
        console.log('   1. Verificar se o Supabase está online');
        console.log('   2. Verificar se as funções estão deployadas');
        console.log('   3. Verificar credenciais do Supabase');
    }
    
    if (pendingDebugTest.success && pendingDebugTest.data?.debug) {
        console.log('\n🐛 INFORMAÇÕES DE DEBUG DAS MATRÍCULAS:');
        const debug = pendingDebugTest.data.debug;
        console.log(`   - Credenciais configuradas: ${debug.credentialsConfigured || 'N/A'}`);
        console.log(`   - Total dados pessoais: ${debug.totalDadosPessoaisRows || 'N/A'}`);
        console.log(`   - Total matrículas: ${debug.totalMatriculasRows || 'N/A'}`);
    }
    
    console.log('\n🏁 Diagnóstico concluído!');
}

// Executar diagnóstico
diagnosticarCorrelacao().catch(error => {
    console.error('💥 Erro durante o diagnóstico:', error);
});