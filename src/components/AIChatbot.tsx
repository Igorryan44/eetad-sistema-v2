import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useAIChatbot } from '@/services/aiChatbotService';
import { toast } from '@/hooks/use-toast';

interface AIChatbotProps {
  userId?: string;
  studentData?: any;
  className?: string;
}

const AIChatbot = ({ userId = 'guest', studentData, className = '' }: AIChatbotProps) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    messages, 
    loading, 
    error, 
    agentName, 
    sendMessage, 
    clearChat 
  } = useAIChatbot(userId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const messageToSend = message;
    setMessage('');

    try {
      await sendMessage(messageToSend, studentData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChat();
      toast({
        title: "Conversa limpa",
        description: "O histórico da conversa foi apagado."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao limpar conversa.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="w-96 h-[500px] shadow-2xl border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              {agentName}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
                title="Fechar"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col h-[420px]">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <div className="flex justify-center items-center mb-4">
                  <Bot className="h-12 w-12 text-green-500 animate-pulse" />
                  <span className="text-2xl ml-2">😊</span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Olá! Sou o {agentName}. É um prazer te conhecer! ❤️
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  Como posso te abençoar hoje? Aqui estão algumas sugestões carinhosas:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => sendMessage("Olá! Como funciona a EETAD?")}
                    className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 p-3 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
                  >
                    🏢 Olá! Como funciona nossa querida EETAD?
                  </button>
                  <button
                    onClick={() => sendMessage("Quais cursos estão disponíveis?")}
                    className="block w-full text-left text-sm text-green-600 hover:text-green-800 p-3 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-300 transition-all"
                  >
                    📚 Quais cursos abençoados temos disponíveis?
                  </button>
                  <button
                    onClick={() => sendMessage("Como faço para me matricular?")}
                    className="block w-full text-left text-sm text-purple-600 hover:text-purple-800 p-3 hover:bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-all"
                  >
                    📝 Como posso me matricular com vocês?
                  </button>
                  <button
                    onClick={() => sendMessage("Preciso de ajuda com livros")}
                    className="block w-full text-left text-sm text-orange-600 hover:text-orange-800 p-3 hover:bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-all"
                  >
                    📖 Preciso de uma ajudinha com os livros
                  </button>
                  <button
                    onClick={() => sendMessage("Tenho dúvidas sobre pagamentos")}
                    className="block w-full text-left text-sm text-indigo-600 hover:text-indigo-800 p-3 hover:bg-indigo-50 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-all"
                  >
                    💰 Tenho dúvidas sobre pagamentos
                  </button>
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 mb-4 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[280px] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-green-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span className="text-sm text-gray-600">Pensando em como te ajudar melhor... 🙏💭</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {error && (
              <div className="mt-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatbot;