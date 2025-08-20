import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetData } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📋 Verificando cabeçalhos da aba pedidos...');

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const PEDIDOS_SHEET = 'pedidos';

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // Buscar apenas a primeira linha (cabeçalhos)
    const range = `${PEDIDOS_SHEET}!A1:H1`;
    const headers = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range);

    console.log('📋 Cabeçalhos encontrados:', headers);

    // Buscar algumas linhas de dados para ver o formato
    const dataRange = `${PEDIDOS_SHEET}!A1:H10`;
    const sampleData = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, dataRange);

    console.log('📋 Dados de exemplo:', sampleData);

    res.json({
      success: true,
      headers: headers,
      sampleData: sampleData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar cabeçalhos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'check-pedidos-headers',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;