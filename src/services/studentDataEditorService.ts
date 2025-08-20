import { useState } from 'react';
import { StudentPersonalData, StudentEnrollmentData } from './types';

interface CombinedStudentData {
  personalData: StudentPersonalData | null;
  enrollmentData: StudentEnrollmentData | null;
}

interface UseStudentDataEditorReturn {
  studentData: CombinedStudentData;
  loading: boolean;
  error: string | null;
  searchResult: 'not_found' | 'pending' | 'found' | null;
  fetchStudentData: (cpf: string) => Promise<void>;
  updateStudentData: (cpf: string, personalData?: StudentPersonalData, enrollmentData?: StudentEnrollmentData) => Promise<boolean>;
  clearData: () => void;
}

const API_BASE_URL = 'http://localhost:3003';

// Buscar dados pessoais do aluno
export const getStudentPersonalData = async (cpf: string): Promise<StudentPersonalData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-student-personal-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.found ? data.data : null;
  } catch (error) {
    console.error('Erro ao buscar dados pessoais do aluno:', error);
    return null;
  }
};

// Buscar dados de matrícula do aluno
export const getStudentEnrollmentData = async (cpf: string): Promise<StudentEnrollmentData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-student-enrollment-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // A função retorna { enrollments: [], currentEnrollment?, totalEnrollments? }
    // Retornar a matrícula mais recente (currentEnrollment) ou a primeira se não houver currentEnrollment
    if (data.enrollments && data.enrollments.length > 0) {
      return data.currentEnrollment || data.enrollments[data.enrollments.length - 1];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados de matrícula do aluno:', error);
    return null;
  }
};

// Atualizar dados do aluno (pessoais e/ou matrícula)
export const updateStudentData = async (
  cpf: string,
  personalData?: StudentPersonalData,
  enrollmentData?: StudentEnrollmentData
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/update-student-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf,
        personalData,
        enrollmentData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Erro ao atualizar dados do aluno:', error);
    return false;
  }
};

// Hook para gerenciar edição de dados do aluno
export const useStudentDataEditor = (): UseStudentDataEditorReturn => {
  const [studentData, setStudentData] = useState<CombinedStudentData>({
    personalData: null,
    enrollmentData: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<'not_found' | 'pending' | 'found' | null>(null);

  const fetchStudentData = async (cpf: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      // Buscar dados pessoais e de matrícula em paralelo
      const [personalData, enrollmentData] = await Promise.all([
        getStudentPersonalData(cpf),
        getStudentEnrollmentData(cpf),
      ]);

      // Determinar o status do aluno baseado nos dados encontrados
      const hasEnrollment = enrollmentData !== null;
      
      if (!personalData && !hasEnrollment) {
        // Aluno não existe
        setSearchResult('not_found');
        setError('Aluno não encontrado. Verifique o CPF informado.');
        setStudentData({ personalData: null, enrollmentData: null });
      } else if (personalData && !hasEnrollment) {
        // Aluno existe apenas nos dados pessoais (status pendente)
        setSearchResult('pending');
        setError('Aluno com matrícula pendente. Para editar os dados, é necessário primeiro efetivar a matrícula.');
        setStudentData({ personalData: null, enrollmentData: null });
      } else if (personalData && hasEnrollment) {
        // Aluno cadastrado e matriculado - pode editar
        setSearchResult('found');
        setStudentData({ personalData, enrollmentData });
      } else {
        // Caso inesperado: matrícula sem dados pessoais
        setSearchResult('not_found');
        setError('Dados inconsistentes encontrados. Entre em contato com o suporte.');
        setStudentData({ personalData: null, enrollmentData: null });
      }
    } catch (err) {
      setError('Erro ao buscar dados do aluno');
      setSearchResult(null);
      console.error('Erro ao buscar dados do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentDataHandler = async (
    cpf: string,
    personalData?: StudentPersonalData,
    enrollmentData?: StudentEnrollmentData
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = await updateStudentData(cpf, personalData, enrollmentData);
      
      if (success) {
        // Atualizar dados locais após sucesso
        setStudentData(prev => ({
          personalData: personalData || prev.personalData,
          enrollmentData: enrollmentData || prev.enrollmentData,
        }));
      } else {
        setError('Erro ao atualizar dados do aluno');
      }

      return success;
    } catch (err) {
      setError('Erro ao atualizar dados do aluno');
      console.error('Erro ao atualizar dados do aluno:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setStudentData({
      personalData: null,
      enrollmentData: null,
    });
    setError(null);
    setSearchResult(null);
  };

  return {
    studentData,
    loading,
    error,
    searchResult,
    fetchStudentData,
    updateStudentData: updateStudentDataHandler,
    clearData,
  };
};

export default useStudentDataEditor;