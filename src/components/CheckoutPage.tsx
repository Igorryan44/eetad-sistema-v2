import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { BookOrder } from "@/pages/Index";
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
}

const CheckoutPage = ({ bookOrder, onBack }: CheckoutPageProps) => {
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

  const generateRealPix = async () => {
    if (pixGenerated) return;
    
    setIsGeneratingPix(true);
    setPixError("");
    
    try {
      const response = await fetch('http://localhost:3003/functions/generate-pix-with-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: bookOrder.studentName || '',
          cpf: bookOrder.cpf || '',
          valor: bookOrder.price || 45
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar PIX');
      }

      const data = await response.json();
      
      if (data.success) {
        setPixKey(data.pix_code);
        setQrCodeUrl(data.qr_code_base64);
        setPaymentId(data.tracking_id);
        setIdentificadorUnico(data.tracking_id);
        setPixGenerated(true);
        setPaymentStatus('pending');
        
        // PIX gerado com sucesso
        
        toast({
          title: "PIX gerado com sucesso!",
          description: "Escaneie o QR Code ou copie a chave PIX para realizar o pagamento.",
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
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
      // Usar a mesma função que gera PIX com identificador único
      const response = await fetch('http://localhost:3003/functions/generate-pix-with-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: bookOrder.studentName || '',
          cpf: bookOrder.cpf || '',
          valor: bookOrder.price || 45
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao regenerar PIX');
      }

      const data = await response.json();
      
      if (data.success) {
        // Atualizar com os novos dados únicos
        setPixKey(data.pix_code);
        setQrCodeUrl(data.qr_code_base64);
        setPaymentId(data.tracking_id);
        setIdentificadorUnico(data.tracking_id);
        
        // PIX regenerado com sucesso
        
        toast({
          title: "PIX regenerado com sucesso!",
          description: "Novo QR Code e chave PIX únicos gerados.",
        });
      } else {
        throw new Error(data.error || 'Erro ao regenerar PIX');
      }
    } catch (error) {
      console.error('Erro ao regenerar PIX:', error);
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
      const response = await fetch('http://localhost:3003/functions/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentId
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar pagamento');
      }

      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus('cancelled');
        
        toast({
          title: "Pagamento cancelado",
          description: "O pagamento foi cancelado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
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
      const response = await fetch('http://localhost:3003/functions/confirm-pix-by-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identificador: identificadorUnico,
          valor_pago: bookOrder.price || 45,
          data_pagamento: new Date().toLocaleString('pt-BR'),
          observacoes: 'Pagamento confirmado manualmente'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentStatus('approved');
        toast({
          title: "Pagamento Confirmado!",
          description: "O pagamento foi confirmado com sucesso.",
        });

      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao confirmar pagamento');
      }
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      toast({
        title: "Erro na confirmação",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center gap-4 mb-4">
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Finalizar Pedido</h1>
            <p className="text-gray-600 text-sm mt-1">Complete seu pagamento via PIX</p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>Dados</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>PIX Gerado</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'
              }`}>Processando</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 4 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep >= 4 ? <CheckCircle className="h-4 w-4" /> : '4'}
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 4 ? 'text-green-600' : 'text-gray-500'
              }`}>Concluído</span>
            </div>
          </div>
          
          <Progress value={progressValue} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4">
            <Card className="glass border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-800">Resumo do Pedido</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Confira os detalhes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="glass-dark p-3 md:p-4 rounded-xl space-y-3 border border-white/20">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">Nome:</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{bookOrder.studentName || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">CPF:</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{bookOrder.cpf || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">Ciclo:</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{bookOrder.cycle || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <Book className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">Livro:</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{bookOrder.bookName || 'N/A'}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-base font-bold text-gray-800">Total:</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        R$ {(bookOrder.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="glass border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <QrCode className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-800">Pagamento PIX</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Escaneie o QR Code ou copie a chave</CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} bg-white/50`}>
                    {getStatusText()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGeneratingPix && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600 text-center">Gerando PIX...</p>
                  </div>
                )}

                {pixError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Erro ao gerar PIX</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{pixError}</p>
                    <Button 
                      onClick={generateRealPix} 
                      className="mt-3 bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {pixGenerated && qrCodeUrl && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code PIX" 
                          className="w-40 h-40 md:w-44 md:h-44"
                        />
                      </div>
                      
                      <div className="flex gap-2 flex-wrap justify-center">
                        <Button 
                          onClick={regeneratePix}
                          variant="default"
                          size="sm"
                          disabled={isRegenerating}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Regenerar PIX
                        </Button>
                        
                        <Button 
                          onClick={cancelPayment}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <X className="h-4 w-4" />
                          Cancelar Pedido
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Chave PIX (Copia e Cola)</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={pixKey} 
                            readOnly 
                            className="font-mono text-xs bg-white h-8"
                          />
                          <Button 
                            onClick={copyPixKey}
                            size="sm"
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 h-8 px-3"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar
                          </Button>
                        </div>
                      </div>

                      {paymentStatus === 'pending' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-800 mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm font-medium">Aguardando Pagamento</span>
                          </div>
                          <p className="text-blue-700 text-xs mb-2">
                            Estamos verificando automaticamente o status do seu pagamento. 
                            Você será notificado assim que o pagamento for confirmado.
                          </p>
                          <div className="flex items-center gap-2 text-blue-600 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Verificando a cada 5 segundos...</span>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'approved' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-800 mb-1">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Pagamento Confirmado!</span>
                          </div>
                          <p className="text-green-700 text-xs">
                            Seu pagamento foi aprovado com sucesso. Você receberá uma confirmação por email em breve.
                          </p>
                        </div>
                      )}

                      {paymentStatus === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-800 mb-1">
                            <X className="h-4 w-4" />
                            <span className="text-sm font-medium">Pagamento Rejeitado</span>
                          </div>
                          <p className="text-red-700 text-xs mb-2">
                            O pagamento foi rejeitado. Tente novamente ou entre em contato conosco.
                          </p>
                          <Button 
                            onClick={regeneratePix}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
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

            <Card className="glass border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Info className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-800">Instruções de Pagamento</CardTitle>
                    <CardDescription className="text-gray-600">Como realizar o pagamento PIX</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Abra seu app bancário</p>
                      <p className="text-gray-600">Acesse a área PIX do seu banco ou carteira digital</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Escaneie o QR Code ou copie a chave</p>
                      <p className="text-gray-600">Use a câmera para ler o QR Code ou cole a chave PIX</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Confirme o pagamento</p>
                      <p className="text-gray-600">Verifique os dados e confirme a transação</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Confirme o pagamento</p>
                      <p className="text-gray-600">Após realizar o PIX, clique no botão "Confirmar Pagamento" abaixo</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium text-sm">Dica Importante</span>
                  </div>
                  <p className="text-yellow-700 text-xs">
                    Após realizar o pagamento PIX, clique no botão "Confirmar Pagamento" para finalizar o processo.
                  </p>
                </div>
                
                {/* Botão de confirmação de pagamento */}
                {pixGenerated && paymentStatus === 'pending' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Confirmar Pagamento</span>
                    </div>
                    <p className="text-green-700 text-xs mb-3">
                      Após realizar o pagamento PIX, clique no botão abaixo para confirmar:
                    </p>
                    
                    {isConfirmingPayment && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Confirmando Pagamento...</span>
                        </div>
                        <Progress value={75} className="h-2 bg-green-100">
                          <div className="h-full bg-green-500 transition-all duration-300 ease-in-out" style={{width: '75%'}} />
                        </Progress>
                      </div>
                    )}
                    
                    <Button
                      onClick={confirmPayment}
                      disabled={isConfirmingPayment}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {isConfirmingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
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
  );
};

export default CheckoutPage;