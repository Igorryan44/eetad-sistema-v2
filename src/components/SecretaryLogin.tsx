import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, X } from 'lucide-react';

interface SecretaryLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onCancel?: () => void;
}

export default function SecretaryLogin({ onLogin, onCancel }: SecretaryLoginProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            title="Cancelar e voltar"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acesso à Secretaria</h2>
          <p className="text-gray-600 mt-2">Sistema EETAD v2 - Área Restrita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu usuário"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <p className="text-xs text-gray-500 mt-1">
              Senha deve ter 6 caracteres (letras e números)
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          {onCancel && (
            <div className="mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors w-full"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Sistema seguro EETAD v2</p>
          <p>Acesso restrito à equipe da secretaria</p>
        </div>
      </div>
    </div>
  );
}