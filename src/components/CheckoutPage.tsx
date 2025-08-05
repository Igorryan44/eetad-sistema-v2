import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { BookOrder } from "@/pages/Index";
import { 
  ArrowLeft, 
  CheckCircle, 
  Copy, 
  CreditCard, 
  QrCode, 
  X, 
  Book, 
  Info, 
  User, 
  FileText, 
  DollarSign,
  Loader2,
  Shield,
  Clock,
  Smartphone,
  Zap
} from "lucide-react";

interface CheckoutPageProps {
  bookOrder: BookOrder;
  onBack: () => void;
}

const CheckoutPage = ({ bookOrder, onBack }: CheckoutPageProps) => {
  const [pixKey, setPixKey] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'confirmed'>('pending');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  const generateRealPix = async () => {
    setIsGeneratingPix(true);
    
    try {
      const paymentData = {
        nome: bookOrder.studentName,
        cpf: bookOrder.cpf,
        email: bookOrder.email || "aluno@eetad.com.br",
        valor: bookOrder.price,
        livro: bookOrder.bookName,
        ciclo: bookOrder.cycle || "1º Ciclo Básico"
      };

      console.log("[CheckoutPage] Enviando dados para criar PIX MercadoPago:", paymentData);

      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/create-mercadopago-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      console.log("[CheckoutPage] Resposta create-mercadopago-payment:", result);

      if (!response.ok) {
        throw new Error(result?.error || "Erro ao criar pagamento PIX MercadoPago");
      }

      if (!result.qr_code_base64 || !result.qr_code) {
        throw new Error("QR Code do PIX não foi gerado pelo MercadoPago");
      }

      setPaymentId(result.payment_id || "");
      setPixKey(result.qr_code);
      setQrCodeData(result.qr_code_base64);

      console.log("[CheckoutPage] PIX MercadoPago gerado com sucesso:", {
        payment_id: result.payment_id,
        qr_code_length: result.qr_code?.length,
        qr_code_base64_length: result.qr_code_base64?.length
      });

    } catch (error: any) {
      console.error('[CheckoutPage] Erro ao gerar PIX MercadoPago:', error);
      
      let errorMessage = "Tente novamente em alguns instantes.";
      
      if (error?.message?.includes("MERCADOPAGO_ACCESS_TOKEN")) {
        errorMessage = "Erro de configuração do sistema. Contate o suporte.";
      } else if (error?.message?.includes("unauthorized") || error?.message?.includes("401")) {
        errorMessage = "Token de acesso inválido. Contate o suporte.";
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      toast({
        title: "Erro ao gerar PIX MercadoPago",
        description: errorMessage,
        variant: "destructive"
      });
      setPixKey("");
      setQrCodeData("");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const verifyPaymentStatus = async () => {
    if (!paymentId) {
      toast({
        title: "Erro",
        description: "ID do pagamento não encontrado.",
        variant: "destructive"
      });
      return;
    }

    setPaymentStatus('processing');
    
    try {
      console.log("[CheckoutPage] Verificando status do pagamento MercadoPago:", paymentId);

      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/check-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({ payment_id: paymentId })
      });

      const result = await response.json();
      console.log("[CheckoutPage] Status do pagamento MercadoPago:", result);

      if (result.status === 'approved') {
        setPaymentStatus('confirmed');
        toast({
          title: "Pagamento confirmado!",
          description: "Seu livro será enviado em breve. Você receberá uma confirmação via WhatsApp."
        });
      } else if (result.status === 'pending') {
        setPaymentStatus('pending');
        toast({
          title: "Pagamento pendente",
          description: "O pagamento ainda não foi processado. Aguarde alguns minutos e tente novamente.",
          variant: "default"
        });
      } else {
        setPaymentStatus('pending');
        toast({
          title: "Pagamento não identificado",
          description: "Aguarde alguns minutos e tente verificar novamente.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[CheckoutPage] Erro ao verificar pagamento MercadoPago:', error);
      setPaymentStatus('pending');
      toast({
        title: "Erro ao verificar pagamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  const cancelPayment = async () => {
    const confirmed = window.confirm(
      "⚠️ ATENÇÃO!\n\nAo cancelar o pagamento, seu pedido será EXCLUÍDO permanentemente do sistema.\n\nDeseja realmente cancelar o pagamento e excluir o pedido?\n\n✅ SIM - Cancelar e excluir pedido\n❌ NÃO - Manter pedido ativo"
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    
    try {
      console.log("[CheckoutPage] Cancelando pagamento e removendo registros");
      
      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({
          cpf: bookOrder.cpf,
          livro: bookOrder.bookName,
          payment_id: paymentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar pedido');
      }

      toast({
        title: "Pedido cancelado com sucesso",
        description: "Seu pedido foi cancelado e removido do sistema.",
        variant: "default"
      });

      onBack();

    } catch (error: any) {
      console.error('[CheckoutPage] Erro ao cancelar pagamento:', error);
      toast({
        title: "Erro ao cancelar",
        description: error?.message || "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleBackWithConfirmation = () => {
    const confirmed = window.confirm(
      "⚠️ ATENÇÃO!\n\nAo voltar para a página anterior, seu pedido será EXCLUÍDO permanentemente do sistema.\n\nDeseja realmente voltar e excluir o pedido?\n\n✅ SIM - Voltar e excluir pedido\n❌ NÃO - Permanecer na página de pagamento"
    );

    if (confirmed) {
      cancelOrderAndGoBack();
    }
  };

  const cancelOrderAndGoBack = async () => {
    try {
      console.log("[CheckoutPage] Cancelando pedido ao voltar");
      
      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({
          cpf: bookOrder.cpf,
          livro: bookOrder.bookName,
          payment_id: paymentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Erro ao cancelar pedido:', errorData.error);
      }

      onBack();

    } catch (error: any) {
      console.error('[CheckoutPage] Erro ao cancelar pedido ao voltar:', error);
      onBack(); // Volta mesmo se houver erro no cancelamento
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: "Chave PIX copiada!",
      description: "Cole no seu aplicativo de pagamentos."
    });
  };

  useEffect(() => {
    generateRealPix();
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentStatus === 'pending' && paymentId) {
        navigator.sendBeacon(
          `https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/cancel-order`,
          JSON.stringify({
            cpf: bookOrder.cpf,
            livro: bookOrder.bookName,
            payment_id: paymentId
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 space-y-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6 md:mb-8 px-4">
          <div className="flex items-center space-x-2 md:space-x-4 bg-white/80 backdrop-blur-sm rounded-full px-3 md:px-6 py-2 md:py-3 shadow-lg border border-white/20 overflow-x-auto">
            <div className="flex items-center space-x-1 md:space-x-2 text-green-600 flex-shrink-0">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <span className="text-xs md:text-sm font-medium hidden sm:block">CPF</span>
            </div>
            <div className="w-4 md:w-8 h-0.5 bg-green-300 flex-shrink-0"></div>
            <div className="flex items-center space-x-1 md:space-x-2 text-green-600 flex-shrink-0">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <span className="text-xs md:text-sm font-medium hidden sm:block">Cadastro</span>
            </div>
            <div className="w-4 md:w-8 h-0.5 bg-green-300 flex-shrink-0"></div>
            <div className="flex items-center space-x-1 md:space-x-2 text-green-600 flex-shrink-0">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Book className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <span className="text-xs md:text-sm font-medium hidden sm:block">Livros</span>
            </div>
            <div className="w-4 md:w-8 h-0.5 bg-blue-300 flex-shrink-0"></div>
            <div className="flex items-center space-x-1 md:space-x-2 text-blue-600 flex-shrink-0">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <span className="text-xs md:text-sm font-medium hidden sm:block">Pagamento</span>
            </div>
          </div>
        </div>

        <Card className="glass border-0 shadow-2xl overflow-hidden animate-fade-in">
          <CardHeader className="gradient-primary text-white relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
            <div className="relative z-10 flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackWithConfirmation} 
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CreditCard className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-glow">
                    Checkout - Pagamento PIX
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-lg">
                    Finalize seu pedido com pagamento instantâneo e seguro
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 md:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
              {/* Order Summary */}
              <div className="space-y-4 md:space-y-6 animate-slide-in">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                    <Book className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">Resumo do Pedido</h3>
                </div>
                
                <div className="glass-dark p-4 md:p-8 rounded-2xl space-y-4 md:space-y-6 border border-white/20">
                  <div className="flex justify-between items-center py-2 md:py-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm md:text-base">Aluno:</span>
                    </div>
                    <span className="font-semibold text-gray-800 text-sm md:text-base text-right">{bookOrder.studentName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 md:py-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm md:text-base">CPF:</span>
                    </div>
                    <span className="font-semibold text-gray-800 font-mono text-sm md:text-base">{bookOrder.cpf}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 md:py-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <Book className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm md:text-base">Ciclo:</span>
                    </div>
                    <span className="font-semibold text-gray-800 text-sm md:text-base text-right">{bookOrder.cycle || "1º Ciclo Básico"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 md:py-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <Book className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm md:text-base">Livro:</span>
                    </div>
                    <span className="font-semibold text-gray-800 text-right max-w-xs text-sm md:text-base">{bookOrder.bookName}</span>
                  </div>
                  
                  <div className="gradient-success rounded-xl px-4 md:px-6 py-3 md:py-4 border border-green-200/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-800" />
                        <span className="text-lg md:text-xl font-bold text-green-800">Total:</span>
                      </div>
                      <span className="text-2xl md:text-3xl font-bold text-green-700">R$ {bookOrder.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIX Payment */}
              <div className="space-y-4 md:space-y-6 animate-slide-in" style={{animationDelay: '0.2s'}}>
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                    <QrCode className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">Pagamento PIX</h3>
                </div>
                
                {isGeneratingPix ? (
                  <div className="glass p-6 md:p-12 text-center rounded-2xl border border-white/20">
                    <div className="relative">
                      <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 md:mb-6"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="h-5 w-5 md:h-6 md:w-6 text-blue-600 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-blue-700 mb-2">Gerando chave PIX...</p>
                    <p className="text-sm md:text-base text-blue-600">Conectando com MercadoPago</p>
                  </div>
                ) : (
                  <div className="space-y-6 md:space-y-8">
                    {/* QR Code Section */}
                    <div className="glass text-center p-4 md:p-8 rounded-2xl border border-white/20">
                      {qrCodeData ? (
                        <div className="space-y-4 md:space-y-6">
                          <div className="relative inline-block">
                            <img
                              src={`data:image/png;base64,${qrCodeData}`}
                              alt="QR Code PIX"
                              className="w-48 h-48 md:w-64 md:h-64 mx-auto rounded-2xl border-4 border-white shadow-2xl hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="gradient-success p-4 rounded-xl border border-green-200/50">
                            <div className="flex items-center justify-center gap-2">
                              <Smartphone className="h-5 w-5 text-green-800" />
                              <p className="font-semibold text-green-800">
                                Escaneie com seu app de pagamentos
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-100 mx-auto rounded-2xl flex items-center justify-center border-4 border-gray-200">
                          <QrCode className="h-24 w-24 md:h-32 md:w-32 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* PIX Key Section */}
                    <div className="space-y-3 md:space-y-4">
                      <Label className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Copy className="h-4 w-4 md:h-5 md:w-5" />
                        Ou copie a chave PIX:
                      </Label>
                      <div className="flex gap-2 md:gap-3">
                        <Input
                          value={pixKey}
                          readOnly
                          className="text-xs md:text-sm font-mono bg-white/80 border-2 border-gray-200 rounded-xl px-3 md:px-4 py-2 md:py-3 focus:border-blue-400 transition-colors"
                        />
                        <Button
                          type="button"
                          onClick={copyPixKey}
                          className="btn-modern px-4 md:px-6 py-2 md:py-3 rounded-xl flex-shrink-0"
                        >
                          <Copy className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 md:space-y-4">
                      {paymentStatus === 'pending' && (
                        <div className="space-y-3 md:space-y-4">
                          <Button
                            onClick={verifyPaymentStatus}
                            className="w-full btn-modern bg-green-600 hover:bg-green-700 text-white py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            disabled={!paymentId}
                          >
                            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                            Verificar Pagamento
                          </Button>
                          
                          <Button
                            onClick={cancelPayment}
                            variant="outline"
                            className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold transition-all duration-300 hover:border-red-400"
                            disabled={isCancelling || !paymentId}
                          >
                            {isCancelling ? (
                              <>
                                <Loader2 className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 animate-spin" />
                                <span className="text-sm md:text-base">Cancelando...</span>
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                                <span className="text-sm md:text-base">Cancelar Pedido</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {paymentStatus === 'processing' && (
                        <div className="glass text-center p-6 md:p-8 rounded-2xl border border-blue-200/50">
                          <div className="relative">
                            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
                            <Clock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <p className="text-lg md:text-xl font-semibold text-blue-700 mb-2">Verificando pagamento...</p>
                          <p className="text-sm md:text-base text-blue-600">Aguarde alguns instantes</p>
                        </div>
                      )}

                      {paymentStatus === 'confirmed' && (
                        <div className="gradient-success text-center p-6 md:p-8 rounded-2xl border border-green-200/50 animate-fade-in">
                          <div className="relative">
                            <CheckCircle className="h-16 w-16 md:h-20 md:w-20 text-green-600 mx-auto mb-4 md:mb-6 animate-bounce" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-400/20 rounded-full animate-ping"></div>
                            </div>
                          </div>
                          <h4 className="text-xl md:text-2xl font-bold text-green-800 mb-3">
                            🎉 Pagamento Confirmado!
                          </h4>
                          <p className="text-green-700 font-medium text-base md:text-lg">
                            Seu livro será processado em breve. Você receberá uma confirmação via WhatsApp.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 md:mt-12 glass-dark p-4 md:p-8 rounded-2xl border border-white/20 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <Info className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-blue-900">Instruções para pagamento:</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-xl">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0">1</div>
                    <p className="text-blue-800 font-medium text-sm md:text-base">Abra seu aplicativo de pagamentos (Banco, PicPay, etc.)</p>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-xl">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0">2</div>
                    <p className="text-blue-800 font-medium text-sm md:text-base">Escolha a opção "PIX" e depois "Ler QR Code" ou "Colar código"</p>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-xl">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0">3</div>
                    <p className="text-blue-800 font-medium text-sm md:text-base">Escaneie o QR Code acima ou cole a chave PIX</p>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-xl">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0">4</div>
                    <p className="text-blue-800 font-medium text-sm md:text-base">Confirme o pagamento no valor de <span className="font-bold">R$ {bookOrder.price.toFixed(2)}</span></p>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-xl">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0">5</div>
                    <p className="text-blue-800 font-medium text-sm md:text-base">Após o pagamento, clique em "Verificar Pagamento"</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-green-50/80 rounded-xl border border-green-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <span className="font-semibold text-green-800 text-sm md:text-base">Pagamento Seguro</span>
                </div>
                <p className="text-green-700 text-xs md:text-sm">
                  Seus dados estão protegidos e o pagamento é processado pelo MercadoPago com total segurança.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;