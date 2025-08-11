/**
 * Configurações para o serviço de alunos pendentes
 */
export const PENDING_STUDENTS_CONFIG = {
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  BACKGROUND_SYNC_INTERVAL: 2 * 60 * 1000, // 2 minutos
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Performance settings
  DEBOUNCE_DELAY: 300, // 300ms
  
  // API settings
  SUPABASE_FUNCTION_NAME: 'get-pending-enrollments',
  SUPABASE_AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs',
  
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