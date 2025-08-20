import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    const { cpf } = req.body;
    
    if (!cpf) {
      return res.status(400).json({ 
        error: 'CPF é obrigatório' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';

    console.log(`🔍 Buscando QR Code PIX para CPF: ${cpf}`);

    // Buscar dados da planilha
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:Z`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum dado encontrado na planilha' 
      });
    }

    // Procurar pelo CPF (coluna G - índice 6)
    let studentRow = null;
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row[6] && row[6].toString().replace(/\D/g, '') === cpf.replace(/\D/g, '')) {
        studentRow = row;
        break;
      }
    }

    if (!studentRow) {
      return res.status(404).json({ 
        error: 'Aluno não encontrado' 
      });
    }

    const qrCodePix = studentRow[25] || ''; // Coluna Z - índice 25
    const nomeAluno = studentRow[4] || ''; // Coluna E - índice 4

    if (!qrCodePix) {
      console.log(`⚠️ QR Code PIX não encontrado para ${nomeAluno} (${cpf})`);
      return res.status(404).json({ 
        error: 'QR Code PIX não encontrado para este aluno',
        nome: nomeAluno
      });
    }

    console.log(`✅ QR Code PIX encontrado para ${nomeAluno} (${cpf})`);

    return res.status(200).json({
      success: true,
      nome: nomeAluno,
      cpf: cpf,
      qr_code_base64: qrCodePix,
      message: 'QR Code PIX encontrado com sucesso'
    });

  } catch (error) {
    console.error('[get-student-pix-qrcode] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'get-student-pix-qrcode',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;