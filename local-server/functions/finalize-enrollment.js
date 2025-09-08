import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData, appendSheetData } from '../utils/google-auth.js';

const router = express.Router();

// Aplicar middleware CORS
router.use(corsMiddleware);

// Interface para dados de matrícula
const EnrollmentDataSchema = {
  rowIndex: 'number',
  cpf: 'string',
  ciclo: 'string',
  subnucleo: 'string',
  data: 'string',
  status: 'string',
  observacao: 'string'
};

// Validar dados de entrada
function validateEnrollmentData(data) {
  const errors = [];
  
  for (const [field, type] of Object.entries(EnrollmentDataSchema)) {
    if (field === 'observacao') continue; // Campo opcional
    
    if (!data[field]) {
      errors.push(`Campo '${field}' é obrigatório`);
    } else if (typeof data[field] !== type) {
      errors.push(`Campo '${field}' deve ser do tipo ${type}`);
    }
  }
  
  return errors;
}

// Rota principal para efetivação de matrícula
router.post('/', async (req, res) => {
  try {
    console.log('📝 Efetivando matrícula:', req.body);

    // Validar dados de entrada
    const validationErrors = validateEnrollmentData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationErrors
      });
    }

    const enrollmentData = req.body;

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    const MATRICULAS_SHEET = 'matriculas';

    // Verificar se as credenciais estão configuradas
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // 1. Atualizar status na aba "dados pessoais" (coluna Y - índice 24)
    console.log(`📊 Atualizando status na linha ${enrollmentData.rowIndex}...`);
    
    const statusRange = `${DADOS_PESSOAIS_SHEET}!Y${enrollmentData.rowIndex}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, statusRange, [['matriculado']]);

    // 2. Buscar dados pessoais do aluno
    console.log(`👤 Buscando dados do aluno na linha ${enrollmentData.rowIndex}...`);
    
    const studentRange = `${DADOS_PESSOAIS_SHEET}!A${enrollmentData.rowIndex}:Z${enrollmentData.rowIndex}`;
    const studentData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, studentRange);
    const studentRow = studentData[0] || [];
    
    console.log('📊 Dados do aluno encontrados:', {
      linha: enrollmentData.rowIndex,
      dadosCompletos: studentRow.length,
      nome: studentRow[0] || 'VAZIO',
      cpf: studentRow[1] || 'VAZIO',
      telefone: studentRow[2] || 'VAZIO',
      email: studentRow[3] || 'VAZIO'
    });

    // 3. Adicionar registro na aba "matriculas"
    console.log('📋 Adicionando registro na aba matriculas...');
    
    // Estrutura correta das colunas: nome, cpf, núcleo, subnucleo, ciclo, data, status, observacao
    const currentDate = new Date().toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // O ciclo já vem formatado corretamente do frontend
    const cicloFormatado = enrollmentData.ciclo;
    
    // Buscar nome na coluna E (índice 4) conforme estrutura da planilha
    const nomeAluno = studentRow[4] || 'Nome não encontrado';
    
    const matriculaRowData = [
      nomeAluno, // A - nome (coluna A da aba "dados pessoais")
      enrollmentData.cpf, // B - cpf
      '1979', // C - núcleo (sempre 1979 automaticamente)
      enrollmentData.subnucleo, // D - subnucleo
      cicloFormatado, // E - ciclo (formatado corretamente)
      currentDate, // F - data
      enrollmentData.status, // G - status (selecionado pelo secretário)
      enrollmentData.observacao || '' // H - observacao
    ];
    
    console.log('📝 Dados que serão salvos na aba matriculas:', {
      nome: matriculaRowData[0],
      cpf: matriculaRowData[1],
      nucleo: matriculaRowData[2],
      subnucleo: matriculaRowData[3],
      ciclo: matriculaRowData[4],
      data: matriculaRowData[5],
      status: matriculaRowData[6],
      observacao: matriculaRowData[7]
    });

    const matriculasRange = `${MATRICULAS_SHEET}!A:H`;
    await appendSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, matriculasRange, [matriculaRowData]);

    console.log('✅ Matrícula efetivada com sucesso');

    res.json({
      success: true,
      message: 'Matrícula efetivada com sucesso',
      shouldRefreshDashboard: true, // Sinal para atualizar o dashboard
      data: {
        cpf: enrollmentData.cpf,
        status: enrollmentData.status,
        ciclo: enrollmentData.ciclo,
        subnucleo: enrollmentData.subnucleo,
        dataEfetivacao: currentDate,
        nomeAluno: nomeAluno
      }
    });

  } catch (error) {
    console.error('❌ Erro ao efetivar matrícula:', error);
    
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
    function: 'finalize-enrollment',
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleCredentials: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    }
  });
});

export default router;