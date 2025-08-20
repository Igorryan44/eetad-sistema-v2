import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, Shield, ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-green-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Conta Criada!</CardTitle>
                <CardDescription className="text-green-100 text-lg">
                  Sua conta foi criada com sucesso
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 text-center">
            <p className="text-gray-600 mb-6">
              Redirecionando para o login...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
      <div className="relative">
        {/* Efeito de brilho de fundo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 rounded-2xl blur opacity-75 animate-pulse"></div>
        
        <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg">
          {/* Header com gradiente */}
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden px-4 py-6 md:px-6 md:py-8">
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-3 md:mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold mb-2">Criar Conta da Secretaria</CardTitle>
              <CardDescription className="text-blue-100 text-base md:text-lg">
                Sistema EETAD v2 - Nova Conta
              </CardDescription>
            </div>
          </CardHeader>

        <CardContent className="p-4 md:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="fullName" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Nome Completo
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Digite seu nome completo"
                    className="h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white text-base md:text-lg"
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute inset-y-0 right-3 md:right-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="username" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Nome de Usuário
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Digite um nome de usuário"
                    className="h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white text-base md:text-lg"
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute inset-y-0 right-3 md:right-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 3 caracteres, sem espaços
                </p>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="email" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Digite seu email"
                    className="h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white text-base md:text-lg"
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute inset-y-0 right-3 md:right-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="password" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Digite sua senha"
                    className="h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white text-base md:text-lg pr-12"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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

              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="confirmPassword" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirme sua senha"
                    className="h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white text-base md:text-lg pr-12"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="flex-1 h-12 md:h-14 text-base md:text-lg border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={!passwordValidation.isValid || isLoading}
                  className="flex-1 h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                      <span>Criando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 md:gap-3">
                      <Shield className="h-4 w-4 md:h-5 md:w-5" />
                      <span>Criar Conta</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Sistema seguro EETAD v2</p>
              <p>Conta para acesso à secretaria</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}