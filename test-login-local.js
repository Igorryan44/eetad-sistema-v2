// Teste do Sistema de Login Local
// Este script testa se o sistema de autenticação local está funcionando

console.log('🧪 Testando Sistema de Login Local...\n');

// Simular localStorage (para teste em Node.js)
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  }
};

// Simular a classe AuthService (versão simplificada)
class TestAuthService {
  constructor() {
    this.SESSION_KEY = 'eetad_secretary_session';
    this.currentUser = null;
    this.ensureDefaultUser();
  }

  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  ensureDefaultUser() {
    const STORAGE_KEY = 'secretary-users';
    try {
      const users = localStorage.getItem(STORAGE_KEY);
      const userList = users ? JSON.parse(users) : [];
      
      if (userList.length === 0) {
        const defaultUser = {
          id: '1',
          username: 'Admin',
          email: 'admin@eetad.com',
          fullName: 'Administrador',
          passwordHash: this.hashPassword('admin1'),
          createdAt: new Date().toISOString(),
          status: 'ATIVO'
        };
        userList.push(defaultUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
        console.log('✅ Usuário Admin criado com sucesso!');
      } else {
        console.log('✅ Usuário Admin já existe');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar usuário padrão:', error);
    }
  }

  handleLocalStorageOperation(data) {
    const STORAGE_KEY = 'secretary-users';
    
    switch (data.action) {
      case 'list':
        try {
          const users = localStorage.getItem(STORAGE_KEY);
          return { success: true, users: users ? JSON.parse(users) : [] };
        } catch {
          return { success: true, users: [] };
        }

      case 'login':
        try {
          const users = localStorage.getItem(STORAGE_KEY);
          const userList = users ? JSON.parse(users) : [];
          
          const user = userList.find(u => u.username === data.username);
          if (user && user.passwordHash === this.hashPassword(data.password)) {
            user.lastLogin = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
            return { success: true, user };
          }
          return { success: false, error: 'Credenciais inválidas' };
        } catch {
          return { success: false, error: 'Erro interno' };
        }

      default:
        return { success: false, error: 'Ação não suportada' };
    }
  }

  async login(credentials) {
    console.log(`🔐 Tentativa de login: ${credentials.username}`);
    
    const result = this.handleLocalStorageOperation({
      action: 'login',
      username: credentials.username,
      password: credentials.password
    });

    if (result.success && result.user) {
      this.currentUser = result.user;
      console.log('🎉 Login realizado com sucesso!');
      return true;
    }
    
    console.log('❌ Login falhou:', result.error);
    return false;
  }

  getUsers() {
    const result = this.handleLocalStorageOperation({ action: 'list' });
    return result.success ? result.users : [];
  }
}

// Executar testes
async function runTests() {
  const authService = new TestAuthService();

  console.log('\n📋 Teste 1: Verificar usuários existentes');
  const users = authService.getUsers();
  console.log(`Usuários encontrados: ${users.length}`);
  users.forEach(user => {
    console.log(`- ${user.username} (${user.email}) - Status: ${user.status || 'N/A'}`);
  });

  console.log('\n🔐 Teste 2: Login com credenciais corretas');
  const loginSuccess = await authService.login({
    username: 'Admin',
    password: 'admin1'
  });
  console.log(`Resultado: ${loginSuccess ? 'SUCESSO' : 'FALHA'}`);

  console.log('\n❌ Teste 3: Login com credenciais incorretas');
  const loginFail = await authService.login({
    username: 'Admin',
    password: 'senhaerrada'
  });
  console.log(`Resultado: ${loginFail ? 'SUCESSO (INESPERADO)' : 'FALHA (ESPERADO)'}`);

  console.log('\n📊 Resumo dos Testes:');
  console.log(`✅ Usuário padrão criado: ${users.length > 0 ? 'SIM' : 'NÃO'}`);
  console.log(`✅ Login correto funciona: ${loginSuccess ? 'SIM' : 'NÃO'}`);
  console.log(`✅ Login incorreto falha: ${!loginFail ? 'SIM' : 'NÃO'}`);
  
  const allTestsPassed = users.length > 0 && loginSuccess && !loginFail;
  console.log(`\n🎯 Status geral: ${allTestsPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);
}

runTests().catch(console.error);