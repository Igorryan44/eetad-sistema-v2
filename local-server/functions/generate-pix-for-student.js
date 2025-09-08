import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import QRCode from 'qrcode';
import { createStaticPix, hasError } from 'pix-utils';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Função para gerar QR Code PIX para um aluno específico
 * Esta função não salva na planilha, apenas gera o QR Code
 */
router.post('/', async (req, res) => {
  try {
    const { nome, cpf } = req.body;
    
    if (!nome || !cpf) {
      return res.status(400).json({ 
        error: 'Nome e CPF são obrigatórios' 
      });
    }

    const CHAVE_PIX = process.env.CHAVE_PIX_ESTATICA || 'simacjr@gmail.com';
    const VALOR_PIX = 45; // Valor fixo em reais
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    console.log(`👤 Gerando QR Code PIX para: ${nome} (CPF: ${cpf})`);
    console.log(`💰 Valor: R$ ${VALOR_PIX},00`);
    console.log(`🔑 Chave PIX: ${CHAVE_PIX}`);

    // Gerar código PIX usando biblioteca pix-utils (padrão BRCode correto)
    const pixObject = createStaticPix({
      merchantName: 'EETAD',
      merchantCity: 'SAO PAULO',
      pixKey: CHAVE_PIX,
      transactionAmount: VALOR_PIX,
      additionalInfo: `Pagamento de livro - CPF: ${cpfLimpo}`
    });
    
    if (hasError(pixObject)) {
      console.error('❌ Erro na geração do PIX:', pixObject);
      throw new Error('Erro ao gerar código PIX: ' + pixObject.error);
    }
    
    const pixCode = pixObject.toBRCode();
    
    // Validações do código PIX
    if (!pixCode || pixCode.length < 50) {
      throw new Error('Código PIX inválido ou muito curto');
    }
    
    if (!pixCode.includes(CHAVE_PIX)) {
      throw new Error('Chave PIX não encontrada no código gerado');
    }
    
    console.log(`📋 Código PIX gerado: ${pixCode.length} caracteres`);
    console.log(`🔍 Código completo: ${pixCode}`);
    
    console.log(`📱 Gerando QR Code...`);
    
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
    
    console.log(`✅ QR Code PIX gerado com sucesso para ${nome}`);
    
    return res.status(200).json({
      success: true,
      message: 'QR Code PIX gerado com sucesso',
      student_data: {
        nome: nome,
        cpf: cpf,
        cpf_limpo: cpfLimpo
      },
      pix_data: {
        chave_pix: CHAVE_PIX,
        valor_pix: VALOR_PIX,
        pix_code: pixCode,
        pix_copia_cola: pixCode,
        qr_code_base64: qrCodeBase64,
        descricao: `Pagamento de livro - CPF: ${cpfLimpo}`
      },
      instrucoes: {
        como_salvar_na_planilha: {
          coluna: 'Z (QR Code PIX estático)',
          valor_a_salvar: 'qr_code_base64',
          formato: 'Base64 da imagem PNG do QR Code'
        },
        como_usar: {
          qr_code: 'Escaneie o QR Code com o app do banco',
          copia_cola: 'Ou copie e cole o código PIX no app do banco',
          valor: `R$ ${VALOR_PIX},00`,
          chave_vinculada: `${CHAVE_PIX} (vinculada ao CPF: ${cpf})`
        }
      }
    });

  } catch (error) {
    console.error('[generate-pix-for-student] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'generate-pix-for-student',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;