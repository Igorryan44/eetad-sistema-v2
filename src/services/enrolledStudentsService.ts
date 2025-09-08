import { useState, useEffect } from 'react';

type EnrolledStudent = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  status: string;
  dataMatricula?: string;
};

const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003';

// Hook para gerenciar alunos matriculados
export const useEnrolledStudents = () => {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/functions/get-matriculated-students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // A função retorna diretamente um array de alunos
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err) {
      console.error('Erro ao buscar alunos matriculados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStudents = () => {
    fetchEnrolledStudents();
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  return {
    students,
    loading,
    error,
    refreshStudents,
    count: students.length
  };
};

// Função para buscar alunos matriculados diretamente
export const getEnrolledStudents = async (): Promise<EnrolledStudent[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-matriculated-students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // A função retorna diretamente um array de alunos
    if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.error('Erro ao buscar alunos matriculados:', error);
    throw error;
  }
};