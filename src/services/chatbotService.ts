import { useState } from 'react';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

interface ChatbotResponse {
  success: boolean;
  response?: string;
  error?: string;
  suggestions?: string[];
}

interface UseChatbotReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, context?: any) => Promise<void>;
  clearChat: () => void;
}

const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003';

export const sendChatbotMessage = async (message: string, context?: any): Promise<ChatbotResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/ai-chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        context: context || {},
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao enviar mensagem para o chatbot:', error);
    throw error;
  }
};

export const useChatbot = (): UseChatbotReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: 'Olá! Sou o assistente virtual da EETAD. Como posso ajudá-lo hoje?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string, context?: any) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatbotMessage(message, context);
      
      if (response.success && response.response) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: response.response,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.error || 'Erro desconhecido do chatbot');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      const errorBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        message: 'Olá! Sou o assistente virtual da EETAD. Como posso ajudá-lo hoje?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
    ]);
    setError(null);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
  };
};

export default useChatbot;