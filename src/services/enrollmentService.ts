import { useState, useEffect } from 'react';

interface Enrollment {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  curso: string;
  turma: string;
  periodo: string;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'matriculado';
  dataInscricao: string;
  dataMatricula?: string;
  observacoes?: string;
  valorCurso?: number;
  formaPagamento?: string;
}

interface UseEnrollmentReturn {
  enrollments: Enrollment[];
  pendingEnrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  fetchEnrollments: () => Promise<void>;
  fetchPendingEnrollments: () => Promise<void>;
  finalizeEnrollment: (cpf: string, additionalData?: any) => Promise<boolean>;
  updateStudentData: (cpf: string, data: any) => Promise<boolean>;
}

const API_BASE_URL = 'http://localhost:3003';

export const getEnrollments = async (): Promise<Enrollment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-enrollments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.enrollments : [];
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    throw error;
  }
};

export const getPendingEnrollments = async (): Promise<Enrollment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-pending-enrollments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.enrollments : [];
  } catch (error) {
    console.error('Erro ao buscar matrículas pendentes:', error);
    throw error;
  }
};

export const finalizeEnrollment = async (cpf: string, additionalData?: any): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/finalize-enrollment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf, ...additionalData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao finalizar matrícula:', error);
    throw error;
  }
};

export const updateStudentData = async (cpf: string, data: any): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/update-student-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf, ...data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao atualizar dados do aluno:', error);
    throw error;
  }
};

export const useEnrollment = (): UseEnrollmentReturn => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEnrollments();
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingEnrollments();
      setPendingEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPendingEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeEnrollment = async (cpf: string, additionalData?: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await finalizeEnrollment(cpf, additionalData);
      if (success) {
        // Refresh data after successful finalization
        await fetchEnrollments();
        await fetchPendingEnrollments();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudentData = async (cpf: string, data: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await updateStudentData(cpf, data);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    enrollments,
    pendingEnrollments,
    loading,
    error,
    fetchEnrollments,
    fetchPendingEnrollments,
    finalizeEnrollment: handleFinalizeEnrollment,
    updateStudentData: handleUpdateStudentData,
  };
};

export default useEnrollment;