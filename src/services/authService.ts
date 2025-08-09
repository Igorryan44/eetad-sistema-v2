// Serviço de Autenticação para Secretaria EETAD v2
// Sistema de login seguro com validação de senha usando Google Sheets

interface SecretaryUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface CreateAccountData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

class AuthService {
  private readonly SESSION_KEY = 'eetad_secretary_session';
  private readonly SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
  private currentUser: SecretaryUser | null = null;

  constructor() {
    console.log('🔧 AuthService: Inicializando...');
    this.loadSession();
    this.ensureDefaultUser();
    console.log('✅ AuthService: Inicializado com sucesso');
  }

  // Garantir que o usuário padrão existe
  private ensureDefaultUser(): void {
    console.log('🔄 AuthService: Verificando usuário padrão Admin...');
    
    const STORAGE_KEY = 'secretary-users';
    try {
      const users = localStorage.getItem(STORAGE_KEY);
      console.log('📦 AuthService: Dados brutos do localStorage:', users);
      
      const userList = users ? JSON.parse(users) : [];
      console.log('📋 AuthService: Usuários existentes:', userList.length);
      console.log('📋 AuthService: Lista de usuários:', userList);
      
      // Verificar se Admin já existe
      const adminExists = userList.find((u: any) => u.username === 'Admin');
      console.log('👤 AuthService: Admin existe?', !!adminExists);
      
      // Se não há usuários ou Admin não existe, criar o usuário padrão
      if (userList.length === 0 || !adminExists) {
        const adminPassword = 'admin1';
        const adminHash = this.hashPassword(adminPassword);
        
        console.log('🔐 AuthService: Criando Admin com senha:', adminPassword);
        console.log('🔐 AuthService: Hash gerado:', adminHash);
        
        const defaultUser = {
          id: '1',
          username: 'Admin',
          email: 'admin@eetad.com',
          fullName: 'Administrador',
          passwordHash: adminHash,
          createdAt: new Date().toISOString(),
          status: 'ATIVO'
        };
        
        // Se Admin não existe mas há outros usuários, adicionar
        if (!adminExists) {
          userList.push(defaultUser);
        } else {
          // Se não há usuários, criar lista nova
          userList.length = 0;
          userList.push(defaultUser);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
        console.log('✅ AuthService: Usuário Admin criado com sucesso!');
        console.log('📝 AuthService: Credenciais - Admin/admin1');
        console.log('🔐 AuthService: Hash salvo:', defaultUser.passwordHash);
        
        // Verificar se foi salvo corretamente
        const verification = localStorage.getItem(STORAGE_KEY);
        const verificationList = verification ? JSON.parse(verification) : [];
        console.log('🔍 AuthService: Verificação pós-criação:', verificationList.length, 'usuários');
        verificationList.forEach((user: any) => {
          console.log(`   ✓ ${user.username} - Hash: ${user.passwordHash}`);
        });
      } else {
        console.log('✅ AuthService: Usuários já existem');
        userList.forEach((user: any) => {
          console.log(`   - ${user.username} (${user.email}) - Hash: ${user.passwordHash}`);
        });
      }
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar usuário padrão:', error);
    }
  }

  // Sistema local usando localStorage (sem Supabase)
  private handleLocalStorageOperation(data: any): any {
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
          console.log('🏠 AuthService: Tentando login local...');
          const users = localStorage.getItem(STORAGE_KEY);
          const userList = users ? JSON.parse(users) : [];
          
          console.log('📋 AuthService: Usuários no localStorage:', userList.length);
          
          // Se não há usuários, criar o usuário padrão
          if (userList.length === 0) {
            console.log('⚠️ AuthService: Nenhum usuário encontrado, criando Admin...');
            const defaultUser = {
              id: '1',
              username: 'Admin',
              email: 'admin@eetad.com',
              fullName: 'Administrador',
              passwordHash: this.hashPassword('admin1'),
              createdAt: new Date().toISOString()
            };
            userList.push(defaultUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
            console.log('✅ AuthService: Usuário Admin criado para login');
          }

          console.log('🔍 AuthService: Procurando usuário:', data.username);
          const user = userList.find((u: any) => u.username === data.username);
          
          if (user) {
            console.log('👤 AuthService: Usuário encontrado:', user.username);
            const inputPasswordHash = this.hashPassword(data.password);
            console.log('🔐 AuthService: Hash da senha digitada:', inputPasswordHash);
            console.log('🔐 AuthService: Hash armazenado:', user.passwordHash);
            
            if (user.passwordHash === inputPasswordHash) {
              user.lastLogin = new Date().toISOString();
              localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
              console.log('✅ AuthService: Login local bem-sucedido!');
              return { success: true, user };
            } else {
              console.log('❌ AuthService: Senha incorreta');
              return { success: false, error: 'Credenciais inválidas' };
            }
          } else {
            console.log('❌ AuthService: Usuário não encontrado');
            return { success: false, error: 'Usuário não encontrado' };
          }
        } catch (error) {
          console.error('❌ AuthService: Erro no login local:', error);
          return { success: false, error: 'Erro interno' };
        }

      case 'create':
        try {
          const users = localStorage.getItem(STORAGE_KEY);
          const userList = users ? JSON.parse(users) : [];
          
          // Verificar se usuário já existe
          const existingUser = userList.find((u: any) => 
            u.username === data.userData.username || u.email === data.userData.email
          );
          
          if (existingUser) {
            return { success: false, error: 'Usuário ou email já existem' };
          }

          const newUser = {
            id: Date.now().toString(),
            username: data.userData.username,
            email: data.userData.email,
            fullName: data.userData.fullName,
            passwordHash: this.hashPassword(data.userData.password),
            createdAt: new Date().toISOString()
          };

          userList.push(newUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
          return { success: true, user: newUser };
        } catch {
          return { success: false, error: 'Erro ao criar usuário' };
        }

      default:
        return { success: false, error: 'Ação não suportada' };
    }
  }

  // Carregar sessão ativa
  private loadSession(): void {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.expiresAt > Date.now()) {
          this.currentUser = sessionData.user;
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    }
  }

  // Hash simples para senha (em produção, usar bcrypt ou similar)
  private hashPassword(password: string): string {
    // Implementação simples para demonstração
    // Em produção, usar uma biblioteca de hash segura
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Validar formato da senha
  private validatePassword(password: string): boolean {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isValidLength = password.length === 6;
    
    return hasLetter && hasNumber && isValidLength;
  }

  // Obter todos os usuários
  async getUsers(): Promise<{ success: boolean; users?: any[]; message?: string }> {
    try {
      const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({ action: 'list' })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        console.error('Erro ao listar usuários via Supabase:', response.statusText);
        // Fallback para localStorage
        return this.handleLocalStorageOperation({ action: 'list' });
      }
    } catch (error) {
      console.error('Erro ao conectar com Supabase:', error);
      // Fallback para localStorage
      return this.handleLocalStorageOperation({ action: 'list' });
    }
  }

  // Criar nova conta
  async createAccount(userData: CreateAccountData): Promise<boolean> {
    try {
      // Validações básicas no frontend
      if (!this.validatePassword(userData.password)) {
        throw new Error('Senha deve ter 6 caracteres com letras e números');
      }

      if (!/\S+@\S+\.\S+/.test(userData.email)) {
        throw new Error('Email inválido');
      }

      if (userData.username.length < 3) {
        throw new Error('Nome de usuário deve ter pelo menos 3 caracteres');
      }

      const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({ 
          action: 'create',
          userData: userData
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar conta');
        }
        return true;
      } else {
        console.error('Erro ao criar conta via Supabase:', response.statusText);
        // Fallback para localStorage
        const result = this.handleLocalStorageOperation({
          action: 'create',
          userData: userData
        });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar conta');
        }

        return true;
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }
  }

  // Fazer login
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      console.log('🔐 AuthService: Tentativa de login:', credentials.username);
      console.log('📡 AuthService: Tentando Supabase primeiro...');
      
      const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
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
        console.log('📡 AuthService: Resposta do Supabase:', result);
        
        if (result.success && result.user) {
          // Criar sessão (válida por 8 horas)
          const session = {
            user: result.user,
            expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
          };

          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
          this.currentUser = result.user;
          console.log('🎉 AuthService: Login via Supabase realizado com sucesso!');
          return true;
        }
        
        console.log('❌ AuthService: Login via Supabase falhou:', result.error);
        console.log('🔄 AuthService: Tentando fallback para localStorage...');
        // Fallback para localStorage
        const localResult = this.handleLocalStorageOperation({
          action: 'login',
          username: credentials.username,
          password: credentials.password
        });

        if (localResult.success && localResult.user) {
          // Criar sessão (válida por 8 horas)
          const session = {
            user: localResult.user,
            expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
          };

          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
          this.currentUser = localResult.user;
          console.log('🎉 AuthService: Login via localStorage realizado com sucesso!');
          return true;
        }
        
        console.log('❌ AuthService: Login via localStorage também falhou:', localResult.error);
        return false;
      } else {
        console.error('❌ AuthService: Erro HTTP do Supabase:', response.status, response.statusText);
        console.log('🔄 AuthService: Tentando fallback para localStorage...');
        // Fallback para localStorage
        const localResult = this.handleLocalStorageOperation({
          action: 'login',
          username: credentials.username,
          password: credentials.password
        });

        if (localResult.success && localResult.user) {
          // Criar sessão (válida por 8 horas)
          const session = {
            user: localResult.user,
            expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
          };

          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
          this.currentUser = localResult.user;
          console.log('🎉 AuthService: Login via localStorage realizado com sucesso!');
          return true;
        }
        
        console.log('❌ AuthService: Login via localStorage também falhou:', localResult.error);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthService: Erro de conexão com Supabase:', error);
      console.log('🔄 AuthService: Tentando fallback para localStorage...');
      // Fallback para localStorage
      const localResult = this.handleLocalStorageOperation({
        action: 'login',
        username: credentials.username,
        password: credentials.password
      });

      if (localResult.success && localResult.user) {
        // Criar sessão (válida por 8 horas)
        const session = {
          user: localResult.user,
          expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        this.currentUser = localResult.user;
        console.log('🎉 AuthService: Login via localStorage realizado com sucesso!');
        return true;
      }
      
      console.log('❌ AuthService: Login via localStorage também falhou:', localResult.error);
      return false;
    }
  }

  // Fazer logout
  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser = null;
  }

  // Verificar se está logado
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Obter usuário atual
  getCurrentUser(): SecretaryUser | null {
    return this.currentUser;
  }

  // Recuperar senha (simular envio de email)
  async forgotPassword(username: string): Promise<boolean> {
    try {
      const result = await this.getUsers();
      const users = result.success ? result.users : [];
      const user = users.find(u => u.username === username);

      if (!user) {
        return false;
      }

      // Simular envio de email
      console.log(`Email de recuperação enviado para: ${user.email}`);
      
      // Em uma implementação real, aqui seria enviado um email
      // com um token de recuperação de senha
      
      alert(`Instruções de recuperação enviadas para: ${user.email}`);

      return true;
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      return false;
    }
  };

  // Alterar senha (para futuras implementações)
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        return false;
      }

      if (!this.validatePassword(newPassword)) {
        throw new Error('Nova senha deve ter 6 caracteres com letras e números');
      }

      const result = await this.getUsers();
      const users = result.success ? result.users : [];
      const userIndex = users.findIndex(u => u.id === this.currentUser!.id);

      if (userIndex === -1) {
        return false;
      }

      // Verificar senha atual
      const currentPasswordHash = this.hashPassword(currentPassword);
      if (users[userIndex].passwordHash !== currentPasswordHash) {
        return false;
      }

      // Atualizar senha
      users[userIndex].passwordHash = this.hashPassword(newPassword);
      localStorage.setItem('secretary-users', JSON.stringify(users));

      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  }

  // Obter estatísticas (para administração)
  async getStats(): Promise<{ totalUsers: number; activeUsers: number; recentUsers: number }> {
    try {
      const result = await this.getUsers();
      const users = result.success ? result.users : [];
      return {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.lastLogin).length,
        recentUsers: users.filter(u => {
          if (!u.lastLogin) return false;
          const lastLogin = new Date(u.lastLogin);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastLogin > thirtyDaysAgo;
        }).length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        recentUsers: 0
      };
    }
  }
}

// Instância singleton do serviço de autenticação
export const authService = new AuthService();

// Tipos exportados
export type { SecretaryUser, LoginCredentials, CreateAccountData };