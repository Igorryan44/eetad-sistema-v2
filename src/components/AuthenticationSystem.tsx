import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock } from 'lucide-react';
import SecretaryLogin from './SecretaryLogin';
import CreateSecretaryAccount from './CreateSecretaryAccount';
import ForgotPassword from './ForgotPassword';
import { authService } from '../services/authService';

type AuthView = 'login' | 'create' | 'forgot';

interface AuthenticationSystemProps {
  onAuthenticated: () => void;
  onCancel?: () => void;
}

const AuthenticationSystem: React.FC<AuthenticationSystemProps> = ({ onAuthenticated, onCancel }) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [stats, setStats] = useState({ totalUsers: 0, lastCreated: undefined });

  useEffect(() => {
    // Verificar se já está autenticado
    if (authService.isAuthenticated()) {
      onAuthenticated();
      return;
    }

    // Carregar estatísticas
    setStats(authService.getStats());
  }, [onAuthenticated]);

  const handleLoginSuccess = () => {
    onAuthenticated();
  };

  const handleAccountCreated = () => {
    setStats(authService.getStats());
    setCurrentView('login');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <SecretaryLogin
            onLogin={async (username: string, password: string) => {
              const success = await authService.login({ username, password });
              if (success) {
                handleLoginSuccess();
              }
              return success;
            }}
            onCancel={onCancel}
          />
        );
      case 'create':
        return (
          <CreateSecretaryAccount
            onAccountCreated={handleAccountCreated}
            onBack={() => setCurrentView('login')}
          />
        );
      case 'forgot':
        return (
          <ForgotPassword
            onBack={() => setCurrentView('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
      {/* Efeito de brilho de fundo animado */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Padrão de fundo SVG */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Header de Segurança */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg md:text-xl">Sistema EETAD v2</h2>
                <p className="text-sm md:text-base text-gray-600">Acesso Seguro à Secretaria</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 text-sm md:text-base text-gray-600">
              <div className="flex items-center gap-1 md:gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <span className="font-medium">{stats.totalUsers} usuários</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                <span className="font-medium">Criptografado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="pt-24 md:pt-28 relative z-10">
        {renderCurrentView()}
      </div>

      {/* Footer de Segurança */}
      <div className="fixed bottom-2 left-2 right-2 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20 shadow-2xl">
          <div className="text-center text-xs md:text-sm text-gray-600">
            <div className="flex items-center justify-center gap-3 md:gap-6 mb-2 flex-wrap">
              <span className="flex items-center gap-1 md:gap-2 font-medium">
                <span className="text-lg">🔐</span>
                <span>Autenticação Segura</span>
              </span>
              <span className="flex items-center gap-1 md:gap-2 font-medium">
                <span className="text-lg">🛡️</span>
                <span>Dados Protegidos</span>
              </span>
              <span className="flex items-center gap-1 md:gap-2 font-medium">
                <span className="text-lg">⚡</span>
                <span>Acesso Rápido</span>
              </span>
            </div>
            <p className="text-xs md:text-sm opacity-75 font-medium">
              Sistema de autenticação com senha alfanumérica de 6 caracteres
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationSystem;