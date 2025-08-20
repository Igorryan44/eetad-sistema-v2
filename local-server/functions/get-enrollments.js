import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, clearSheetCache } from '../utils/google-auth.js';

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

    // Buscar dados da aba "matriculas" com retry
    console.log('📚 Buscando dados da aba "matriculas"...');
    const matriculasRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, MATRICULAS_SHEET, 3);

    console.log(`📚 Total de linhas encontradas: ${matriculasRows.length}`);

    // Se não há dados ou só tem cabeçalho
    if (matriculasRows.length <= 1) {
      console.log('📚 Nenhuma matrícula encontrada');
      return res.json([]);
    }

    // DEBUG: Log do cabeçalho e primeiras linhas
    console.log('📚 DEBUG - Cabeçalho da aba matriculas:', JSON.stringify(matriculasRows[0]));
    if (matriculasRows.length > 1) {
      console.log('📚 DEBUG - Primeira linha de dados:', JSON.stringify(matriculasRows[1]));
    }
    if (matriculasRows.length > 2) {
      console.log('📚 DEBUG - Segunda linha de dados:', JSON.stringify(matriculasRows[2]));
    }

    // Processar matrículas (pular cabeçalho)
    // Estrutura correta conforme finalize-enrollment: [nome, cpf, núcleo, subnucleo, ciclo, data, status, observacao]
    const matriculas = matriculasRows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque começamos do índice 1 e as planilhas começam em 1
      
      const matricula = {
        rowIndex,
        nome: row[0] || '', // A - nome
        cpf: row[1] || '', // B - cpf
        nucleo: row[2] || '', // C - núcleo
        subnucleo: row[3] || '', // D - subnucleo
        ciclo: row[4] || '', // E - ciclo
        data: row[5] || '', // F - data
        status: row[6] || '', // G - status
        observacao: row[7] || '', // H - observacao
        congregacao: '' // Será preenchido com dados pessoais no frontend
      };
      
      // DEBUG: Log das primeiras 5 matrículas
      if (index < 5) {
        console.log(`📚 DEBUG - Matrícula ${index + 1}:`, JSON.stringify(matricula));
        console.log(`📚 DEBUG - Row original ${index + 1}:`, JSON.stringify(row));
        console.log(`📚 DEBUG - Filtro válido? nome: ${!!matricula.nome}, cpf: ${!!matricula.cpf}, ciclo: ${!!matricula.ciclo}`);
      }
      
      return matricula;
    }).filter(matricula => {
      // Filtrar apenas matrículas com dados válidos
      const isValid = matricula.nome && matricula.cpf && matricula.ciclo;
      if (!isValid) {
        console.log(`📚 DEBUG - Matrícula rejeitada:`, JSON.stringify(matricula));
      }
      return isValid;
    });

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
  try {
    console.log('📋 Buscando matrículas efetivadas (GET)...');

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const MATRICULAS_SHEET = 'matriculas';

    // Verificar credenciais
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // Buscar dados da aba "matriculas" com retry e forçar refresh
    console.log('📚 Buscando dados da aba "matriculas" (forçando refresh)...');
    const matriculasRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, MATRICULAS_SHEET, 3, true);

    console.log(`📚 Total de linhas encontradas: ${matriculasRows.length}`);

    // Se não há dados ou só tem cabeçalho
    if (matriculasRows.length <= 1) {
      console.log('📚 Nenhuma matrícula encontrada');
      return res.json([]);
    }

    // DEBUG: Log do cabeçalho e primeiras linhas
    console.log('📚 DEBUG - Cabeçalho da aba matriculas:', JSON.stringify(matriculasRows[0]));
    if (matriculasRows.length > 1) {
      console.log('📚 DEBUG - Primeira linha de dados:', JSON.stringify(matriculasRows[1]));
    }
    if (matriculasRows.length > 2) {
      console.log('📚 DEBUG - Segunda linha de dados:', JSON.stringify(matriculasRows[2]));
    }

    // Processar matrículas (pular cabeçalho)
    // Estrutura correta conforme finalize-enrollment: [nome, cpf, núcleo, subnucleo, ciclo, data, status, observacao]
    const matriculas = matriculasRows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque começamos do índice 1 e as planilhas começam em 1
      
      const matricula = {
        rowIndex,
        nome: row[0] || '', // A - nome
        cpf: row[1] || '', // B - cpf
        nucleo: row[2] || '', // C - núcleo
        subnucleo: row[3] || '', // D - subnucleo
        ciclo: row[4] || '', // E - ciclo
        data: row[5] || '', // F - data
        status: row[6] || '', // G - status
        observacao: row[7] || '', // H - observacao
        congregacao: '' // Será preenchido com dados pessoais no frontend
      };
      
      // DEBUG: Log das primeiras 5 matrículas
      if (index < 5) {
        console.log(`📚 DEBUG - Matrícula ${index + 1}:`, JSON.stringify(matricula));
        console.log(`📚 DEBUG - Row original ${index + 1}:`, JSON.stringify(row));
        console.log(`📚 DEBUG - Filtro válido? nome: ${!!matricula.nome}, cpf: ${!!matricula.cpf}, ciclo: ${!!matricula.ciclo}`);
      }
      
      return matricula;
    }).filter(matricula => {
      // Filtrar apenas matrículas com dados válidos
      const isValid = matricula.nome && matricula.cpf && matricula.ciclo;
      if (!isValid) {
        console.log(`📚 DEBUG - Matrícula rejeitada:`, JSON.stringify(matricula));
      }
      return isValid;
    });

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

// Rota para limpar cache e forçar refresh
router.post('/clear-cache', (req, res) => {
  try {
    clearSheetCache();
    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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