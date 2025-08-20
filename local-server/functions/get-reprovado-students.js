/**
 * 📊 Função: get-reprovado-students
 * Busca alunos com status 'reprovado' da aba 'matriculas'
 */

import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();

// Aplicar CORS
router.use(corsMiddleware);

// Rota POST principal
router.post('/', async (req, res) => {
  try {
    console.log('📊 [get-reprovado-students] Iniciando busca por alunos reprovados...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-reprovado-students] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "matriculas"
    const rows = await readSheetDataWithRetry(spreadsheetId, 'matriculas', 3);
    
    if (rows.length === 0) {
      console.log('📊 [get-reprovado-students] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    console.log(`📊 [get-reprovado-students] ${rows.length} linhas encontradas na aba 'matriculas'`);
    
    // Processar dados (pular cabeçalho)
    const reprovadoStudents = rows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque pulamos cabeçalho e índice começa em 0
      
      const student = {
        rowIndex,
        nome: row[0] || '', // A - nome
        cpf: row[1] || '', // B - cpf
        nucleo: row[2] || '', // C - nucleo
        subnucleo: row[3] || '', // D - subnucleo
        ciclo: row[4] || '', // E - ciclo
        data: row[5] || '', // F - data
        status: row[6] || '', // G - status
        observacao: row[7] || '' // H - observacao
      };
      
      return student;
    }).filter(student => {
      // Filtrar apenas alunos com dados válidos e status 'reprovado'
      const hasValidData = student.nome && student.cpf;
      const isReprovado = student.status && student.status.toLowerCase() === 'reprovado';
      
      if (hasValidData && isReprovado) {
        console.log(`✅ [get-reprovado-students] Aluno reprovado encontrado: ${student.nome}`);
      }
      
      return hasValidData && isReprovado;
    });

    console.log(`📊 [get-reprovado-students] Total de alunos reprovados: ${reprovadoStudents.length}`);

    res.json(reprovadoStudents);

  } catch (error) {
    console.error('❌ [get-reprovado-students] Erro:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota GET para compatibilidade
router.get('/', async (req, res) => {
  try {
    console.log('📊 [get-reprovado-students] Iniciando busca por alunos reprovados...');
    
    const data = await readSheetDataWithRetry('matriculas', 'A:H');
    console.log(`📊 [get-reprovado-students] ${data.length} linhas encontradas na aba 'matriculas'`);
    
    const reprovadoStudents = data
      .filter(row => {
        const nome = row[0]?.toString().trim();
        const cpf = row[1]?.toString().trim();
        const status = row[6]?.toString().toLowerCase().trim();
        
        return nome && cpf && status === 'reprovado';
      })
      .map(row => ({
        nome: row[0]?.toString().trim() || '',
        cpf: row[1]?.toString().trim() || '',
        nucleo: row[2]?.toString().trim() || '',
        ciclo: row[3]?.toString().trim() || '',
        data: row[4]?.toString().trim() || '',
        status: row[6]?.toString().trim() || '',
        observacao: row[7]?.toString().trim() || ''
      }));
    
    console.log(`📊 [get-reprovado-students] Total de alunos reprovados: ${reprovadoStudents.length}`);
    
    res.json({
      success: true,
      data: reprovadoStudents,
      count: reprovadoStudents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [get-reprovado-students] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-reprovado-students operacional' });
});

export default router;