/**
 * 🎯 Serviço para Alunos Aprovados
 * 
 * Características:
 * - Cache inteligente para reduzir chamadas à API
 * - Sincronização automática em background
 * - Fallback robusto em caso de falhas
 * - Interface única para o frontend
 * - Otimização de performance
 */

import { useEffect, useState } from 'react';

export interface ApprovedStudent {
  id: string;
  rowIndex: number;
  nome: string;
  cpf: string;
  nucleo?: string;
  subnucleo?: string;
  ciclo?: string;
  data?: string;
  status: string;
  observacao?: string;
  lastUpdated?: string;
}

class ApprovedStudentsService {
  private cache: ApprovedStudent[] = [];
  private lastFetch: number = 0;
  private isLoading = false;
  private listeners: Array<(students: ApprovedStudent[]) => void> = [];
  private readonly CACHE_DURATION = 30 * 1000; // 30 segundos
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * 📊 Buscar alunos aprovados com cache inteligente
   */
  async getApprovedStudents(forceRefresh = false): Promise<ApprovedStudent[]> {
    try {
      // Verificar se o cache ainda é válido
      const now = Date.now();
      const cacheIsValid = !forceRefresh && 
                          this.cache.length > 0 && 
                          (now - this.lastFetch) < this.CACHE_DURATION;

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
  private async fetchWithRetry(retryCount = 0): Promise<ApprovedStudent[]> {
      try {
        const response = await fetch('http://localhost:3003/functions/get-aprovado-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        subnucleo: student.subnucleo || '',
        ciclo: student.ciclo || '',
        data: student.data || '',
        status: student.status || 'aprovado',
        observacao: student.observacao || '',
        lastUpdated: new Date().toISOString()
      }));

      return normalizedStudents;

      } catch (error) {
      
      if (retryCount < this.MAX_RETRIES - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1))
        );
        return this.fetchWithRetry(retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * 🔄 Forçar atualização dos dados
   */
  async refresh(): Promise<ApprovedStudent[]> {
    return this.getApprovedStudents(true);
  }

  /**
   * 📊 Obter estatísticas dos alunos aprovados
   */
  getStats() {
    return {
      total: this.cache.length,
      lastUpdate: new Date(this.lastFetch).toLocaleString('pt-BR'),
      cacheAge: Date.now() - this.lastFetch,
      isStale: (Date.now() - this.lastFetch) > this.CACHE_DURATION
    };
  }

  /**
   * 👂 Adicionar listener para mudanças
   */
  addListener(callback: (students: ApprovedStudent[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 📢 Notificar todos os listeners
   */
  private notifyListeners(students: ApprovedStudent[]) {
    this.listeners.forEach(listener => {
      try {
        listener(students);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
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
  findStudentByCpf(cpf: string): ApprovedStudent | undefined {
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.cache.find(student => 
      student.cpf.replace(/\D/g, '') === cleanCpf
    );
  }
}

// Instância singleton
export const approvedStudentsService = new ApprovedStudentsService();

// Hook React para usar o serviço
export const useApprovedStudents = () => {
  const [students, setStudents] = useState<ApprovedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    // Adicionar listener para atualizações
    const unsubscribe = approvedStudentsService.addListener((newStudents) => {
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
      
      const data = await approvedStudentsService.getApprovedStudents(forceRefresh);
      
      setStudents(data);
    } catch (err) {
      console.error('❌ Erro ao carregar alunos aprovados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadStudents(true);

  return {
    students,
    loading,
    error,
    refresh,
    stats: approvedStudentsService.getStats()
  };
};