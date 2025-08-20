/**
 * 🎯 Serviço Unificado para Alunos Pendentes
 * 
 * Características:
 * - Cache inteligente para reduzir chamadas à API
 * - Sincronização automática em background
 * - Fallback robusto em caso de falhas
 * - Interface única para o frontend
 * - Otimização de performance
 */


import { useEffect, useState } from 'react';
import { PENDING_STUDENTS_CONFIG } from '../config/pendingStudentsConfig';

export interface PendingStudent {
  id: string;
  rowIndex: number;
  nome: string;
  cpf: string;
  nucleo?: string;
  telefone?: string;
  email?: string;
  timestamp?: string;
  status: string;
  lastUpdated?: string;
}

export interface EnrollmentData {
  rowIndex: number;
  cpf: string;
  ciclo: string;
  subnucleo: string;
  data?: string;
  status: string;
  observacao?: string;
}

class PendingStudentsService {
  private cache: PendingStudent[] = [];
  private lastFetch: number = 0;
  private isLoading = false;
  private listeners: Array<(students: PendingStudent[]) => void> = [];

  /**
   * 📊 Buscar alunos pendentes com cache inteligente
   */
  async getPendingStudents(forceRefresh = false): Promise<PendingStudent[]> {
    try {
      // Verificar se o cache ainda é válido
      const now = Date.now();
      const cacheIsValid = !forceRefresh && 
                          this.cache.length > 0 && 
                          (now - this.lastFetch) < PENDING_STUDENTS_CONFIG.CACHE_DURATION;

      if (cacheIsValid) {
        return this.cache;
      }

      // Evitar múltiplas requisições simultâneas
      if (this.isLoading) {
        return this.cache;
      }

      this.isLoading = true;

      const students = await this.fetchWithRetry();
      
      // Atualizar cache
      this.cache = students;
      this.lastFetch = now;
      
      // Notificar listeners
      this.notifyListeners(students);
      
      return students;

    } catch (error) {
      
      // Retornar cache se disponível, senão array vazio
      if (this.cache.length > 0) {
        return this.cache;
      }
      
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 🔄 Buscar dados com retry automático
   */
  private async fetchWithRetry(retryCount = 0): Promise<PendingStudent[]> {
    try {
      
      // Usar servidor local - nova função para buscar alunos pendentes
      const response = await fetch('http://localhost:3003/functions/get-pendente-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const students = await response.json();
      
      // Normalizar dados
      const normalizedStudents = students.map((student: any, index: number) => ({
        id: student.cpf || `temp-${Date.now()}-${index}`,
        rowIndex: student.rowIndex || index + 2,
        nome: student.nome || '',
        cpf: student.cpf || '',
        nucleo: student.nucleo || '',
        telefone: student.telefone || '',
        email: student.email || '',
        timestamp: student.data_cadastro || '',
        status: student.status || 'pendente',
        lastUpdated: new Date().toISOString()
      }));

      return normalizedStudents;

    } catch (error) {
      
      if (retryCount < PENDING_STUDENTS_CONFIG.MAX_RETRIES - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, PENDING_STUDENTS_CONFIG.RETRY_DELAY * (retryCount + 1))
        );
        return this.fetchWithRetry(retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * ✅ Efetivar matrícula de aluno
   */
  async finalizeEnrollment(enrollmentData: EnrollmentData): Promise<boolean> {
    try {


      // Usar servidor local
      const response = await fetch('http://localhost:3003/functions/finalize-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...enrollmentData,
          data: enrollmentData.data || new Date().toLocaleDateString('pt-BR')
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(`Erro ao efetivar matrícula: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Remover aluno do cache local
      this.cache = this.cache.filter(student => student.cpf !== enrollmentData.cpf);
      
      // Se o servidor indicar que o dashboard deve ser atualizado, forçar refresh
      if (result.shouldRefreshDashboard) {
        // Aguardar um pouco para garantir que os dados foram salvos no Google Sheets
        setTimeout(async () => {
          await this.getPendingStudents(true); // Forçar refresh dos dados
        }, 500);
      }
      
      // Notificar listeners sobre a mudança
      this.notifyListeners(this.cache);
      

      return true;

    } catch (error) {
      console.error('❌ Erro ao efetivar matrícula:', error);
      throw error;
    }
  }

  /**
   * 🔄 Forçar atualização dos dados
   */
  async refresh(): Promise<PendingStudent[]> {
    return this.getPendingStudents(true);
  }

  /**
   * 📊 Obter estatísticas dos alunos pendentes
   */
  getStats() {
    return {
      total: this.cache.length,
      lastUpdate: new Date(this.lastFetch).toLocaleString('pt-BR'),
      cacheAge: Date.now() - this.lastFetch,
      isStale: (Date.now() - this.lastFetch) > PENDING_STUDENTS_CONFIG.CACHE_DURATION
    };
  }

  /**
   * 👂 Adicionar listener para mudanças
   */
  addListener(callback: (students: PendingStudent[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 📢 Notificar todos os listeners
   */
  private notifyListeners(students: PendingStudent[]) {
    this.listeners.forEach(listener => {
      try {
        listener(students);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * ⏱️ Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🧹 Limpar cache
   */
  clearCache() {
    this.cache = [];
    this.lastFetch = 0;
  }

  /**
   * 🔍 Buscar aluno por CPF
   */
  findStudentByCpf(cpf: string): PendingStudent | undefined {
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.cache.find(student => 
      student.cpf.replace(/\D/g, '') === cleanCpf
    );
  }

  /**
   * 📈 Iniciar sincronização automática em background
   */
  startAutoSync(intervalMinutes = 10) {
    const interval = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      try {
        await this.getPendingStudents(true);
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    }, PENDING_STUDENTS_CONFIG.BACKGROUND_SYNC_INTERVAL || interval);


  }
}

// Instância singleton
export const pendingStudentsService = new PendingStudentsService();

// Hook React para usar o serviço
export const usePendingStudents = () => {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Adicionar listener para atualizações
    const unsubscribe = pendingStudentsService.addListener((newStudents) => {
      setStudents(newStudents);
    });
    
    // Carregar dados iniciais
    loadStudents();
    
    return unsubscribe;
  }, []);

  const loadStudents = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await pendingStudentsService.getPendingStudents(forceRefresh);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const finalizeEnrollment = async (enrollmentData: EnrollmentData) => {
    try {
      setError(null);
      await pendingStudentsService.finalizeEnrollment(enrollmentData);
      // Os dados serão atualizados automaticamente via listener
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao efetivar matrícula');
      throw err;
    }
  };

  const refresh = () => loadStudents(true);

  return {
    students,
    loading,
    error,
    refresh,
    finalizeEnrollment,
    stats: pendingStudentsService.getStats()
  };
};