import { useState } from 'react';

interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  studentName?: string;
  course?: string;
  template?: 'enrollment' | 'approval' | 'rejection' | 'payment' | 'custom';
}

interface WhatsAppNotification {
  phone: string;
  message: string;
  studentName?: string;
  course?: string;
  template?: 'enrollment' | 'approval' | 'rejection' | 'payment' | 'custom';
}

interface UseNotificationReturn {
  loading: boolean;
  error: string | null;
  sendEmail: (data: EmailNotification) => Promise<boolean>;
  sendWhatsApp: (data: WhatsAppNotification) => Promise<boolean>;
}

const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003';

export const sendEmailNotification = async (data: EmailNotification): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/send-email-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao enviar notificação por email:', error);
    throw error;
  }
};

export const sendWhatsAppNotification = async (data: WhatsAppNotification): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/send-whatsapp-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao enviar notificação por WhatsApp:', error);
    throw error;
  }
};

export const useNotification = (): UseNotificationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (data: EmailNotification): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await sendEmailNotification(data);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = async (data: WhatsAppNotification): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await sendWhatsAppNotification(data);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendEmail,
    sendWhatsApp,
  };
};

export default useNotification;