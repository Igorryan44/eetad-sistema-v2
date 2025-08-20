import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';
import QRCode from 'qrcode';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Função para gerar e salvar QR Code PIX para um aluno específico na planilha
 */
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
    const CHAVE_PIX = process.env.CHAVE_PIX_ESTATICA || 'simacjr@gmail.com';
    const VALOR_PIX = 45; // Valor fixo em reais

    console.log(`🔍 Buscando aluno com CPF: ${cpf}`);

    // Buscar dados da planilha
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:Z`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum dado encontrado na planilha' 
      });
    }

    // Procurar pelo CPF (coluna G - índice 6)
    let studentRowIndex = -1;
    let studentRow = null;
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row[6] && row[6].toString().replace(/\D/g, '') === cpf.replace(/\D/g, '')) {
        studentRow = row;
        studentRowIndex = i + 1; // +1 porque as linhas da planilha começam em 1
        break;
      }
    }

    if (!studentRow) {
      return res.status(404).json({ 
        error: 'Aluno não encontrado na planilha' 
      });
    }

    const nomeAluno = studentRow[4] || 'Aluno'; // Coluna E - índice 4
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    console.log(`👤 Aluno encontrado: ${nomeAluno} (${cpf}) na linha ${studentRowIndex}`);

    // Gerar código PIX
    const pixPayload = `00020126800014br.gov.bcb.pix0${(CHAVE_PIX.length + 4).toString().padStart(2, '0')}${CHAVE_PIX}02${(37 + cpfLimpo.length).toString().padStart(2, '0')}Pagamento de livro - CPF: ${cpfLimpo}520400005303986540${VALOR_PIX.toFixed(2)}5802BR5905EETAD6009SAO PAULO62070503***6304`;
    
    // Calcular CRC16 para o código PIX
    function calculateCRC16(payload) {
      const polynomial = 0x1021;
      let crc = 0xFFFF;
      
      for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
          if (crc & 0x8000) {
            crc = (crc << 1) ^ polynomial;
          } else {
            crc <<= 1;
          }
          crc &= 0xFFFF;
        }
      }
      
      return crc.toString(16).toUpperCase().padStart(4, '0');
    }
    
    const crc = calculateCRC16(pixPayload);
    const pixCode = pixPayload + crc;
    
    console.log(`💰 Gerando QR Code PIX para ${nomeAluno} - Valor: R$ ${VALOR_PIX},00`);
    
    // Gerar QR Code em Base64
    const qrCodeBase64 = await QRCode.toDataURL(pixCode, {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });
    
    console.log(`📱 QR Code gerado com sucesso`);
    
    // Salvar QR Code na coluna Z (índice 25)
    const range = `${DADOS_PESSOAIS_SHEET}!Z${studentRowIndex}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [[qrCodeBase64]]);
    
    console.log(`✅ QR Code salvo na planilha na linha ${studentRowIndex}, coluna Z`);
    
    return res.status(200).json({
      success: true,
      message: 'QR Code PIX gerado e salvo com sucesso',
      student_data: {
        nome: nomeAluno,
        cpf: cpf,
        linha_planilha: studentRowIndex
      },
      pix_data: {
        chave_pix: CHAVE_PIX,
        valor_pix: VALOR_PIX,
        pix_code: pixCode,
        pix_copia_cola: pixCode,
        qr_code_base64: qrCodeBase64,
        descricao: `Pagamento de livro - CPF: ${cpfLimpo}`
      },
      planilha_info: {
        coluna_qr_code: 'Z',
        linha_salva: studentRowIndex
      }
    });

  } catch (error) {
    console.error('[generate-and-save-student-pix] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'generate-and-save-student-pix',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;