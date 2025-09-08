/**
 * 📚 Função: get-student-books
 * Busca livros das disciplinas do aluno por CPF
 */

import { Router } from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';
import { corsMiddleware } from '../utils/cors.js';

const router = Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📚 [get-student-books] Iniciando busca por livros do aluno...');
    
    const { cpf } = req.body;
    
    if (!cpf) {
      console.error('📚 [get-student-books] CPF não fornecido');
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📚 [get-student-books] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "pedidos" (onde ficam os livros)
    const rows = await readSheetDataWithRetry(spreadsheetId, 'pedidos');
    
    if (rows.length === 0) {
      console.log('📚 [get-student-books] Nenhum pedido encontrado na planilha');
      return res.json({ books: [] });
    }

    // Mapear índices dos cabeçalhos
    const headerRow = rows[0];
    console.log('📚 [get-student-books] Cabeçalhos encontrados:', headerRow);
    
    // Buscar por CPF (assumindo que está na coluna B - índice 1)
    const cpfClean = cpf.replace(/\D/g, '');
    const studentBooks = rows.slice(1).filter(row => {
      const rowCpf = (row[1] || '').replace(/\D/g, '');
      return rowCpf === cpfClean;
    });

    if (studentBooks.length === 0) {
      console.log(`📚 [get-student-books] Nenhum livro encontrado para CPF: ${cpf}`);
      return res.json({ books: [] });
    }

    // Mapear dados dos livros baseado na estrutura da planilha
    const books = studentBooks.map(row => ({
      timestamp: row[0] || '',
      cpf: row[1] || '',
      nome: row[2] || '',
      nucleo: row[3] || '',
      ciclo: row[4] || '',
      subnucleo: row[5] || '',
      livro: row[6] || '',
      observacao: row[7] || '',
      status: row[8] || 'Pendente',
      dataPedido: row[0] || ''
    }));

    // Agrupar livros por ciclo para melhor organização
    const booksByCycle = books.reduce((acc, book) => {
      const cycle = book.ciclo || 'Não especificado';
      if (!acc[cycle]) {
        acc[cycle] = [];
      }
      acc[cycle].push(book);
      return acc;
    }, {});

    console.log(`📚 [get-student-books] ${books.length} livros encontrados para CPF: ${cpf}`);

    res.json({
      books,
      booksByCycle,
      totalBooks: books.length
    });
    
  } catch (error) {
    console.error('📚 [get-student-books] Erro:', error);
    res.status(500).json({ error: `Erro: ${error.message}` });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-student-books operacional' });
});

export default router;