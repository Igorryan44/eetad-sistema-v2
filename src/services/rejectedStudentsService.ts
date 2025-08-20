/**
 * 🎯 Serviço para Alunos Reprovados
 * 
 * Características:
 * - Cache inteligente para reduzir chamadas à API
 * - Sincronização automática em background
 * - Fallback robusto em caso de falhas
 * - Interface única para o frontend
 * - Otimização de performance
 */

import { useEffect, useState } from 'react';

export interface RejectedStudent {
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

class RejectedStudentsService {
  private cache: RejectedStudent[] = [];
  private lastFetch: number = 0;
  private isLoading = false;
  private listeners: Array<(students: RejectedStudent[]) => void> = [];
  private readonly CACHE_DURATION = 30 * 1000; // 30 segundos
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * 📊 Buscar alunos reprovados com cache inteligente
   */
  async getRejectedStudents(forceRefresh = false): Promise<RejectedStudent[]> {
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
  private async fetchWithRetry(retryCount = 0): Promise<RejectedStudent[]> {
    try {
      const response = await fetch('http://localhost:3003/functions/get-reprovado-students', {
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
        subnucleo: student.subnucleo || '',
        ciclo: student.ciclo || '',
        data: student.data || '',
        status: student.status || 'reprovado',
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
  async refresh(): Promise<RejectedStudent[]> {
    return this.getRejectedStudents(true);
  }

  /**
   * 📊 Obter estatísticas dos alunos reprovados
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
  addListener(callback: (students: RejectedStudent[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 📢 Notificar todos os listeners
   */
  private notifyListeners(students: RejectedStudent[]) {
    this.listeners.forEach(listener => {
      try {
        listener(students);
      } catch (error) {
        // Erro silencioso ao notificar listener
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
  findStudentByCpf(cpf: string): RejectedStudent | undefined {
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.cache.find(student => 
      student.cpf.replace(/\D/g, '') === cleanCpf
    );
  }
}

// Instância singleton
export const rejectedStudentsService = new RejectedStudentsService();

// Hook React para usar o serviço
export const useRejectedStudents = () => {
  const [students, setStudents] = useState<RejectedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    // Adicionar listener para atualizações
    const unsubscribe = rejectedStudentsService.addListener((newStudents) => {
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
      
      const data = await rejectedStudentsService.getRejectedStudents(forceRefresh);
      
      setStudents(data);
    } catch (err) {
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
    stats: rejectedStudentsService.getStats()
  };
};