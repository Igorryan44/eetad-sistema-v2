import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { appendSheetData } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📚 Salvando pedido de livro:', req.body);

    const orderData = req.body;
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const PEDIDOS_SHEET = 'pedidos';

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // Preparar dados para inserção
    const currentTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    const rowData = [
      orderData.external_reference || '', // A - external_reference
      orderData.cpf || '', // B - cpf
      orderData.name || orderData.nome_do_aluno || '', // C - nome_do_aluno
      orderData.ciclo || '', // D - ciclo
      orderData.bookName || orderData.livro || '', // E - livro
      orderData.data_pedido || currentTimestamp, // F - data_pedido
      orderData.observacao || '', // G - observacao
      orderData.status_pedido || 'Pendente' // H - status_pedido
    ];

    console.log('📚 Dados preparados para inserção:', rowData);

    const range = `${PEDIDOS_SHEET}!A:H`;
    await appendSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [rowData]);

    console.log('✅ Pedido de livro salvo com sucesso');

    res.json({
      success: true,
      message: 'Pedido de livro salvo com sucesso',
      external_reference: orderData.external_reference,
      timestamp: currentTimestamp
    });

  } catch (error) {
    console.error('❌ Erro ao salvar pedido de livro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'save-book-order',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;