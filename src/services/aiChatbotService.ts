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

export const sendChatMessage = async (
  message: string, 
  userId: string, 
  studentData?: any, 
  context?: any
): Promise<ChatResponse> => {
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
    throw error;
  }
};

export const clearChatContext = async (userId: string): Promise<boolean> => {
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
    throw error;
  }
};

export const getChatContext = async (userId: string): Promise<ConversationContext> => {
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
    throw error;
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