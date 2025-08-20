import { useState, useEffect } from 'react';

interface StudentBook {
  id: string;
  titulo: string;
  autor: string;
  editora: string;
  isbn: string;
  preco: number;
  disponivel: boolean;
  curso: string;
  periodo: string;
  disciplina: string;
}

interface BookOrder {
  cpf: string;
  livros: string[];
  observacao?: string;
  dataEntrega?: string;
  status: 'pendente' | 'processando' | 'entregue' | 'cancelado';
}

interface UseStudentBooksReturn {
  books: StudentBook[];
  loading: boolean;
  error: string | null;
  fetchBooks: (cpf: string) => Promise<void>;
  saveBookOrder: (order: BookOrder) => Promise<boolean>;
  getBookOrdersByCpf: (cpf: string, book: string, observacao: string) => Promise<any[]>;
}

const API_BASE_URL = 'http://localhost:3003';

export const getStudentBooks = async (cpf: string): Promise<StudentBook[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-student-books`, {
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
    return data.success ? data.books : [];
  } catch (error) {
    console.error('Erro ao buscar livros do aluno:', error);
    throw error;
  }
};

export const saveBookOrder = async (order: BookOrder): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/save-book-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao salvar pedido de livros:', error);
    throw error;
  }
};

export const getBookOrdersByCpfBookObservacao = async (cpf: string, book: string, observacao: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/functions/get-book-orders-by-cpf-book-observacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf, book, observacao }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.orders : [];
  } catch (error) {
    console.error('Erro ao buscar pedidos de livros:', error);
    throw error;
  }
};

export const useStudentBooks = (): UseStudentBooksReturn => {
  const [books, setBooks] = useState<StudentBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async (cpf: string) => {
    try {
      setLoading(true);
      setError(null);
      const booksData = await getStudentBooks(cpf);
      setBooks(booksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBookOrder = async (order: BookOrder): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await saveBookOrder(order);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBookOrdersByCpf = async (cpf: string, book: string, observacao: string): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);
      const orders = await getBookOrdersByCpfBookObservacao(cpf, book, observacao);
      return orders;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    books,
    loading,
    error,
    fetchBooks,
    saveBookOrder: handleSaveBookOrder,
    getBookOrdersByCpf,
  };
};

export default useStudentBooks;