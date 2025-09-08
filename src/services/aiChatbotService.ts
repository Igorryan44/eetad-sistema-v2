import { useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  agentName: string;
  conversationId: string;
  timestamp: string;
  error?: string;
}

interface ConversationContext {
  userId: string;
  messages: ChatMessage[];
  studentData: any;
  lastInteraction: string;
  sessionStart: string;
  preferences: any;
}

interface UseAIChatbotReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  agentName: string;
  sendMessage: (message: string, studentData?: any) => Promise<void>;
  clearChat: () => Promise<void>;
  getContext: () => Promise<ConversationContext | null>;
}

const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003';

// Detectar se está em produção
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1' &&
                     !window.location.hostname.includes('local');

// Simular resposta de IA para produção
const generateMockResponse = (message: string, userId: string): ChatResponse => {
  const responses = [
    'Olá! Sou o assistente da EETAD. Como posso te ajudar hoje?',
    'Para informações sobre matrículas, entre em contato com nossa secretaria pelo telefone (63) 3221-1234.',
    'Nossa escola oferece 3 ciclos de formação teológica. Qual ciclo te interessa?',
    'Para mais informações detalhadas, recomendo conversar com nossa equipe. Estamos sempre prontos para ajudar!',
    'O horário de atendimento da secretaria é de segunda a sexta, das 8h às 17h.',
    'Para consultar seus dados ou fazer pedidos de livros, nossa secretaria pode te auxiliar melhor.'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    success: true,
    response: `${randomResponse}\n\n📞 Para atendimento completo:\n- Telefone: (63) 9 8511-2006\n- Email: simacjr@hotmail.com\n- Horário: Seg-Sex, 8h-17h`,
    agentName: 'EETAD Assistant',
    conversationId: userId,
    timestamp: new Date().toISOString()
  };
};

export const sendChatMessage = async (
  message: string, 
  userId: string, 
  studentData?: any, 
  context?: any
): Promise<ChatResponse> => {
  // Em produção, usar resposta simulada
  if (isProduction) {
    console.log('📱 Modo produção: usando resposta simulada do chatbot');
    
    // Simular delay de resposta
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return generateMockResponse(message, userId);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/ai-chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
        studentData,
        context
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao enviar mensagem para IA:', error);
    console.log('Usando resposta simulada como fallback');
    
    // Fallback para resposta simulada
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateMockResponse(message, userId);
  }
};

export const clearChatContext = async (userId: string): Promise<boolean> => {
  // Em produção, apenas simular limpeza
  if (isProduction) {
    console.log('📱 Modo produção: simulando limpeza de contexto');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/ai-chatbot/context/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao limpar contexto da conversa:', error);
    // Em caso de erro, simular sucesso
    return true;
  }
};

export const getChatContext = async (userId: string): Promise<ConversationContext> => {
  // Em produção, retornar contexto simulado
  if (isProduction) {
    console.log('📱 Modo produção: usando contexto simulado');
    return {
      userId,
      messages: [],
      studentData: null,
      lastInteraction: new Date().toISOString(),
      sessionStart: new Date().toISOString(),
      preferences: {}
    };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/ai-chatbot/context/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.context;
  } catch (error) {
    console.error('Erro ao obter contexto da conversa:', error);
    // Fallback para contexto vazio
    return {
      userId,
      messages: [],
      studentData: null,
      lastInteraction: new Date().toISOString(),
      sessionStart: new Date().toISOString(),
      preferences: {}
    };
  }
};

export const useAIChatbot = (userId: string = 'guest'): UseAIChatbotReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('EETAD Assistant');

  const sendMessage = async (message: string, studentData?: any): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(message, userId, studentData);
      
      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: response.timestamp
        };

        setMessages(prev => [...prev, assistantMessage]);
        setAgentName(response.agentName);
      } else {
        throw new Error(response.error || 'Erro desconhecido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Adicionar mensagem de erro como resposta do assistente
      const errorAssistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${errorMessage}. Tente novamente ou entre em contato com a secretaria.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async (): Promise<void> => {
    try {
      setLoading(true);
      await clearChatContext(userId);
      setMessages([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao limpar conversa');
    } finally {
      setLoading(false);
    }
  };

  const getContext = async (): Promise<ConversationContext | null> => {
    try {
      const context = await getChatContext(userId);
      return context;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter contexto');
      return null;
    }
  };

  return {
    messages,
    loading,
    error,
    agentName,
    sendMessage,
    clearChat,
    getContext,
  };
};

export default useAIChatbot;