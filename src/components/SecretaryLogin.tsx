import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SecretaryLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onCancel?: () => void;
}

export default function SecretaryLogin({ onLogin, onCancel }: SecretaryLoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!username.trim() || !password.trim()) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      const success = await onLogin(username, password);
      if (!success) {
        setError('Usuário ou senha incorretos');
      }
    } catch (error) {
      setError('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
      <div className="relative">
        {/* Efeito de brilho de fundo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 rounded-2xl blur opacity-75 animate-pulse"></div>
        
        <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden w-full max-w-md">
          {/* Botão de voltar */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 z-10 text-white/70 hover:text-white transition-colors"
            title="Voltar à página inicial"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
              title="Cancelar e voltar"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          
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
              <CardTitle className="text-xl md:text-2xl font-bold mb-2">Acesso à Secretaria</CardTitle>
              <CardDescription className="text-blue-100 text-base md:text-lg">
                Sistema EETAD v2 - Área Restrita
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="username" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Nome de Usuário
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-center text-lg md:text-xl font-mono h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white"
                    placeholder="Digite seu usuário"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-3 md:right-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-center text-lg md:text-xl font-mono h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white pr-12"
                    placeholder="Digite sua senha"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Senha deve ter 6 caracteres (letras e números)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 md:gap-3">
                    <Shield className="h-4 w-4 md:h-5 md:w-5" />
                    <span>Entrar na Secretaria</span>
                  </div>
                )}
              </Button>

              {/* Botão de voltar à página inicial */}
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full h-12 md:h-14 border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Página Inicial
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full h-12 md:h-14 border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105 mt-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Sistema seguro EETAD v2</p>
              <p>Acesso restrito à equipe da secretaria</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}