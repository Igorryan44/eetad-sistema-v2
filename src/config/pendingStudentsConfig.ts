/**
 * Configurações para o serviço de alunos pendentes
 */
export const PENDING_STUDENTS_CONFIG = {
  // Cache settings
  CACHE_DURATION: 10 * 1000, // 10 segundos (debug)
  BACKGROUND_SYNC_INTERVAL: 5 * 1000, // 5 segundos (debug)
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Performance settings
  DEBOUNCE_DELAY: 300, // 300ms
  
  // API settings
  LOCAL_FUNCTION_NAME: 'get-pendente-students',
  LOCAL_SERVER_URL: 'http://localhost:3003',
  
  // Error messages
  ERROR_MESSAGES: {
    FETCH_FAILED: 'Erro ao carregar alunos pendentes',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
    TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
    UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    DATA_LOADED: 'Dados carregados com sucesso',
    CACHE_UPDATED: 'Cache atualizado',
    SYNC_COMPLETED: 'Sincronização concluída',
  }
} as const;

export type PendingStudentsConfig = typeof PENDING_STUDENTS_CONFIG;