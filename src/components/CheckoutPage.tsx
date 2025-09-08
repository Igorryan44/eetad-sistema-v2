import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { BookOrder } from "@/pages/Index";
import { apiRequest } from "@/services/api";
import { 
  CheckCircle, 
  Book, 
  Info, 
  User, 
  FileText, 
  DollarSign,
  Loader2,
  Hash,
  ArrowLeft,
  QrCode,
  Smartphone,
  RefreshCw,
  X,
  Copy,
  Clock
} from "lucide-react";

interface CheckoutPageProps {
  bookOrder: BookOrder;
  onBack: () => void;
  onPaymentComplete?: () => void;
}

const CheckoutPage = ({ bookOrder, onBack, onPaymentComplete }: CheckoutPageProps) => {
  const [pixKey, setPixKey] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled'>('pending');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [paymentId, setPaymentId] = useState<string>("");
  const [identificadorUnico, setIdentificadorUnico] = useState<string>("");
  const [pixError, setPixError] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressValue, setProgressValue] = useState(25);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Verificação de segurança para bookOrder
  if (!bookOrder || !bookOrder.studentName || !bookOrder.cpf || !bookOrder.bookName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro: Dados do pedido não encontrados</h2>
          <p className="text-gray-600 mb-4">Por favor, volte e tente novamente.</p>
          <Button onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }


  const generateRealPix = async () => {
    if (pixGenerated) return;
    
    setIsGeneratingPix(true);
    setPixError("");
    
    try {
      const data = await apiRequest('/functions/generate-pix-with-tracking', {
        method: 'POST',
        body: JSON.stringify({
          nome: bookOrder.studentName || '',
          cpf: bookOrder.cpf || '',
          valor: bookOrder.price || 45
        })
      });
      
      if (data.success) {
        setPixKey(data.pix_code);
        // Garantir que o QR code tenha o prefixo data:image correto
        const qrCodeFormatted = data.qr_code_base64.startsWith('data:image/') 
          ? data.qr_code_base64 
          : `data:image/png;base64,${data.qr_code_base64}`;
        setQrCodeUrl(qrCodeFormatted);
        setPaymentId(data.tracking_id);
        setIdentificadorUnico(data.tracking_id);
        setPixGenerated(true);
        setPaymentStatus('pending');
        
        console.log('✅ PIX gerado com sucesso:', data.tracking_id);
        
        toast({
          title: "PIX gerado com sucesso!",
          description: "Escaneie o QR Code ou copie a chave PIX para realizar o pagamento.",
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PIX';
      setPixError(errorMessage);
      toast({
        title: "Erro ao gerar PIX",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const regeneratePix = async () => {
    setIsRegenerating(true);
    setPixError("");
    
    try {
      const data = await apiRequest('/functions/generate-pix-with-tracking', {
        method: 'POST',
        body: JSON.stringify({
          nome: bookOrder.studentName || '',
          cpf: bookOrder.cpf || '',
          valor: bookOrder.price || 45
        })
      });
      
      if (data.success) {
        // Atualizar com os novos dados únicos
        setPixKey(data.pix_code);
        // Garantir que o QR code tenha o prefixo data:image correto
        const qrCodeFormatted = data.qr_code_base64.startsWith('data:image/') 
          ? data.qr_code_base64 
          : `data:image/png;base64,${data.qr_code_base64}`;
        setQrCodeUrl(qrCodeFormatted);
        setPaymentId(data.tracking_id);
        setIdentificadorUnico(data.tracking_id);
        
        console.log('✅ PIX regenerado com sucesso:', data.tracking_id);
        
        toast({
          title: "PIX regenerado com sucesso!",
          description: "Novo QR Code e chave PIX únicos gerados.",
        });
      } else {
        throw new Error(data.error || 'Erro ao regenerar PIX');
      }
    } catch (error) {
      console.error('❌ Erro ao regenerar PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao regenerar PIX';
      setPixError(errorMessage);
      toast({
        title: "Erro ao regenerar PIX",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };



  const cancelPayment = async () => {
    if (!paymentId) return;
    
    try {
      const data = await apiRequest('/functions/cancel-order', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: paymentId
        })
      });
      
      if (data.success) {
        setPaymentStatus('cancelled');
        
        toast({
          title: "Pagamento cancelado",
          description: "O pagamento foi cancelado com sucesso.",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: "Chave PIX copiada!",
      description: "A chave PIX foi copiada para a área de transferência.",
    });
  };

  // Função para confirmar pagamento PIX estático
  const confirmPayment = async () => {
    if (!identificadorUnico) {
      toast({
        title: "Erro",
        description: "Nenhum PIX gerado para confirmar.",
        variant: "destructive"
      });
      return;
    }

    setIsConfirmingPayment(true);

    try {
      console.log('💳 Confirmando pagamento com ID:', identificadorUnico);
      
      const result = await apiRequest('/functions/confirm-pix-by-id', {
        method: 'POST',
        body: JSON.stringify({
          identificador: identificadorUnico,
          valor_pago: bookOrder.price || 45,
          data_pagamento: new Date().toLocaleString('pt-BR'),
          observacoes: 'Pagamento confirmado manualmente via frontend'
        })
      });

      if (result.success) {
        setPaymentStatus('approved');
        console.log('✅ Pagamento confirmado com sucesso:', result);
        
        toast({
          title: "Pagamento Confirmado!",
          description: "O pagamento foi confirmado com sucesso. Redirecionando...",
        });

        // Wait 2 seconds to show success message, then redirect to CPF screen
        setTimeout(() => {
          if (onPaymentComplete) {
            onPaymentComplete();
          }
        }, 3000); // Increased to 3 seconds for better UX
      } else {
        throw new Error(result.error || 'Erro ao confirmar pagamento');
      }
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro na confirmação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConfirmingPayment(false);
    }
  };







  useEffect(() => {
    if (!pixGenerated) {
      generateRealPix();
    }
  }, [pixGenerated]);

  // Atualizar progresso baseado no status
  useEffect(() => {
    if (!pixGenerated) {
      setCurrentStep(1);
      setProgressValue(25);
    } else if (pixGenerated && paymentStatus === 'pending') {
      setCurrentStep(2);
      setProgressValue(50);
    } else if (paymentStatus === 'processing') {
      setCurrentStep(3);
      setProgressValue(75);
    } else if (paymentStatus === 'approved') {
      setCurrentStep(4);
      setProgressValue(100);
    }
  }, [pixGenerated, paymentStatus]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Cleanup se necessário quando a página for recarregada
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [paymentStatus, paymentId]);



  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      case 'processing': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'approved': return 'Pagamento Aprovado';
      case 'rejected': return 'Pagamento Rejeitado';
      case 'cancelled': return 'Pagamento Cancelado';
      case 'processing': return 'Processando Pagamento';
      default: return 'Aguardando Pagamento';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 flex flex-col container mx-auto px-4 py-6 min-h-screen">
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Finalizar Pedido</h1>
            <p className="text-gray-600 text-xs mt-0.5">Complete seu pagamento via PIX</p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className={`text-xs font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>Dados</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-xs font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>PIX Gerado</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className={`text-xs font-medium ${
                currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'
              }`}>Processando</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 4 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep >= 4 ? <CheckCircle className="h-3 w-3" /> : '4'}
              </div>
              <span className={`text-xs font-medium ${
                currentStep >= 4 ? 'text-green-600' : 'text-gray-500'
              }`}>Concluído</span>
            </div>
          </div>
          
          <Progress value={progressValue} className="h-1.5" />
        </div>

        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6 flex flex-col h-full">
              <Card className="glass border-white/20 shadow-2xl flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-800 font-bold">Resumo do Pedido</CardTitle>
                      <CardDescription className="text-base text-gray-600 mt-1">Confira os detalhes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="glass-dark p-6 rounded-2xl space-y-4 border border-white/20">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-gray-500" />
                        <span className="text-lg text-gray-600 font-medium">Nome:</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-800">{bookOrder.studentName || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <div className="flex items-center gap-3">
                        <Hash className="h-6 w-6 text-gray-500" />
                        <span className="text-lg text-gray-600 font-medium">CPF:</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-800">{bookOrder.cpf || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-gray-500" />
                        <span className="text-lg text-gray-600 font-medium">Ciclo:</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-800">{bookOrder.cycle || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3">
                      <div className="flex items-center gap-3">
                        <Book className="h-6 w-6 text-gray-500" />
                        <span className="text-lg text-gray-600 font-medium">Livro:</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-800">{bookOrder.bookName || 'N/A'}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-8 w-8 text-green-600" />
                          <span className="text-2xl font-bold text-gray-800">Total:</span>
                        </div>
                        <span className="text-3xl font-bold text-green-600">
                          R$ {(bookOrder.price || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

            <div className="space-y-6 flex flex-col h-full">
              <Card className="glass border-white/20 shadow-2xl flex-1 min-h-0 transform hover:scale-105 transition-transform duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <QrCode className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-gray-800 font-bold">Pagamento PIX</CardTitle>
                      <CardDescription className="text-base text-gray-600 mt-1">Escaneie o QR Code ou copie a chave</CardDescription>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-base font-medium ${getStatusColor()} bg-white/50`}>
                      {getStatusText()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                {isGeneratingPix && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-gray-600 text-center text-lg font-medium">Gerando PIX...</p>
                  </div>
                )}

                {pixError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 text-red-800">
                      <X className="h-6 w-6" />
                      <span className="font-medium text-lg">Erro ao gerar PIX</span>
                    </div>
                    <p className="text-red-700 text-base mt-2">{pixError}</p>
                    <Button 
                      onClick={generateRealPix} 
                      className="mt-4 bg-red-600 hover:bg-red-700 text-lg px-6 py-3"
                      size="lg"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {pixGenerated && qrCodeUrl && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code PIX" 
                          className="w-48 h-48"
                        />
                      </div>
                      
                      <div className="flex gap-4 flex-wrap justify-center">
                        <Button 
                          onClick={regeneratePix}
                          variant="default"
                          size="lg"
                          disabled={isRegenerating}
                          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl text-base"
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-5 w-5" />
                          )}
                          Regenerar PIX
                        </Button>
                        
                        <Button 
                          onClick={cancelPayment}
                          variant="outline"
                          size="lg"
                          className="flex items-center gap-3 text-red-600 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 font-medium px-6 py-3 rounded-xl text-base"
                        >
                          <X className="h-5 w-5" />
                          Cancelar Pedido
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <Label className="text-base font-medium text-gray-700 mb-2 block">Chave PIX (Copia e Cola)</Label>
                        <div className="flex gap-3">
                          <Input 
                            value={pixKey} 
                            readOnly 
                            className="font-mono text-base bg-white h-12"
                          />
                          <Button 
                            onClick={copyPixKey}
                            size="lg"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-4 text-base"
                          >
                            <Copy className="h-5 w-5" />
                            Copiar
                          </Button>
                        </div>
                      </div>

                      {paymentStatus === 'pending' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center gap-3 text-blue-800 mb-2">
                            <Clock className="h-6 w-6" />
                            <span className="text-lg font-medium">Aguardando Pagamento</span>
                          </div>
                          <p className="text-blue-700 text-base mb-2">
                            Estamos verificando automaticamente o status do seu pagamento.
                          </p>
                          <div className="flex items-center gap-3 text-blue-600 text-base">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Verificando...</span>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'approved' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-3 text-green-800 mb-2">
                            <CheckCircle className="h-6 w-6" />
                            <span className="text-lg font-medium">Pagamento Confirmado!</span>
                          </div>
                          <p className="text-green-700 text-base mb-3">
                            Seu pagamento foi aprovado com sucesso. Redirecionando para nova consulta...
                          </p>
                          <div className="flex items-center gap-2 text-green-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Redirecionando em 3 segundos...</span>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-center gap-3 text-red-800 mb-2">
                            <X className="h-6 w-6" />
                            <span className="text-lg font-medium">Pagamento Rejeitado</span>
                          </div>
                          <p className="text-red-700 text-base mb-3">
                            O pagamento foi rejeitado. Tente novamente.
                          </p>
                          <Button 
                            onClick={regeneratePix}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-base px-4 py-2"
                          >
                            Gerar Novo PIX
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

              <Card className="glass border-white/20 shadow-2xl flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Info className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-800 font-bold">Instruções</CardTitle>
                      <CardDescription className="text-base text-gray-600 mt-1">Como pagar via PIX</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-base text-gray-600">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-base mt-1">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-lg">Abra seu app bancário</p>
                        <p className="text-gray-600 text-base">Acesse a área PIX</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-base mt-1">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-lg">Escaneie o QR Code</p>
                        <p className="text-gray-600 text-base">Ou copie a chave PIX</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-base mt-1">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-lg">Confirme o pagamento</p>
                        <p className="text-gray-600 text-base">Clique em "Confirmar Pagamento" abaixo</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-3 text-yellow-800 mb-2">
                      <Smartphone className="h-6 w-6" />
                      <span className="font-medium text-lg">Dica Importante</span>
                    </div>
                    <p className="text-yellow-700 text-base">
                      Após realizar o PIX, clique em "Confirmar Pagamento".
                    </p>
                  </div>
                
                  {/* Botão de confirmação de pagamento */}
                  {pixGenerated && paymentStatus === 'pending' && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-1.5 text-green-800 mb-1">
                        <CheckCircle className="h-3 w-3" />
                        <span className="font-medium text-xs">Confirmar Pagamento</span>
                      </div>
                      <p className="text-green-700 text-xs mb-2">
                        Após realizar o PIX, clique no botão abaixo:
                      </p>
                      
                      {isConfirmingPayment && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Loader2 className="h-3 w-3 animate-spin text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Confirmando...</span>
                          </div>
                          <Progress value={75} className="h-1 bg-green-100" />
                        </div>
                      )}
                      
                      <Button
                        onClick={confirmPayment}
                        disabled={isConfirmingPayment}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {isConfirmingPayment ? (
                          <>
                            <Loader2 className="h-6 w-6 animate-spin mr-3" />
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-6 w-6 mr-3" />
                            Confirmar Pagamento
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;