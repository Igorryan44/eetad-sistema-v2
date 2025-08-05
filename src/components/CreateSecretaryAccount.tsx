import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, Shield, ArrowLeft, Check, X } from 'lucide-react';

interface CreateSecretaryAccountProps {
  onCreateAccount: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<boolean>;
  onBack: () => void;
}

export default function CreateSecretaryAccount({ onCreateAccount, onBack }: CreateSecretaryAccountProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validação de senha
  const validatePassword = (password: string) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isValidLength = password.length === 6;
    
    return {
      hasLetter,
      hasNumber,
      isValidLength,
      isValid: hasLetter && hasNumber && isValidLength
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validações
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('A senha deve ter exatamente 6 caracteres com letras e números');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Por favor, digite um email válido');
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const success = await onCreateAccount({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError('Erro ao criar conta. Usuário ou email já existem.');
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Conta Criada!</h2>
          <p className="text-gray-600 mb-6">
            Sua conta foi criada com sucesso. Redirecionando para o login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Criar Conta da Secretaria</h2>
          <p className="text-gray-600 mt-2">Sistema EETAD v2 - Nova Conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu nome completo"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite um nome de usuário"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 3 caracteres, sem espaços
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu email"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Indicadores de validação da senha */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-xs">
                {passwordValidation.isValidLength ? (
                  <Check className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={passwordValidation.isValidLength ? 'text-green-600' : 'text-red-600'}>
                  Exatamente 6 caracteres
                </span>
              </div>
              <div className="flex items-center text-xs">
                {passwordValidation.hasLetter ? (
                  <Check className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={passwordValidation.hasLetter ? 'text-green-600' : 'text-red-600'}>
                  Pelo menos uma letra
                </span>
              </div>
              <div className="flex items-center text-xs">
                {passwordValidation.hasNumber ? (
                  <Check className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                  Pelo menos um número
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme sua senha"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando Conta...' : 'Criar Conta'}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Sistema seguro EETAD v2</p>
          <p>Conta para acesso à secretaria</p>
        </div>
      </div>
    </div>
  );
}