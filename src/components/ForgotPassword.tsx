import React, { useState } from 'react';
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
                  <Mail className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold mb-2">Recuperar Senha</CardTitle>
              <CardDescription className="text-blue-100 text-base md:text-lg">
                Digite seu nome de usuário para receber instruções
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="username" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Nome de Usuário
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu nome de usuário"
                    className="h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white text-base md:text-lg"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-3 md:right-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Mensagem de feedback */}
              {message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                  messageType === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-200 shadow-lg' 
                    : 'bg-red-50 text-red-700 border-red-200 shadow-lg'
                }`}>
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="text-sm md:text-base font-medium">{message}</span>
                </div>
              )}

              {/* Botões */}
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
                  disabled={isLoading}
                  className="flex-1 h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 md:gap-3">
                      <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 md:gap-3">
                      <Mail className="h-4 w-4 md:h-5 md:w-5" />
                      <span>Enviar Instruções</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Informações adicionais */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs md:text-sm text-gray-500 mb-2 font-medium">
                  Sistema EETAD v2 - Acesso Seguro
                </p>
                <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-gray-400">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="text-base">🔒</span>
                    <span>Seguro</span>
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="text-base">📧</span>
                    <span>Email Automático</span>
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="text-base">⚡</span>
                    <span>Rápido</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;