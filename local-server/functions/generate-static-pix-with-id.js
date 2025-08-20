import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';
import QRCode from 'qrcode';

const router = express.Router();
router.use(corsMiddleware);

// Configurações PIX
const CHAVE_PIX = process.env.CHAVE_PIX || 'eetad@exemplo.com';
const VALOR_PIX = parseFloat(process.env.VALOR_PIX) || 50.00;
const BENEFICIARIO = process.env.BENEFICIARIO || 'EETAD';
const CIDADE = process.env.CIDADE || 'SAO PAULO';

/**
 * Gera um identificador único de 8 caracteres alfanuméricos
 */
function generateUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gera payload PIX com identificador único
 */
function generatePixPayload(nomeAluno, cpf, identificador) {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const descricao = `Livro ${nomeAluno} CPF:${cpfLimpo} ID:${identificador}`;
  
  // Formato PIX EMV QR Code
  const payload = [
    '00020126', // Payload Format Indicator
    '800014br.gov.bcb.pix', // Merchant Account Information
    `01${(CHAVE_PIX.length + 4).toString().padStart(2, '0')}${CHAVE_PIX}`, // PIX Key
    `02${(descricao.length).toString().padStart(2, '0')}${descricao}`, // Description
    '52040000', // Merchant Category Code
    '5303986', // Transaction Currency (BRL)
    `54${(VALOR_PIX.toFixed(2).length).toString().padStart(2, '0')}${VALOR_PIX.toFixed(2)}`, // Transaction Amount
    '5802BR', // Country Code
    `59${(BENEFICIARIO.length).toString().padStart(2, '0')}${BENEFICIARIO}`, // Merchant Name
    `60${(CIDADE.length).toString().padStart(2, '0')}${CIDADE}`, // Merchant City
    `62${(identificador.length + 7).toString().padStart(2, '0')}0503${identificador}`, // Additional Data Field
    '6304' // CRC16
  ].join('');
  
  // Calcular CRC16
  const crc = calculateCRC16(payload.slice(0, -4));
  return payload.slice(0, -4) + crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Calcula CRC16 para PIX
 */
function calculateCRC16(data) {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc;
}

router.post('/', async (req, res) => {
  try {
    const { cpf, nome } = req.body;
    
    if (!cpf || !nome) {
      return res.status(400).json({ 
        error: 'CPF e nome são obrigatórios' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';

    console.log(`🔍 Gerando PIX estático com ID para: ${nome} (${cpf})`);

    // Buscar dados da planilha
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:AA`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum dado encontrado na planilha' 
      });
    }

    // Procurar pelo CPF (coluna G - índice 6)
    let studentRow = null;
    let studentRowIndex = -1;
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row[6] && row[6].toString().replace(/\D/g, '') === cpfLimpo) {
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

    const nomeAluno = studentRow[4] || nome; // Coluna E - índice 4
    
    // Gerar identificador único
    const identificadorUnico = generateUniqueId();
    
    // Gerar payload PIX com identificador
    const pixPayload = generatePixPayload(nomeAluno, cpf, identificadorUnico);
    
    // Gerar QR Code
    const qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    
    // Remover prefixo data:image/png;base64,
    const qrCodeData = qrCodeBase64.replace(/^data:image\/png;base64,/, '');
    
    // Salvar na coluna AA (índice 26) - nova coluna para PIX com identificador
    const updatedRow = [...studentRow];
    while (updatedRow.length < 27) {
      updatedRow.push(''); // Preencher colunas vazias se necessário
    }
    updatedRow[26] = qrCodeData; // Coluna AA - PIX estático com identificador
    
    // Atualizar a linha na planilha
    const range = `${DADOS_PESSOAIS_SHEET}!A${studentRowIndex}:AA${studentRowIndex}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [updatedRow]);

    console.log(`✅ PIX estático com ID gerado e salvo para ${nomeAluno} (${cpf})`);
    console.log(`🔑 Identificador único: ${identificadorUnico}`);

    return res.status(200).json({
      success: true,
      dados_aluno: {
        nome: nomeAluno,
        cpf: cpf
      },
      pix_info: {
        valor: VALOR_PIX,
        chave_pix: CHAVE_PIX,
        descricao: `Livro ${nomeAluno} CPF:${cpfLimpo} ID:${identificadorUnico}`,
        beneficiario: BENEFICIARIO,
        payload: pixPayload
      },
      identificador: {
        id: identificadorUnico,
        instrucoes: 'Use este identificador para confirmar o pagamento'
      },
      qr_code_base64: qrCodeData,
      instrucoes: {
        aluno: [
          'Escaneie o QR Code com seu app de pagamentos',
          'Ou copie e cole a chave PIX: ' + CHAVE_PIX,
          'Confirme o pagamento no valor de R$ ' + VALOR_PIX.toFixed(2),
          'Guarde o identificador: ' + identificadorUnico
        ],
        secretaria: [
          'QR Code salvo na coluna AA da planilha dados pessoais',
          'Use o identificador ' + identificadorUnico + ' para rastrear o pagamento',
          'Confirme o pagamento usando a função confirm-pix-by-id'
        ]
      },
      message: 'PIX estático com identificador gerado com sucesso'
    });

  } catch (error) {
    console.error('[generate-static-pix-with-id] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'generate-static-pix-with-id',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;