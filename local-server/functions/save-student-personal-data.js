import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { appendSheetData } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📝 Salvando dados pessoais do aluno:', req.body);

    const studentData = req.body;
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // Preparar dados para inserção
    const currentTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    const rowData = [
      currentTimestamp,
      studentData.nome || '',
      studentData.nucleo || '',
      studentData.cpf || '',
      studentData.rg || '',
      studentData.nascimento || '',
      studentData.telefone || '',
      studentData.email || '',
      studentData.endereco || '',
      studentData.numero || '',
      studentData.complemento || '',
      studentData.bairro || '',
      studentData.cidade || '',
      studentData.cep || '',
      studentData.estado || '',
      studentData.profissao || '',
      studentData.escolaridade || '',
      studentData.estadoCivil || '',
      studentData.nomeConjuge || '',
      studentData.telefoneConjuge || '',
      studentData.nomeFilho1 || '',
      studentData.idadeFilho1 || '',
      studentData.nomeFilho2 || '',
      studentData.idadeFilho2 || '',
      'Pendente' // Status inicial
    ];

    const range = `${DADOS_PESSOAIS_SHEET}!A:Y`;
    await appendSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [rowData]);

    console.log('✅ Dados pessoais salvos com sucesso');

    res.json({
      success: true,
      message: 'Dados pessoais salvos com sucesso',
      timestamp: currentTimestamp
    });

  } catch (error) {
    console.error('❌ Erro ao salvar dados pessoais:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'save-student-personal-data',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;