import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import CPFVerificationForm from "@/components/CPFVerificationForm";
import RegistrationForm from "@/components/RegistrationForm";
import BookOrderForm from "@/components/BookOrderForm";
import CheckoutPage from "@/components/CheckoutPage";
import { MessageCircle, Sparkles, Users, BookOpen, CreditCard } from "lucide-react";

export type Student = {
  cpf: string;
  nome: string;
  email: string;
  registered: boolean;
};

export type BookOrder = {
  studentName: string;
  cpf: string;
  email: string;
  bookName: string;
  price: number;
  cycle?: string;
};

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'cpf' | 'registration' | 'bookOrder' | 'checkout'>('cpf');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentBookOrder, setCurrentBookOrder] = useState<BookOrder | null>(null);

  const handleCPFVerified = (student: Student) => {
    setCurrentStudent(student);
    if (student.registered) {
      setCurrentStep('bookOrder');
    } else {
      setCurrentStep('registration');
    }
  };

  const handleRegistrationComplete = (student: Student) => {
    setCurrentStudent(student);
    setCurrentStep('bookOrder');
  };

  const handleBookOrderComplete = (bookOrder: BookOrder) => {
    setCurrentBookOrder(bookOrder);
    setCurrentStep('checkout');
  };

  const handleBackToCPF = () => {
    setCurrentStep('cpf');
    setCurrentStudent(null);
    setCurrentBookOrder(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-20 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-blue-500/20 rounded-full blur-lg animate-ping delay-3000"></div>
      <div className="absolute bottom-1/3 right-10 w-20 h-20 bg-purple-500/20 rounded-full blur-lg animate-pulse delay-4000"></div>
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header moderno */}
          <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
            {/* Título principal com efeito gradiente */}
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-2 md:mb-4 animate-fade-in px-4">
                Sistema de Controle
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-blue-200 to-purple-300 bg-clip-text text-transparent mb-4 md:mb-6 px-4">
                EETAD - NÚCLEO PALMAS/TO
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-emerald-100/90 max-w-2xl mx-auto leading-relaxed px-4">
                Plataforma moderna para interação com alunos do curso de teologia
              </p>
            </div>
            
            {/* Botão do assistente virtual modernizado */}
            <div className="mt-6 md:mt-8 px-4">
              <Button 
                onClick={() => window.open('/chatbot-test', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/25 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 md:gap-3">
                  {/* Avatar de aluno animado */}
                  <div className="relative">
                    <div className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-full flex items-center justify-center animate-bounce">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-600">
                        <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                      </svg>
                    </div>
                    {/* Indicador de atividade */}
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-base md:text-lg">Assistente EETAD</span>
                  <Sparkles className="h-3 md:h-4 w-3 md:w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            </div>

            {/* Indicadores de progresso */}
            <div className="mt-8 md:mt-12 flex justify-center px-4">
              <div className="flex items-center space-x-2 md:space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-3 md:px-6 py-2 md:py-3 border border-white/20 overflow-x-auto">
                <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'cpf' ? 'text-white' : 'text-white/50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${currentStep === 'cpf' ? 'bg-blue-500' : 'bg-white/20'} transition-all duration-300`}>
                    <Users className="h-3 md:h-4 w-3 md:w-4" />
                  </div>
                  <span className="text-xs md:text-sm font-medium hidden sm:block">CPF</span>
                </div>
                
                <div className="w-4 md:w-8 h-0.5 bg-white/30 flex-shrink-0"></div>
                
                <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'registration' ? 'text-white' : 'text-white/50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${currentStep === 'registration' ? 'bg-purple-500' : 'bg-white/20'} transition-all duration-300`}>
                    <BookOpen className="h-3 md:h-4 w-3 md:w-4" />
                  </div>
                  <span className="text-xs md:text-sm font-medium hidden sm:block">Matrícula</span>
                </div>
                
                <div className="w-4 md:w-8 h-0.5 bg-white/30 flex-shrink-0"></div>
                
                <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'bookOrder' ? 'text-white' : 'text-white/50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${currentStep === 'bookOrder' ? 'bg-blue-600' : 'bg-white/20'} transition-all duration-300`}>
                    <BookOpen className="h-3 md:h-4 w-3 md:w-4" />
                  </div>
                  <span className="text-xs md:text-sm font-medium hidden sm:block">Pedido</span>
                </div>
                
                <div className="w-4 md:w-8 h-0.5 bg-white/30 flex-shrink-0"></div>
                
                <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'checkout' ? 'text-white' : 'text-white/50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${currentStep === 'checkout' ? 'bg-purple-600' : 'bg-white/20'} transition-all duration-300`}>
                    <CreditCard className="h-3 md:h-4 w-3 md:w-4" />
                  </div>
                  <span className="text-xs md:text-sm font-medium hidden sm:block">Pagamento</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex justify-center">
            {currentStep === 'cpf' && (
              <div className="w-full max-w-md animate-fade-in">
                <CPFVerificationForm onCPFVerified={handleCPFVerified} />
              </div>
            )}

            {currentStep === 'registration' && currentStudent && (
              <div className="w-full max-w-4xl animate-slide-in">
                <RegistrationForm 
                  cpf={currentStudent.cpf} 
                  onRegistrationComplete={handleRegistrationComplete}
                  onBack={handleBackToCPF}
                />
              </div>
            )}

            {currentStep === 'bookOrder' && currentStudent && (
              <div className="w-full max-w-4xl animate-slide-in">
                <BookOrderForm 
                  student={currentStudent}
                  onBookOrderComplete={handleBookOrderComplete}
                  onBack={handleBackToCPF}
                />
              </div>
            )}

            {currentStep === 'checkout' && currentBookOrder && (
              <div className="w-full max-w-4xl animate-slide-in">
                <CheckoutPage 
                  bookOrder={currentBookOrder}
                  onBack={() => setCurrentStep('bookOrder')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;