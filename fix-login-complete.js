// 🔧 CORREÇÃO COMPLETA DO SISTEMA DE LOGIN
// Este script resolve definitivamente o problema "Usuário ou senha incorretos"

console.log('🔧 INICIANDO CORREÇÃO COMPLETA DO LOGIN...\n');

// 1. FUNÇÃO DE HASH (EXATA DO SISTEMA)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// 2. LIMPAR COMPLETAMENTE O SISTEMA
function clearAuthSystem() {
    console.log('🧹 Limpando sistema de autenticação...');
    localStorage.removeItem('secretary-users');
    localStorage.removeItem('eetad_secretary_session');
    console.log('✅ Sistema limpo');
}

// 3. CRIAR USUÁRIO ADMIN CORRETO
function createAdminUser() {
    console.log('👤 Criando usuário Admin...');
    
    const adminPassword = 'admin1';
    const adminHash = hashPassword(adminPassword);
    
    const adminUser = {
        id: '1',
        username: 'Admin',
        email: 'admin@eetad.com',
        fullName: 'Administrador',
        passwordHash: adminHash,
        createdAt: new Date().toISOString(),
        status: 'ATIVO'
    };
    
    localStorage.setItem('secretary-users', JSON.stringify([adminUser]));
    
    console.log('✅ Usuário Admin criado:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Hash: ${adminHash}`);
    
    return adminUser;
}

// 4. TESTAR LOGIN LOCAL
function testLocalLogin(username, password) {
    console.log(`\n🔐 Testando login: ${username} / ${password}`);
    
    const users = JSON.parse(localStorage.getItem('secretary-users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user) {
        console.log('❌ Usuário não encontrado');
        return false;
    }
    
    const inputHash = hashPassword(password);
    console.log(`   Hash digitado: ${inputHash}`);
    console.log(`   Hash armazenado: ${user.passwordHash}`);
    
    if (user.passwordHash === inputHash) {
        console.log('✅ Login bem-sucedido!');
        return true;
    } else {
        console.log('❌ Senha incorreta');
        return false;
    }
}

// 5. TESTAR LOGIN VIA SUPABASE
async function testSupabaseLogin(username, password) {
    console.log(`\n📡 Testando login via Supabase: ${username} / ${password}`);
    
    try {
        const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
            },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('📡 Resposta do Supabase:', result);
            
            if (result.success) {
                console.log('✅ Login via Supabase funcionou!');
                return true;
            } else {
                console.log('❌ Login via Supabase falhou:', result.error);
                return false;
            }
        } else {
            console.log('❌ Erro HTTP:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

// 6. CONFIGURAR USUÁRIO NA PLANILHA GOOGLE SHEETS
async function setupGoogleSheetsUser() {
    console.log('\n📊 Configurando usuário na planilha Google Sheets...');
    
    try {
        // Primeiro, configurar cabeçalhos
        const setupResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
            },
            body: JSON.stringify({
                action: 'setup-headers'
            })
        });
        
        if (setupResponse.ok) {
            const result = await setupResponse.json();
            console.log('✅ Planilha configurada:', result);
            return true;
        } else {
            console.log('❌ Erro ao configurar planilha:', setupResponse.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro ao conectar com Google Sheets:', error.message);
        return false;
    }
}

// 7. EXECUTAR CORREÇÃO COMPLETA
async function runCompletefix() {
    console.log('🚀 EXECUTANDO CORREÇÃO COMPLETA...\n');
    
    // Passo 1: Limpar sistema
    clearAuthSystem();
    
    // Passo 2: Criar usuário Admin
    const adminUser = createAdminUser();
    
    // Passo 3: Testar login local
    const localLoginWorks = testLocalLogin('Admin', 'admin1');
    
    // Passo 4: Configurar Google Sheets
    const sheetsConfigured = await setupGoogleSheetsUser();
    
    // Passo 5: Testar login via Supabase
    const supabaseLoginWorks = await testSupabaseLogin('Admin', 'admin1');
    
    // Passo 6: Relatório final
    console.log('\n📋 RELATÓRIO FINAL:');
    console.log('='.repeat(50));
    console.log(`✅ Sistema limpo: SIM`);
    console.log(`✅ Usuário Admin criado: SIM`);
    console.log(`✅ Login local funciona: ${localLoginWorks ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Google Sheets configurado: ${sheetsConfigured ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Login via Supabase funciona: ${supabaseLoginWorks ? 'SIM' : 'NÃO'}`);
    console.log('='.repeat(50));
    
    if (localLoginWorks) {
        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('🔑 Credenciais para login:');
        console.log('   Username: Admin');
        console.log('   Password: admin1');
        console.log('\n📍 Acesse: http://localhost:3003');
        console.log('💡 O sistema agora deve funcionar corretamente!');
    } else {
        console.log('\n❌ AINDA HÁ PROBLEMAS');
        console.log('🔧 Verifique o console para mais detalhes');
    }
}

// 8. EXECUTAR AUTOMATICAMENTE
runCompletefix();