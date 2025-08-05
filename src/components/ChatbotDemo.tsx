import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatbotDemo = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Olá! Bem-vindo(a) à EETAD!\n\nSou o assistente virtual da Escola de Educação Teológica das Assembleias de Deus. Como posso ajudá-lo hoje?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Gerar resposta usando IA
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      console.log('[ChatbotDemo] Enviando mensagem para IA:', userMessage);
      
      const response = await supabase.functions.invoke('ai-chatbot', {
        body: {
          message: userMessage,
          conversationHistory: messages.slice(-10) // Últimas 10 mensagens para contexto
        }
      });

      if (response.error) {
        console.error('[ChatbotDemo] Erro na função IA:', response.error);
        throw new Error(response.error.message);
      }

      const { data } = response;
      console.log('[ChatbotDemo] Resposta da IA:', data);
      
      return data.response || 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
    } catch (error) {
      console.error('[ChatbotDemo] Erro ao chamar IA:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com o assistente IA. Tente novamente.",
        variant: "destructive",
      });
      
      return 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente ou solicite atendimento humano.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Gerar resposta da IA
    try {
      const aiResponseText = await generateAIResponse(inputMessage);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="bg-green-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6" />
          <div>
            <CardTitle className="text-lg">Assistente Virtual EETAD</CardTitle>
            <CardDescription className="text-green-100">
              Sistema de Controle de Alunos - EETAD
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 p-4 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            💡 Agora com IA! Converse naturalmente - pergunte sobre cursos, pedidos, pagamentos ou qualquer dúvida sobre a EETAD
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotDemo;