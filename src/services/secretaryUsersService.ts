import { useState, useEffect } from 'react';

interface SecretaryUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  dataContratacao: string;
  ultimoLogin?: string;
  permissoes: string[];
}

interface CreateUserData {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  senha: string;
  permissoes: string[];
}

interface UpdateUserData {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  status?: 'ativo' | 'inativo' | 'suspenso';
  permissoes?: string[];
}

interface UseSecretaryUsersReturn {
  users: SecretaryUser[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<boolean>;
  updateUser: (data: UpdateUserData) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  resetPassword: (id: string) => Promise<boolean>;
}

const API_BASE_URL = 'http://localhost:3003';

export const getSecretaryUsers = async (): Promise<SecretaryUser[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/manage-secretary-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'list' }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.users : [];
  } catch (error) {
    console.error('Erro ao buscar usuários da secretaria:', error);
    throw error;
  }
};

export const createSecretaryUser = async (userData: CreateUserData): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/manage-secretary-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'create',
        userData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao criar usuário da secretaria:', error);
    throw error;
  }
};

export const updateSecretaryUser = async (userData: UpdateUserData): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/manage-secretary-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'update',
        userData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao atualizar usuário da secretaria:', error);
    throw error;
  }
};

export const deleteSecretaryUser = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/manage-secretary-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'delete',
        userId: id
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao deletar usuário da secretaria:', error);
    throw error;
  }
};

export const resetUserPassword = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/manage-secretary-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'reset_password',
        userId: id
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao resetar senha do usuário:', error);
    throw error;
  }
};

export const useSecretaryUsers = (): UseSecretaryUsersReturn => {
  const [users, setUsers] = useState<SecretaryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getSecretaryUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: CreateUserData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await createSecretaryUser(data);
      if (success) {
        await fetchUsers(); // Refresh the list
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: UpdateUserData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await updateSecretaryUser(data);
      if (success) {
        await fetchUsers(); // Refresh the list
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await deleteSecretaryUser(id);
      if (success) {
        await fetchUsers(); // Refresh the list
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await resetUserPassword(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
};

export default useSecretaryUsers;