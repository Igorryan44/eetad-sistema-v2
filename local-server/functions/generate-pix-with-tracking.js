import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData, appendSheetData } from '../utils/google-auth.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { createStaticPix, hasError } from 'pix-utils';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Função para gerar QR Code PIX com rastreamento único
 * Cria um identificador único para cada pagamento e salva na planilha de controle
 */
router.post('/', async (req, res) => {
  try {
    const { nome, cpf, valor } = req.body;
    
    if (!nome || !cpf) {
      return res.status(400).json({ 
        error: 'Nome e CPF são obrigatórios' 
      });
    }

    const CHAVE_PIX = process.env.CHAVE_PIX_ESTATICA || 'simacjr@gmail.com';
    const VALOR_PIX = valor || 45; // Valor padrão em reais
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    console.log(`👤 Gerando PIX com rastreamento para: ${nome} (CPF: ${cpf})`);
    console.log(`💰 Valor: R$ ${VALOR_PIX},00`);
    console.log(`🔑 Chave PIX: ${CHAVE_PIX}`);

    // Gerar identificador único para este pagamento
    const trackingId = crypto.randomBytes(8).toString('hex').toUpperCase();
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    console.log(`🆔 ID de rastreamento: ${trackingId}`);

    // Criar descrição com ID de rastreamento
    const descricao = `Livro EETAD - ID: ${trackingId}`;
    
    console.log(`🔧 Gerando PIX ultra-simples para máxima compatibilidade...`);
    
    // Usar configuração minimalista para máxima compatibilidade bancária
    const pixObject = createStaticPix({
      merchantName: 'EETAD',
      merchantCity: 'SAO PAULO',
      pixKey: CHAVE_PIX,
      transactionAmount: VALOR_PIX
      // Não usar additionalInfo ou infoAdicional para evitar conflitos
    });
    
    if (hasError(pixObject)) {
      console.error('❌ Erro na geração do PIX com pix-utils:', pixObject);
      throw new Error('Erro ao gerar PIX: ' + pixObject.error);
    }
    
    // Converter para string BR Code
    const pixCode = pixObject.toBRCode();
    
    // Validações de segurança
    if (!pixCode || pixCode.length < 50) {
      throw new Error('Código PIX inválido ou muito curto');
    }
    
    if (!pixCode.includes(CHAVE_PIX)) {
      throw new Error('Chave PIX não encontrada no código gerado');
    }
    
    console.log(`✅ PIX ultra-simples gerado com ${pixCode.length} caracteres`);
    console.log(`🔍 Código completo: ${pixCode}`);
    console.log(`📊 Formato: Minimalista para máxima compatibilidade`);
    
    console.log(`📱 Gerando QR Code...`);
    
    // Gerar QR Code em Base64
    const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
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
    
    // Remover o prefixo data:image/png;base64, para retornar apenas o base64
    const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    // Salvar registro de rastreamento na planilha
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const TRACKING_SHEET = 'rastreamento_pix';
    
    try {
      const trackingData = [
        trackingId,           // A - ID de rastreamento
        nome,                 // B - Nome do aluno
        cpfLimpo,            // C - CPF limpo
        VALOR_PIX,           // D - Valor
        CHAVE_PIX,           // E - Chave PIX
        descricao,           // F - Descrição
        'Pendente',          // G - Status
        timestamp,           // H - Data/hora criação
        '',                  // I - Data/hora pagamento
        '',                  // J - Observações
        pixCode.substring(0, 50) + '...' // K - Código PIX (truncado para visualização)
      ];
      
      await appendSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A:K`, [trackingData]);
      console.log(`✅ Registro de rastreamento salvo: ${trackingId}`);
    } catch (trackingError) {
      console.warn(`⚠️ Erro ao salvar rastreamento (continuando): ${trackingError.message}`);
    }

    console.log(`✅ QR Code PIX gerado com sucesso para ${nome}`);

    return res.status(200).json({
      success: true,
      tracking_id: trackingId,
      nome: nome,
      cpf: cpf,
      valor: VALOR_PIX,
      chave_pix: CHAVE_PIX,
      descricao: descricao,
      pix_code: pixCode,
      qr_code_base64: qrCodeBase64,
      instrucoes: {
        para_aluno: [
          `1. Use o código de rastreamento: ${trackingId}`,
          "2. Escaneie o QR Code com o app do banco",
          "3. Ou copie e cole o código PIX no app do banco",
          `4. Confirme o pagamento de R$ ${VALOR_PIX},00`,
          "5. Envie o comprovante para a secretaria junto com o código de rastreamento",
          "6. Aguarde a confirmação do pagamento"
        ],
        para_secretaria: [
          `1. Código de rastreamento: ${trackingId}`,
          "2. Use este código para confirmar o pagamento",
          "3. Verifique o comprovante do aluno",
          "4. Confirme o pagamento usando a função de confirmação"
        ]
      },
      observacao: `Código de rastreamento: ${trackingId} - Use este código para identificar o pagamento`
    });

  } catch (error) {
    console.error('[generate-pix-with-tracking] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'generate-pix-with-tracking',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;