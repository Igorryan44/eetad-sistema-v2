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

import { supabase } from '@/integrations/supabase/client';
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
        console.log('📋 Usando cache de alunos pendentes');
        return this.cache;
      }

      // Evitar múltiplas requisições simultâneas
      if (this.isLoading) {
        console.log('⏳ Aguardando requisição em andamento...');
        return this.cache;
      }

      this.isLoading = true;
      console.log('🔄 Buscando alunos pendentes...');

      const students = await this.fetchWithRetry();
      
      // Atualizar cache
      this.cache = students;
      this.lastFetch = now;
      
      // Notificar listeners
      this.notifyListeners(students);
      
      console.log(`✅ ${students.length} alunos pendentes carregados`);
      return students;

    } catch (error) {
      console.error('❌ Erro ao buscar alunos pendentes:', error);
      
      // Retornar cache se disponível, senão array vazio
      if (this.cache.length > 0) {
        console.log('📋 Retornando dados do cache devido ao erro');
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
      console.log(`🔄 Tentativa ${retryCount + 1} - Buscando alunos pendentes...`);
      
      const response = await supabase.functions.invoke('get-pending-students', {
        headers: {
          'Authorization': `Bearer ${PENDING_STUDENTS_CONFIG.SUPABASE_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Resposta da função:', response);

      if (response.error) {
        console.error('❌ Erro na resposta:', response.error);
        throw new Error(`Erro da função: ${response.error.message}`);
      }

      const students = response.data?.students || [];
      console.log(`✅ ${students.length} alunos pendentes encontrados`);
      
      // Normalizar dados
      const normalizedStudents = students.map((student: any, index: number) => ({
        id: student.cpf || `temp-${index}`,
        rowIndex: student.rowIndex || index + 2,
        nome: student.nome || '',
        cpf: student.cpf || '',
        nucleo: student.nucleo || '',
        telefone: student.telefone || '',
        email: student.email || '',
        timestamp: student.timestamp || '',
        status: student.status || 'Pendente',
        lastUpdated: new Date().toISOString()
      }));

      console.log('📋 Dados normalizados:', normalizedStudents);
      return normalizedStudents;

    } catch (error) {
      console.error(`❌ Tentativa ${retryCount + 1} falhou:`, error);
      
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
      console.log('📝 Efetivando matrícula:', enrollmentData);

      const response = await supabase.functions.invoke('finalize-student-enrollment', {
        body: {
          ...enrollmentData,
          data: enrollmentData.data || new Date().toLocaleDateString('pt-BR')
        },
        headers: {
          'Authorization': `Bearer ${PENDING_STUDENTS_CONFIG.SUPABASE_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.error) {
        throw new Error(`Erro ao efetivar matrícula: ${response.error.message}`);
      }

      // Remover aluno do cache local
      this.cache = this.cache.filter(student => student.cpf !== enrollmentData.cpf);
      
      // Notificar listeners sobre a mudança
      this.notifyListeners(this.cache);
      
      console.log('✅ Matrícula efetivada com sucesso');
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
    console.log('🧹 Cache limpo');
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
        console.log('🔄 Sincronização automática iniciada');
        await this.getPendingStudents(true);
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    }, PENDING_STUDENTS_CONFIG.BACKGROUND_SYNC_INTERVAL || interval);

    console.log(`🔄 Sincronização automática configurada para ${intervalMinutes} minutos`);
  }
}

// Instância singleton
export const pendingStudentsService = new PendingStudentsService();

// Hook React para usar o serviço
export const usePendingStudents = () => {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 Hook usePendingStudents inicializado');

  useEffect(() => {
    console.log('🔄 useEffect do hook executado');
    
    // Adicionar listener para atualizações
    const unsubscribe = pendingStudentsService.addListener((newStudents) => {
      console.log('📢 Listener recebeu novos dados:', newStudents);
      setStudents(newStudents);
    });
    
    // Carregar dados iniciais
    console.log('📥 Carregando dados iniciais...');
    loadStudents();
    
    return unsubscribe;
  }, []);

  const loadStudents = async (forceRefresh = false) => {
    try {
      console.log(`📥 loadStudents chamado (forceRefresh: ${forceRefresh})`);
      setLoading(true);
      setError(null);
      const data = await pendingStudentsService.getPendingStudents(forceRefresh);
      console.log('📊 Dados recebidos no hook:', data);
      setStudents(data);
    } catch (err) {
      console.error('❌ Erro no loadStudents:', err);
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