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
    this.loadSession();
    this.ensureDefaultUser();
  }

  // Garantir que o usuário padrão existe
  private async ensureDefaultUser(): Promise<void> {
    try {
      console.log('🔄 Verificando usuário padrão Admin...');
      
      // Tentar fazer login com credenciais padrão para verificar se existe
      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/manage-secretary-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          username: 'Admin',
          password: 'admin1'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Usuário Admin já existe');
      } else {
        console.log('⚠️ Usuário Admin não encontrado, será criado quando necessário');
      }
    } catch (error) {
      console.log('📝 Usuário Admin será criado quando necessário');
    }
  }

  // Fazer chamada para a API do Supabase (com fallback para localStorage)
  private async callSupabaseFunction(data: any): Promise<any> {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/manage-secretary-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log('⚠️ Função Supabase não disponível, usando localStorage como fallback');
      return this.handleLocalStorageFallback(data);
    }
  }

  // Fallback para localStorage quando Supabase não está disponível
  private handleLocalStorageFallback(data: any): any {
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
          }

          const user = userList.find((u: any) => u.username === data.username);
          if (user && user.passwordHash === this.hashPassword(data.password)) {
            user.lastLogin = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
            return { success: true, user };
          }
          return { success: false, error: 'Credenciais inválidas' };
        } catch {
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
  private async getUsers(): Promise<SecretaryUser[]> {
    try {
      const result = await this.callSupabaseFunction({ action: 'list' });
      return result.success ? result.users : [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
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

      // Chamar API para criar usuário
      const result = await this.callSupabaseFunction({
        action: 'create',
        userData: userData
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conta');
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }
  }

  // Fazer login
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      console.log('🔐 Tentativa de login:', credentials.username);
      
      // Chamar API para fazer login
      const result = await this.callSupabaseFunction({
        action: 'login',
        username: credentials.username,
        password: credentials.password
      });

      if (result.success && result.user) {
        // Criar sessão (válida por 8 horas)
        const session = {
          user: result.user,
          expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        this.currentUser = result.user;
        console.log('🎉 Login realizado com sucesso!');
        return true;
      }
      
      console.log('❌ Login falhou:', result.error);
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
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
      const users = await this.getUsers();
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

      const users = this.getUsers();
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
      this.saveUsers(users);

      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  }

  // Obter estatísticas (para administração)
  async getStats(): Promise<{ totalUsers: number; activeUsers: number; recentUsers: number }> {
    try {
      const users = await this.getUsers();
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