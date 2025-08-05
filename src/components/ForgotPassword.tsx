import React, { useState } from 'react';
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage('Por favor, digite seu nome de usuário');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const success = await authService.forgotPassword(username.trim());
      
      if (success) {
        setMessage('Instruções de recuperação enviadas para seu email!');
        setMessageType('success');
        
        // Voltar para login após 3 segundos
        setTimeout(() => {
          onBack();
        }, 3000);
      } else {
        setMessage('Usuário não encontrado. Verifique o nome de usuário.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erro ao processar solicitação. Tente novamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Recuperar Senha
          </h1>
          <p className="text-gray-600 text-sm">
            Digite seu nome de usuário para receber instruções de recuperação
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Digite seu nome de usuário"
              disabled={isLoading}
            />
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Enviar Instruções
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Login
            </button>
          </div>
        </form>

        {/* Informações adicionais */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Sistema EETAD v2 - Acesso Seguro
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Seguro</span>
              <span>📧 Email Automático</span>
              <span>⚡ Rápido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;