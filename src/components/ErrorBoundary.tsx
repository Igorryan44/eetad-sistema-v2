import React, { Component, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { connectionService } from '@/services/connectionService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isRetrying: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);

    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('Network') ||
      error.message.includes('server');

    if (isNetworkError && this.retryCount < this.maxRetries) {
      setTimeout(() => this.handleRetry(), 2000);
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    this.retryCount++;

    try {
      const isHealthy = await connectionService.healthCheck(true);
      
      if (isHealthy) {
        this.setState({
          hasError: false,
          error: undefined,
          isRetrying: false
        });
        this.retryCount = 0;
        
        toast({
          title: "✅ Conectado",
          description: "Conexão restaurada!"
        });
      } else {
        throw new Error('Server still not accessible');
      }
    } catch (error) {
      this.setState({ isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.includes('server');

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <CardTitle>
                {isNetworkError ? '🌐 Erro de Conexão' : '⚠️ Erro na Aplicação'}
              </CardTitle>
              <CardDescription className="text-red-100">
                {isNetworkError 
                  ? 'Servidor não acessível'
                  : 'Ocorreu um erro inesperado'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              <div className="text-sm bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-2">Erro:</p>
                <p className="font-mono text-xs">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => this.handleRetry()}
                  disabled={this.state.isRetrying}
                  className="w-full"
                >
                  {this.state.isRetrying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Reconectando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;