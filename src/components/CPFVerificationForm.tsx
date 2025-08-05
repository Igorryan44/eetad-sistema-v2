
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Student } from "@/pages/Index";
import { Search, UserCheck, Loader2, Shield } from "lucide-react";

interface CPFVerificationFormProps {
  onCPFVerified: (student: Student) => void;
}

const CPFVerificationForm = ({ onCPFVerified }: CPFVerificationFormProps) => {
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cpfInputRef = useRef<HTMLInputElement>(null);

  // Foco automático no campo CPF quando o componente é montado
  useEffect(() => {
    if (cpfInputRef.current) {
      cpfInputRef.current.focus();
    }
  }, []);

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
    try {
      // Consultar a planilha Google Sheets via Edge Function
      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/check-student-cpf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({ cpf })
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar CPF');
      }

      const data = await response.json();
      
      if (data.found) {
        // CPF encontrado na planilha
        return {
          cpf: data.student.cpf,
          nome: data.student.nome,
          email: data.student.email,
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
      console.error('Erro ao consultar CPF:', error);
      throw error;
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

    setIsLoading(true);
    
    try {
      const student = await consultarCPFNoGoogleSheets(cpf);
      
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
      toast({
        title: "Erro",
        description: "Erro ao verificar CPF. Tente novamente.",
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
            <CardTitle className="text-xl md:text-2xl font-bold mb-2">Verificação de CPF</CardTitle>
            <CardDescription className="text-blue-100 text-base md:text-lg">
              Digite seu CPF para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 lg:p-8">
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
