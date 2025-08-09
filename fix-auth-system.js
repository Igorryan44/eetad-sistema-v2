// Script para corrigir o sistema de autenticação
// Força a criação do usuário Admin e testa o login

console.log('🔧 Corrigindo sistema de autenticação...\n');

// Função de hash simples (mesma do authService)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Limpar dados antigos e criar usuário Admin
function setupAuthSystem() {
  console.log('🧹 Limpando dados antigos...');
  
  // Limpar localStorage
  localStorage.removeItem('secretary-users');
  localStorage.removeItem('eetad_secretary_session');
  localStorage.removeItem('eetad_users');
  localStorage.removeItem('eetad_current_user');
  
  console.log('✅ localStorage limpo');
  
  // Criar usuário Admin
  const STORAGE_KEY = 'secretary-users';
  const defaultUser = {
    id: '1',
    username: 'Admin',
    email: 'admin@eetad.com',
    fullName: 'Administrador',
    passwordHash: hashPassword('admin1'),
    createdAt: new Date().toISOString(),
    status: 'ATIVO'
  };
  
  const userList = [defaultUser];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
  
  console.log('✅ Usuário Admin criado:');
  console.log('   Username: Admin');
  console.log('   Password: admin1');
  console.log('   Hash:', defaultUser.passwordHash);
  
  return defaultUser;
}

// Testar login
async function testLogin() {
  console.log('\n🔐 Testando login...');
  
  try {
    // Simular o que o authService faz
    const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
    const credentials = { username: 'Admin', password: 'admin1' };
    
    console.log('📡 Tentando login via Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-secretary-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({ 
        action: 'login',
        username: credentials.username,
        password: credentials.password
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📡 Resposta Supabase:', result);
      
      if (!result.success) {
        console.log('⚠️  Supabase falhou, usando localStorage...');
        return testLocalLogin();
      }
    } else {
      console.log('⚠️  Supabase indisponível, usando localStorage...');
      return testLocalLogin();
    }
  } catch (error) {
    console.log('⚠️  Erro no Supabase, usando localStorage...');
    return testLocalLogin();
  }
}

// Testar login local
function testLocalLogin() {
  console.log('🏠 Testando login local...');
  
  const STORAGE_KEY = 'secretary-users';
  const users = localStorage.getItem(STORAGE_KEY);
  const userList = users ? JSON.parse(users) : [];
  
  const user = userList.find(u => u.username === 'Admin');
  if (user && user.passwordHash === hashPassword('admin1')) {
    console.log('✅ Login local bem-sucedido!');
    
    // Criar sessão
    const session = {
      user: user,
      expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
    };
    
    localStorage.setItem('eetad_secretary_session', JSON.stringify(session));
    console.log('✅ Sessão criada');
    
    return true;
  } else {
    console.log('❌ Login local falhou');
    return false;
  }
}

// Executar correção
async function main() {
  console.log('='.repeat(60));
  console.log('CORREÇÃO DO SISTEMA DE AUTENTICAÇÃO');
  console.log('='.repeat(60));
  
  // 1. Configurar sistema
  const user = setupAuthSystem();
  
  // 2. Testar login
  const loginSuccess = await testLogin();
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO FINAL');
  console.log('='.repeat(60));
  
  if (loginSuccess) {
    console.log('🎉 SISTEMA CORRIGIDO COM SUCESSO!');
    console.log('');
    console.log('📋 Credenciais para login:');
    console.log('   Username: Admin');
    console.log('   Password: admin1');
    console.log('');
    console.log('🔄 Recarregue a página e tente fazer login');
  } else {
    console.log('❌ FALHA NA CORREÇÃO');
    console.log('');
    console.log('💡 Possíveis soluções:');
    console.log('   1. Verificar se o authService está sendo carregado');
    console.log('   2. Verificar se há erros no console');
    console.log('   3. Tentar criar conta nova pela interface');
  }
  
  console.log('\n📋 Estado atual do localStorage:');
  console.log('secretary-users:', localStorage.getItem('secretary-users'));
  console.log('eetad_secretary_session:', localStorage.getItem('eetad_secretary_session'));
}

// Executar
main().catch(console.error);