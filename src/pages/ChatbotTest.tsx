import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatbotDemo from "@/components/ChatbotDemo";

const ChatbotTest = () => {
  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4 text-foreground hover:bg-white hover:bg-opacity-20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Assistente Virtual EETAD
            </h1>
            <p className="text-lg text-foreground opacity-90">
              Sistema de atendimento automatizado via WhatsApp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo do Chatbot */}
          <div>
            <ChatbotDemo />
          </div>

          {/* Informações sobre o sistema */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 Funcionalidades do Assistente
                </CardTitle>
                <CardDescription>
                  Sistema inteligente de atendimento automatizado via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <h4 className="font-semibold">Identificação Automática</h4>
                      <p className="text-sm text-gray-600">
                        Reconhece alunos pelo número de telefone e busca dados na planilha
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <h4 className="font-semibold">Consulta de Informações</h4>
                      <p className="text-sm text-gray-600">
                        Consulta dados do aluno, pedidos de livros e informações do curso
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <h4 className="font-semibold">Suporte Inteligente</h4>
                      <p className="text-sm text-gray-600">
                        Responde dúvidas sobre ciclos, modalidades e procedimentos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <h4 className="font-semibold">Atendimento 24/7</h4>
                      <p className="text-sm text-gray-600">
                        Disponível a qualquer hora para atender os alunos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📚 Como Usar o Assistente
                </CardTitle>
                <CardDescription>
                  Instruções para interagir com o assistente virtual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">1. Identificação</h4>
                    <p className="text-gray-600">
                      Informe seu CPF quando solicitado pelo assistente
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">2. Consultas</h4>
                    <p className="text-gray-600">
                      Pergunte sobre seus pedidos, pagamentos ou informações do curso
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">3. Dúvidas</h4>
                    <p className="text-gray-600">
                      Tire dúvidas sobre procedimentos, ciclos e subnúcleos
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">4. Atendimento Humano</h4>
                    <p className="text-gray-600">
                      Solicite falar com um atendente quando necessário
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTest;