import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Student, BookOrder } from "@/pages/Index";
import { 
  ArrowLeft, 
  Book, 
  ShoppingCart, 
  GraduationCap, 
  User, 
  FileText,
  DollarSign,
  Loader2,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BookOrderFormProps {
  student: Student;
  onBookOrderComplete: (bookOrder: BookOrder) => void;
  onBack: () => void;
}

const BookOrderForm = ({ student, onBookOrderComplete, onBack }: BookOrderFormProps) => {
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("1"); // Pré-preenchido com 1º Ciclo
  const [isLoading, setIsLoading] = useState(false);
  const [observacao, setObservacao] = useState("Novo Pedido");

  // Livros organizados por ciclo
  const booksByCycle = {
    "1": [
      { id: "bibliologia-i", name: "Bibliologia I", price: 45.00 },
      { id: "historia-geografia-biblica", name: "História e Geografia Bíblica", price: 45.00 },
      { id: "evangelhos", name: "Evangelhos", price: 45.00 },
      { id: "doutrinas-fundamentais", name: "Doutrinas Fundamentais da Fé Cristã", price: 45.00 },
      { id: "atos-apostolos", name: "Atos dos Apóstolos", price: 45.00 },
      { id: "epistolas-paulinas-i", name: "Epístolas Paulinas I", price: 45.00 },
      { id: "epistolas-gerais", name: "Epístolas Gerais", price: 45.00 },
      { id: "pentateuco", name: "Pentateuco", price: 45.00 },
      { id: "epistolas-paulinas-ii", name: "Epístolas Paulinas II", price: 45.00 },
      { id: "epistolas-paulinas-iii", name: "Epístolas Paulinas III", price: 45.00 },
      { id: "livros-historicos", name: "Livros Históricos", price: 45.00 },
      { id: "profetas-maiores", name: "Profetas Maiores", price: 45.00 },
      { id: "profetas-menores", name: "Profetas Menores", price: 45.00 },
      { id: "livros-poeticos", name: "Livros Poéticos", price: 45.00 },
      { id: "daniel-apocalipse", name: "Daniel e Apocalipse", price: 45.00 }
    ],
    "2": [
      { id: "seitas-heresias", name: "Seitas e Heresias", price: 45.00 },
      { id: "religioes-mundiais", name: "Religiões Mundiais", price: 45.00 },
      { id: "lideranca-crista", name: "Liderança Cristã", price: 45.00 },
      { id: "evang-missoes", name: "Evang. e Missões", price: 45.00 },
      { id: "cristologia", name: "Cristologia", price: 45.00 },
      { id: "pneumatologia", name: "Pneumatologia", price: 45.00 },
      { id: "hermeneutica-biblica-i", name: "Hermenêutica Bíblica I", price: 45.00 },
      { id: "escatologia-biblica", name: "Escatologia Bíblica", price: 45.00 },
      { id: "doutrina-salvacao-i", name: "Doutrina da Salvação I", price: 45.00 },
      { id: "doutrina-deus", name: "Doutrina de Deus", price: 45.00 },
      { id: "educacao-crista", name: "Educação Cristã", price: 45.00 },
      { id: "doutrinas-homem-pecado", name: "As Doutrinas do Homem e do Pecado", price: 45.00 },
      { id: "etica-crista", name: "Ética Cristã", price: 45.00 },
      { id: "historia-igreja", name: "História da Igreja", price: 45.00 },
      { id: "familia-crista", name: "Família Cristã", price: 45.00 },
      { id: "homiletica", name: "Homilética", price: 45.00 }
    ],
    "3": [
      { id: "identidade-teologica", name: "Identidade Teológica", price: 45.00 },
      { id: "doutrina-salvacao-ii", name: "Doutrina da Salvação II", price: 45.00 },
      { id: "oratoria-crista", name: "Oratória Cristã", price: 45.00 },
      { id: "teologia-antigo-testamento", name: "Teologia do Antigo Testamento", price: 45.00 },
      { id: "teologia-novo-testamento", name: "Teologia do Novo Testamento", price: 45.00 },
      { id: "apologetica", name: "Apologética", price: 45.00 },
      { id: "relacionamento-cristao", name: "Relacionamento Cristão", price: 45.00 },
      { id: "liturgias-igreja-crista", name: "Liturgias da Igreja Cristã", price: 45.00 },
      { id: "portugues-tecnicas-redacao", name: "Português & Técnicas de Redação", price: 45.00 },
      { id: "didatica-geral", name: "Didática Geral", price: 45.00 },
      { id: "hermeneutica-biblica-ii", name: "Hermenêutica Bíblica II", price: 45.00 },
      { id: "cosmogonia-biblica", name: "Cosmogonia Bíblica", price: 45.00 },
      { id: "grego-novo-testamento", name: "Grego do Novo Testamento", price: 45.00 },
      { id: "bibliologia-ii", name: "Bibliologia II", price: 45.00 }
    ]
  };

  const cycleNames = {
    "1": "1º Ciclo Básico",
    "2": "2º Ciclo Médio", 
    "3": "3º Ciclo Avançado"
  };

  const availableBooks = selectedCycle ? booksByCycle[selectedCycle as keyof typeof booksByCycle] || [] : [];
  const selectedBookData = availableBooks.find(book => book.id === selectedBook);

  // Busca para verificar pedidos duplicados usando Supabase SDK com logs
  const checkForDuplicateOrder = async () => {
    try {
      console.log("[BookOrderForm] Checando duplicidade para:", {
        cpf: student.cpf,
        livro: selectedBookData?.name,
        observacao
      });
      const { data, error } = await supabase.functions.invoke("get-book-orders-by-cpf-book-observacao", {
        body: {
          cpf: student.cpf,
          livro: selectedBookData?.name,
          observacao
        }
      });
      if (error) {
        console.error("[BookOrderForm] Erro em get-book-orders-by-cpf-book-observacao:", error);
        toast({
          title: "Atenção",
          description: "Falha ao consultar pedidos duplicados. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }
      console.log("[BookOrderForm] Resultado duplicidade:", data);
      return Array.isArray(data) && data.length > 0;
    } catch (e) {
      console.error("[BookOrderForm] Erro inesperado ao checar duplicidade:", e);
      toast({
        title: "Atenção",
        description: "Erro inesperado ao consultar duplicidade.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBook) {
      toast({
        title: "Selecione um livro",
        description: "Por favor, escolha um livro para continuar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("[BookOrderForm] Submetendo pedido, dados do aluno:", student);

      // 1. Verificar duplicidade antes de registrar o pedido
      const hasDuplicate = await checkForDuplicateOrder();
      if (hasDuplicate) {
        toast({
          title: "Pedido já realizado!",
          description: "Já existe um pedido com esse CPF, livro e observação.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const bookOrder: BookOrder = {
        studentName: student.nome,
        cpf: student.cpf,
        email: student.email,
        bookName: selectedBookData!.name,
        price: selectedBookData!.price,
        cycle: cycleNames[selectedCycle as keyof typeof cycleNames]
      };

      // Salvar pedido no Google Sheets via Edge Function
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', 'T');
      const cpfClean = student.cpf.replace(/[.-]/g, ''); // Remove pontos e hífens do CPF
      const externalReference = `${cpfClean}-${timestamp}`;
      
      const orderData = {
        external_reference: externalReference,
        cpf: cpfClean, // CPF limpo sem formatação
        nome_do_aluno: student.nome,
        ciclo: cycleNames[selectedCycle as keyof typeof cycleNames],
        livro: selectedBookData!.name,
        data_pedido: new Date().toLocaleString('pt-BR'),
        observacao,
        status_pedido: 'Pendente'
      };
      
      console.log("[BookOrderForm] Enviando orderData para save-book-order:", orderData);

      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/save-book-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error('Erro ao salvar pedido: ' + (data?.error || 'Erro desconhecido'));
      }

      // Notificação via Supabase edge function
      const notifResp = await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          type: 'book_order',
          studentData: {
            nome: student.nome,
            cpf: student.cpf,
            email: student.email,
            livro: selectedBookData!.name,
            ciclo: cycleNames[selectedCycle as keyof typeof cycleNames],
            preco: selectedBookData!.price
          }
        }
      });

      if (notifResp.error) {
        console.error("[BookOrderForm] Erro ao enviar notificação WhatsApp:", notifResp.error);
      } else {
        console.log("[BookOrderForm] Notificação WhatsApp enviada com sucesso");
      }

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você será redirecionado para o pagamento."
      });

      onBookOrderComplete(bookOrder);

    } catch (error) {
      console.error("[BookOrderForm] Erro ao processar pedido:", error);
      toast({
        title: "Erro ao processar pedido",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Efeito de brilho de fundo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
      
      <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
          <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Pedido de Livros</CardTitle>
                  <CardDescription className="text-emerald-100 text-lg">
                    Escolha o livro que deseja adquirir
                  </CardDescription>
                </div>
              </div>
            </div>
            
            {/* Informações do estudante */}
            <div className="flex items-center gap-4 text-sm text-emerald-100 bg-white/10 rounded-lg p-3">
              <User className="h-4 w-4" />
              <span className="font-medium">{student.nome}</span>
              <span>•</span>
              <span>CPF: {student.cpf}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Seleção de Ciclo */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Selecione o Ciclo</h3>
              </div>
              
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  Ciclo de Estudo
                </Label>
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-sm md:text-base">
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Ciclo Básico</SelectItem>
                    <SelectItem value="2">2º Ciclo Médio</SelectItem>
                    <SelectItem value="3">3º Ciclo Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seleção de Livro */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Book className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Escolha o Livro</h3>
              </div>
              
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Book className="h-4 w-4 text-green-600" />
                  Livro Disponível
                </Label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-green-500 rounded-xl text-sm md:text-base">
                    <SelectValue placeholder="Selecione um livro" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.name} - R$ {book.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resumo do livro selecionado */}
              {selectedBookData && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 md:p-6 rounded-xl border-l-4 border-green-400 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Book className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base md:text-lg text-gray-800">{selectedBookData.name}</h4>
                        <p className="text-sm md:text-base text-gray-600">{cycleNames[selectedCycle as keyof typeof cycleNames]}</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-green-600">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                        R$ {selectedBookData.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Observação */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Observação</h3>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="observacao" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  Observação do Pedido
                </Label>
                <Input
                  id="observacao"
                  placeholder="Observação sobre o pedido"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="h-10 md:h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-sm md:text-base"
                />
              </div>
            </div>

            {/* Botão de Submissão */}
            <div className="flex justify-center pt-6 md:pt-8">
              <Button 
                type="submit" 
                disabled={isLoading || !selectedBook}
                className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    Processando Pedido...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                    Confirmar Pedido
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookOrderForm;