// Script para testar o sistema de autenticação local
// Verifica se o usuário Admin está sendo criado corretamente no localStorage

console.log('🔍 Testando sistema de autenticação local...\n');

// Função de hash simples (mesma do authService)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Simular o que o authService faz
function ensureDefaultUser() {
  console.log('🔄 Verificando usuário padrão Admin...');
  
  const STORAGE_KEY = 'secretary-users';
  try {
    const users = localStorage.getItem(STORAGE_KEY);
    const userList = users ? JSON.parse(users) : [];
    
    console.log('📋 Usuários existentes:', userList.length);
    
    // Se não há usuários, criar o usuário padrão
    if (userList.length === 0) {
      const defaultUser = {
        id: '1',
        username: 'Admin',
        email: 'admin@eetad.com',
        fullName: 'Administrador',
        passwordHash: hashPassword('admin1'),
        createdAt: new Date().toISOString(),
        status: 'ATIVO'
      };
      userList.push(defaultUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
      console.log('✅ Usuário Admin criado com sucesso!');
      console.log('📝 Dados do usuário:', defaultUser);
    } else {
      console.log('✅ Usuários já existem:');
      userList.forEach(user => {
        console.log(`   - ${user.username} (${user.email})`);
      });
    }
    
    return userList;
  } catch (error) {
    console.log('❌ Erro ao verificar usuário padrão:', error);
    return [];
  }
}

// Testar login local
function testLocalLogin(username, password) {
  console.log(`\n🔑 Testando login: ${username} / ${password}`);
  
  const STORAGE_KEY = 'secretary-users';
  try {
    const users = localStorage.getItem(STORAGE_KEY);
    const userList = users ? JSON.parse(users) : [];
    
    const user = userList.find(u => u.username === username);
    if (user) {
      console.log(`👤 Usuário encontrado: ${user.username}`);
      console.log(`🔐 Hash armazenado: ${user.passwordHash}`);
      console.log(`🔐 Hash da senha: ${hashPassword(password)}`);
      
      if (user.passwordHash === hashPassword(password)) {
        console.log('✅ Login bem-sucedido!');
        return { success: true, user };
      } else {
        console.log('❌ Senha incorreta');
        return { success: false, error: 'Senha incorreta' };
      }
    } else {
      console.log('❌ Usuário não encontrado');
      return { success: false, error: 'Usuário não encontrado' };
    }
  } catch (error) {
    console.log('❌ Erro no login:', error);
    return { success: false, error: 'Erro interno' };
  }
}

// Executar testes
console.log('='.repeat(50));
console.log('TESTE 1: Garantir usuário padrão');
console.log('='.repeat(50));

const users = ensureDefaultUser();

console.log('\n' + '='.repeat(50));
console.log('TESTE 2: Testar login com credenciais padrão');
console.log('='.repeat(50));

testLocalLogin('Admin', 'admin1');

console.log('\n' + '='.repeat(50));
console.log('TESTE 3: Testar outras credenciais');
console.log('='.repeat(50));

testLocalLogin('admin', 'admin1');
testLocalLogin('Admin', 'admin123');

console.log('\n' + '='.repeat(50));
console.log('TESTE 4: Verificar localStorage');
console.log('='.repeat(50));

console.log('📋 Conteúdo do localStorage:');
console.log('secretary-users:', localStorage.getItem('secretary-users'));
console.log('eetad_secretary_session:', localStorage.getItem('eetad_secretary_session'));

console.log('\n✅ Testes concluídos!');
console.log('💡 Se o login ainda não funcionar, pode ser um problema no frontend.');