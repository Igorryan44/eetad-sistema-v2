/**
 * 📊 Função: get-cursando-students
 * Busca alunos com status 'cursando' da aba 'matriculas'
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
    console.log('📊 [get-cursando-students] Iniciando busca por alunos cursando...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-cursando-students] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "matriculas"
    const rows = await readSheetDataWithRetry(spreadsheetId, 'matriculas', 3);
    
    if (rows.length === 0) {
      console.log('📊 [get-cursando-students] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    console.log(`📊 [get-cursando-students] ${rows.length} linhas encontradas na aba 'matriculas'`);
    
    // Processar dados (pular cabeçalho)
    const cursandoStudents = rows.slice(1).map((row, index) => {
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
      // Filtrar apenas alunos com dados válidos e status 'cursando'
      const hasValidData = student.nome && student.cpf;
      const isCursando = student.status && student.status.toLowerCase() === 'cursando';
      
      if (hasValidData && isCursando) {
        console.log(`✅ [get-cursando-students] Aluno cursando encontrado: ${student.nome}`);
      }
      
      return hasValidData && isCursando;
    });

    console.log(`📊 [get-cursando-students] Total de alunos cursando: ${cursandoStudents.length}`);

    res.json(cursandoStudents);

  } catch (error) {
    console.error('❌ [get-cursando-students] Erro:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota GET para compatibilidade
router.get('/', async (req, res) => {
  req.body = {};
  return router.handle(req, res);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-cursando-students operacional' });
});

export default router;