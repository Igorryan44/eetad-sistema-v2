import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  cpf: string;
  createdAt: string;
  lastLogin?: string;
}

interface CreateUserData {
  fullName: string;
  cpf: string;
  email: string;
  username: string;
  password: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateUserData>({
    fullName: '',
    cpf: '',
    email: '',
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState<Partial<CreateUserData>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const storedUsers = localStorage.getItem('eetad_secretary_users');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        // Adicionar CPF aos usuários existentes se não tiverem
        const usersWithCpf = parsedUsers.map((user: any) => ({
          ...user,
          cpf: user.cpf || '000.000.000-00' // CPF padrão para usuários antigos
        }));
        setUsers(usersWithCpf);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de usuários",
        variant: "destructive"
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf)) {
      newErrors.cpf = 'CPF deve estar no formato 000.000.000-00';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter letras e números';
    }

    // Verificar se usuário ou email já existem
    const existingUser = users.find(
      user => user.username === formData.username || user.email === formData.email
    );
    if (existingUser) {
      if (existingUser.username === formData.username) {
        newErrors.username = 'Nome de usuário já existe';
      }
      if (existingUser.email === formData.email) {
        newErrors.email = 'Email já está em uso';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const newUser = {
        id: Date.now().toString(),
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        cpf: formData.cpf,
        passwordHash: hashPassword(formData.password),
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('eetad_secretary_users', JSON.stringify(updatedUsers));
      
      setUsers(updatedUsers);
      setIsCreateDialogOpen(false);
      setFormData({
        fullName: '',
        cpf: '',
        email: '',
        username: '',
        password: ''
      });
      setErrors({});

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'admin-default') {
      toast({
        title: "Erro",
        description: "Não é possível excluir o usuário administrador padrão",
        variant: "destructive"
      });
      return;
    }

    const updatedUsers = users.filter(user => user.id !== userId);
    localStorage.setItem('eetad_secretary_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    toast({
      title: "Sucesso",
      description: "Usuário excluído com sucesso!"
    });
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    if (formatted.length <= 14) {
      setFormData({ ...formData, cpf: formatted });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h2>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Digite o nome completo"
                />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {errors.cpf && <p className="text-sm text-red-600">{errors.cpf}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@email.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Digite o nome de usuário"
                />
                {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres com letras e números"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateUser}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Criando...' : 'Criar Usuário'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum usuário encontrado</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-600">CPF: {user.cpf}</p>
                    <p className="text-xs text-gray-500">
                      Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {user.lastLogin && (
                      <p className="text-xs text-gray-500">
                        Último login: {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {user.id !== 'admin-default' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;