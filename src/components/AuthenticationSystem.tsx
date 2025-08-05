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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header de Segurança */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Sistema EETAD v2</h2>
                <p className="text-sm text-gray-600">Acesso Seguro à Secretaria</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{stats.totalUsers} usuários</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                <span>Criptografado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="pt-24">
        {renderCurrentView()}
      </div>

      {/* Footer de Segurança */}
      <div className="fixed bottom-2 left-2 right-2 z-10">
        <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/20">
          <div className="text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-3 mb-1 flex-wrap">
              <span className="flex items-center gap-1">🔐 Autenticação Segura</span>
              <span className="flex items-center gap-1">🛡️ Dados Protegidos</span>
              <span className="flex items-center gap-1">⚡ Acesso Rápido</span>
            </div>
            <p className="text-xs opacity-75">
              Sistema de autenticação com senha alfanumérica de 6 caracteres
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationSystem;