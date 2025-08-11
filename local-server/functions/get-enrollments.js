import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetData } from '../utils/google-auth.js';

const router = express.Router();

// Aplicar middleware CORS
router.use(corsMiddleware);

// Rota principal para buscar matrículas efetivadas
router.post('/', async (req, res) => {
  try {
    console.log('📋 Buscando matrículas efetivadas...');

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const MATRICULAS_SHEET = 'matriculas';

    // Verificar credenciais
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // Buscar dados da aba "matriculas"
    console.log('📚 Buscando dados da aba "matriculas"...');
    const matriculasRows = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, MATRICULAS_SHEET);

    console.log(`📚 Total de linhas encontradas: ${matriculasRows.length}`);

    // Se não há dados ou só tem cabeçalho
    if (matriculasRows.length <= 1) {
      console.log('📚 Nenhuma matrícula encontrada');
      return res.json([]);
    }

    // Processar matrículas (pular cabeçalho)
    const matriculas = matriculasRows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque começamos do índice 1 e as planilhas começam em 1
      
      return {
        rowIndex,
        nome: row[0] || '',
        cpf: row[1] || '',
        nucleo: row[2] || '',
        subnucleo: row[3] || '',
        ciclo: row[4] || '',
        data: row[5] || '',
        status: row[6] || '',
        observacao: row[7] || ''
      };
    }).filter(matricula => 
      // Filtrar apenas matrículas com dados válidos
      matricula.nome && matricula.cpf && matricula.ciclo
    );

    console.log(`📚 Matrículas processadas: ${matriculas.length}`);

    res.json(matriculas);

  } catch (error) {
    console.error('❌ Erro ao buscar matrículas:', error);
    
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

// Rota para verificar status da função
router.get('/health', (req, res) => {
  res.json({
    function: 'get-enrollments',
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleCredentials: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    }
  });
});

export default router;