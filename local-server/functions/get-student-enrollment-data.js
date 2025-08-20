/**
 * 🎓 Função: get-student-enrollment-data
 * Busca dados de matrícula do aluno por CPF
 */

import { Router } from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';
import { corsMiddleware } from '../utils/cors.js';

const router = Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🎓 [get-student-enrollment-data] Iniciando busca por dados de matrícula...');
    
    const { cpf } = req.body;
    
    if (!cpf) {
      console.error('🎓 [get-student-enrollment-data] CPF não fornecido');
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('🎓 [get-student-enrollment-data] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "matriculas" com retry
    const rows = await readSheetDataWithRetry(spreadsheetId, 'matriculas', 3);
    
    if (rows.length === 0) {
      console.log('🎓 [get-student-enrollment-data] Nenhuma matrícula encontrada na planilha');
      return res.json({ enrollments: [] });
    }

    // Mapear índices dos cabeçalhos
    const headerRow = rows[0];
    console.log('🎓 [get-student-enrollment-data] Cabeçalhos encontrados:', headerRow);
    
    // Função para encontrar índice da coluna baseado no nome do cabeçalho
    const getColumnIndex = (headerName) => {
      const index = headerRow.findIndex(header => 
        header && header.toString().toLowerCase().includes(headerName.toLowerCase())
      );
      return index !== -1 ? index : -1;
    };
    
    // Buscar por CPF dinamicamente
    const cpfClean = cpf.replace(/\D/g, '');
    console.log('🔍 [get-student-enrollment-data] Procurando CPF:', cpfClean);
    
    let studentEnrollments = [];
    let cpfColumnIndex = getColumnIndex('cpf');
    
    // Se não encontrou coluna CPF pelos cabeçalhos, procurar manualmente
    if (cpfColumnIndex === -1) {
      console.log('🔍 [get-student-enrollment-data] Coluna CPF não encontrada nos cabeçalhos, buscando manualmente...');
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        for (let j = 0; j < row.length; j++) {
          const cellValue = (row[j] || '').toString().replace(/\D/g, '');
          if (cellValue === cpfClean) {
            cpfColumnIndex = j;
            break;
          }
        }
        if (cpfColumnIndex !== -1) break;
      }
    }
    
    if (cpfColumnIndex !== -1) {
      studentEnrollments = rows.slice(1).filter(row => {
        const rowCpf = (row[cpfColumnIndex] || '').toString().replace(/\D/g, '');
        return rowCpf === cpfClean;
      });
    }

    if (studentEnrollments.length === 0) {
      console.log(`🎓 [get-student-enrollment-data] Nenhuma matrícula encontrada para CPF: ${cpf}`);
      return res.json({ enrollments: [] });
    }

    // Mapear dados das matrículas baseado na estrutura real da planilha
    const enrollments = studentEnrollments.map(row => ({
      nome: row[getColumnIndex('nome')] || row[0] || '',
      cpf: row[cpfColumnIndex] || '',
      nucleo: row[getColumnIndex('nucleo')] || row[2] || '',
      subnucleo: row[getColumnIndex('subnucleo')] || row[3] || '',
      ciclo: row[getColumnIndex('ciclo')] || row[4] || '',
      data: row[getColumnIndex('data')] || row[5] || '',
      status: row[getColumnIndex('status')] || row[6] || '',
      observacao: row[getColumnIndex('observacao')] || row[7] || '',
      dataMatricula: row[getColumnIndex('data')] || row[5] || ''
    }));

    // Pegar a matrícula mais recente (última)
    const currentEnrollment = enrollments[enrollments.length - 1];

    console.log(`🎓 [get-student-enrollment-data] ${enrollments.length} matrículas encontradas para CPF: ${cpf}`);

    res.json({
      enrollments,
      currentEnrollment,
      totalEnrollments: enrollments.length
    });
    
  } catch (error) {
    console.error('🎓 [get-student-enrollment-data] Erro:', error);
    res.status(500).json({ error: `Erro: ${error.message}` });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-student-enrollment-data operacional' });
});

export default router;