
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Student } from "@/pages/Index";
import { Search, UserCheck, Loader2, Shield, X, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { apiRequest, checkBackendHealth, getConnectionStatus } from "@/services/api";

interface CPFVerificationFormProps {
  onCPFVerified: (student: Student) => void;
  onCancel?: () => void;
}

const CPFVerificationForm = ({ onCPFVerified, onCancel }: CPFVerificationFormProps) => {
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const cpfInputRef = useRef<HTMLInputElement>(null);

  // Detectar se está em produção
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('local');

  // Foco automático no campo CPF quando o componente é montado
  useEffect(() => {
    if (cpfInputRef.current) {
      cpfInputRef.current.focus();
    }
    
    // Check initial connection status
    checkInitialConnection();
  }, []);

  const checkInitialConnection = async () => {
    try {
      const healthy = await checkBackendHealth();
      setIsConnected(healthy);
      
      if (!healthy) {
        toast({
          title: "⚠️ Servidor Offline",
          description: "O servidor backend não está acessível. Clique em 'Verificar Conexão' para tentar novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleConnectionCheck = async () => {
    setIsCheckingConnection(true);
    try {
      const healthy = await checkBackendHealth();
      setIsConnected(healthy);
      
      if (healthy) {
        toast({
          title: "✅ Conexão Restaurada",
          description: "Servidor backend está online e funcionando."
        });
      } else {
        toast({
          title: "❌ Servidor Offline",
          description: "Não foi possível conectar ao servidor. Verifique se está rodando na porta 3003.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "❌ Erro de Conexão",
        description: "Falha ao verificar status do servidor.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return value;
  };

  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    
    // Verificação básica de CPF
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cleaned.charAt(10));
  };

  const consultarCPFNoGoogleSheets = async (cpf: string): Promise<Student> => {
    // Em produção, simular consulta sem backend
    if (isProduction) {
      console.log('📱 Modo produção: simulando consulta de CPF');
      
      // Simular delay de consulta
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular resposta baseada no CPF
      const isValidFormat = validateCPF(cpf);
      
      if (!isValidFormat) {
        throw new Error('CPF inválido');
      }
      
      // Simular usuário encontrado para alguns CPFs específicos
      const knownCPFs = ['12345678901', '11111111111', '22222222222'];
      const cpfClean = cpf.replace(/\D/g, '');
      
      if (knownCPFs.includes(cpfClean)) {
        return {
          cpf: cpf,
          nome: "Aluno Demonstração",
          email: "aluno@exemplo.com",
          registered: true
        };
      } else {
        // CPF não encontrado - novo aluno
        return {
          cpf,
          nome: "",
          email: "",
          registered: false
        };
      }
    }
    
    try {
      console.log('🔍 Consultando CPF:', cpf);
      
      // Make request using the robust API service
      const data = await apiRequest('/functions/get-student-personal-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf })
      });
      
      console.log('📋 Resposta da API:', data);
      
      if (data.found) {
        // CPF encontrado na planilha
        return {
          cpf: data.data.cpf,
          nome: data.data.nome,
          email: data.data.email,
          registered: true
        };
      } else {
        // CPF não encontrado - novo aluno
        return {
          cpf,
          nome: "",
          email: "",
          registered: false
        };
      }
    } catch (error) {
      console.error('❌ Erro ao consultar CPF:', error);
      
      // Update connection status
      setIsConnected(false);
      
      // Provide detailed error information
      if (error instanceof Error) {
        if (error.message.includes('server is not accessible') || 
            error.message.includes('Failed to connect')) {
          throw new Error('Servidor backend não está disponível. Verifique se o servidor local está rodando na porta 3003.');
        }
        throw error;
      }
      
      throw new Error('Erro desconhecido ao consultar CPF');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCPF(cpf)) {
      toast({
        title: "CPF Inválido",
        description: "Por favor, digite um CPF válido.",
        variant: "destructive"
      });
      return;
    }

    // Em produção, não verificar conexão
    if (!isProduction && !isConnected) {
      toast({
        title: "⚠️ Servidor Offline",
        description: "Verifique a conexão com o servidor antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const student = await consultarCPFNoGoogleSheets(cpf);
      
      // Update connection status on success
      setIsConnected(true);
      
      if (student.registered) {
        toast({
          title: "Aluno Encontrado!",
          description: `Bem-vindo de volta, ${student.nome}!`
        });
      } else {
        toast({
          title: "CPF não encontrado",
          description: "Você será direcionado para o formulário de matrícula."
        });
      }
      
      onCPFVerified(student);
    } catch (error) {
      // Update connection status on failure (only in development)
      if (!isProduction) {
        setIsConnected(false);
      }
      
      const errorMessage = error instanceof Error ? error.message : "Erro ao verificar CPF. Tente novamente.";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.length <= 14) {
      setCpf(formatted);
    }
  };

  return (
    <div className="relative">
      {/* Efeito de brilho de fundo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 rounded-2xl blur opacity-75 animate-pulse"></div>
      
      <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
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
            <CardTitle className="text-xl md:text-2xl font-bold mb-2">Acesso do Aluno</CardTitle>
            <CardDescription className="text-blue-100 text-base md:text-lg">
              Digite seu CPF para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 lg:p-8">
          {/* Connection Status Indicator */}
          <div className="mb-4 md:mb-6 flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border">
            <div className="flex items-center gap-2 md:gap-3">
              {isConnected ? (
                <Wifi className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              )}
              <span className={`text-sm md:text-base font-medium ${
                isConnected ? 'text-green-700' : 'text-red-700'
              }`}>
                {isConnected ? 'Servidor Online' : 'Servidor Offline'}
              </span>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConnectionCheck}
              disabled={isCheckingConnection}
              className="h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm"
            >
              {isCheckingConnection ? (
                <>
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-1" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Verificar Conexão
                </>
              )}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="cpf" className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                CPF
              </Label>
              <div className="relative">
                <Input
                  ref={cpfInputRef}
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCPFChange}
                  required
                  className="text-center text-lg md:text-xl font-mono h-12 md:h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 bg-gray-50 focus:bg-white"
                />
                <div className="absolute inset-y-0 right-3 md:right-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3">
                  <Search className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Verificar CPF</span>
                </div>
              )}
            </Button>
            
            {onCancel && (
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full h-10 md:h-12 text-sm md:text-base font-medium border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-300"
              >
                <X className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Cancelar
              </Button>
            )}
          </form>
          
          {/* Informações de segurança */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-2 md:gap-3">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-800 mb-1">Seus dados estão seguros</p>
                <p className="text-xs text-blue-600">
                  Utilizamos criptografia para proteger suas informações pessoais.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CPFVerificationForm;
