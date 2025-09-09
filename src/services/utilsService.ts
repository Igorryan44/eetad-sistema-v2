import { useState } from 'react';

interface DebugSheetData {
  sheet: string;
  range?: string;
  data: any[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    lastUpdated: string;
  };
}

interface CacheInfo {
  keys: string[];
  totalSize: number;
  lastCleared: string;
}

interface UseUtilsReturn {
  loading: boolean;
  error: string | null;
  debugSheetData: (sheet: string, range?: string) => Promise<DebugSheetData | null>;
  clearCache: () => Promise<boolean>;
  testEnrollments: () => Promise<any>;
}

const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003';

// Detectar se está em produção
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1' &&
                     !window.location.hostname.includes('local');

export const debugSheetData = async (sheet: string, range?: string): Promise<DebugSheetData | null> => {
  // Em produção, retornar null (funcionalidade de debug não disponível)
  if (isProduction) {
    console.log('📱 Modo produção: debug de planilha não disponível');
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/debug-sheet-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sheet, range }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Erro ao fazer debug dos dados da planilha:', error);
    return null;
  }
};

export const clearCache = async (): Promise<boolean> => {
  // Em produção, simular limpeza de cache
  if (isProduction) {
    console.log('📱 Modo produção: simulando limpeza de cache');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/clear-cache`, {
      method: 'POST',
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
    console.error('Erro ao limpar cache:', error);
    return false;
  }
};

export const testEnrollments = async (): Promise<any> => {
  // Em produção, retornar dados simulados para teste
  if (isProduction) {
    console.log('📱 Modo produção: retornando dados simulados de teste');
    return {
      success: true,
      message: 'Teste simulado em produção',
      enrollments: [],
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/test-enrollments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao testar matrículas:', error);
    // Fallback para dados simulados
    return {
      success: false,
      error: error.message,
      enrollments: []
    };
  }
};

export const useUtils = (): UseUtilsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDebugSheetData = async (sheet: string, range?: string): Promise<DebugSheetData | null> => {
    try {
      setLoading(true);
      setError(null);
      const data = await debugSheetData(sheet, range);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await clearCache();
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleTestEnrollments = async (): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const result = await testEnrollments();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    debugSheetData: handleDebugSheetData,
    clearCache: handleClearCache,
    testEnrollments: handleTestEnrollments,
  };
};

export default useUtils;