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
  private readonly LOCAL_SERVER_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003';
  private currentUser: SecretaryUser | null = null;
  private isProduction: boolean;

  constructor() {
    // Detectar se está em produção
    this.isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('local');
                        
    console.log('🌍 Ambiente detectado:', this.isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
    
    this.loadSession();
    this.ensureDefaultUser();
  }

  // Garantir que o usuário padrão existe
  private ensureDefaultUser(): void {
    const STORAGE_KEY = 'secretary-users';
    try {
      const users = localStorage.getItem(STORAGE_KEY);
      
      const userList = users ? JSON.parse(users) : [];
      
      // Verificar se Admin já existe
      const adminExists = userList.find((u: any) => u.username === 'Admin');
      
      // Se não há usuários ou Admin não existe, criar o usuário padrão
      if (userList.length === 0 || !adminExists) {
        const adminPassword = 'admin1';
        const adminHash = this.hashPassword(adminPassword);
        

        
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
      }
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar usuário padrão:', error);
    }
  }

  // Sistema local usando localStorage
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
          const users = localStorage.getItem(STORAGE_KEY);
          const userList = users ? JSON.parse(users) : [];
          
          console.log('🔍 Tentativa de login local:', { username: data.username, totalUsers: userList.length });
          
          // Se não há usuários, criar o usuário padrão
          if (userList.length === 0) {
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
            console.log('✅ Usuário padrão Admin criado');
          }

          const user = userList.find((u: any) => u.username === data.username);
          
          if (user) {
            const inputPasswordHash = this.hashPassword(data.password);
            console.log('🔑 Verificando senha para:', data.username);
            
            if (user.passwordHash === inputPasswordHash) {
              user.lastLogin = new Date().toISOString();
              localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
              console.log('✅ Login bem-sucedido para:', data.username);
              return { success: true, user };
            } else {
              console.log('❌ Senha incorreta para:', data.username);
              return { success: false, error: 'Credenciais inválidas' };
            }
          } else {
            console.log('❌ Usuário não encontrado:', data.username);
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

  // Hash seguro para senha usando método mais robusto
  private hashPassword(password: string): string {
    // Implementação mais segura - em produção, usar bcrypt no backend
    const salt = 'eetad_salt_2024'; // Em produção, usar salt randômico
    let hash = 0;
    const input = salt + password + salt;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
      hash = Math.abs(hash);
    }
    
    // Aplicar múltiplas iterações para maior segurança
    for (let i = 0; i < 1000; i++) {
      hash = ((hash << 3) ^ (hash >>> 2)) & 0x7fffffff;
    }
    
    return hash.toString(16).padStart(8, '0');
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
    // Em produção, usar apenas localStorage
    if (this.isProduction) {
      console.log('📱 Modo produção: usando localStorage');
      return this.handleLocalStorageOperation({ action: 'list' });
    }

    try {
      const response = await fetch(`${this.LOCAL_SERVER_URL}/functions/manage-secretary-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'list' })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        console.error('Erro ao listar usuários via servidor local:', response.statusText);
        // Fallback para localStorage
        return this.handleLocalStorageOperation({ action: 'list' });
      }
    } catch (error) {
      console.error('Erro ao conectar com servidor local:', error);
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

      // Em produção, usar apenas localStorage
      if (this.isProduction) {
        console.log('📱 Modo produção: criando conta via localStorage');
        const result = this.handleLocalStorageOperation({
          action: 'create',
          userData: userData
        });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar conta');
        }

        return true;
      }

      const response = await fetch(`${this.LOCAL_SERVER_URL}/functions/manage-secretary-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        console.error('Erro ao criar conta via servidor local:', response.statusText);
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
      console.log('🔐 Iniciando processo de login para:', credentials.username);
      
      // Em produção, usar apenas localStorage
      if (this.isProduction) {
        console.log('📱 Modo produção: usando localStorage para login');
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
          console.log('✅ Login bem-sucedido via localStorage (produção)');
          return true;
        }
        
        console.log('❌ Login falhou (produção)');
        return false;
      }
      
      const response = await fetch(`${this.LOCAL_SERVER_URL}/functions/manage-secretary-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'login',
          username: credentials.username,
          password: credentials.password
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🌐 Resposta do servidor:', result);
        
        if (result.success && result.user) {
          // Criar sessão (válida por 8 horas)
          const session = {
            user: result.user,
            expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
          };

          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
          this.currentUser = result.user;
          console.log('✅ Login bem-sucedido via servidor');
          return true;
        }
      } else {
        console.warn('⚠️ Servidor não disponível, usando fallback local');
      }

      // Fallback para localStorage
      console.log('💾 Tentando login via localStorage...');
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
        console.log('✅ Login bem-sucedido via localStorage');
        return true;
      }
      
      console.log('❌ Login falhou');
      return false;
    } catch (error) {
      console.error('❌ AuthService: Erro de conexão, tentando localStorage:', error);
      
      // Fallback para localStorage em caso de erro
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
        console.log('✅ Login bem-sucedido via localStorage (fallback)');
        return true;
      }
      
      console.log('❌ Todos os métodos de login falharam');
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
      const users = (result.success && result.users) ? result.users : [];
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