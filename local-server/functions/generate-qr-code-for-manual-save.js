import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import QRCode from 'qrcode';
import { createStaticPix, hasError } from 'pix-utils';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Função para gerar QR Code PIX e fornecer instruções de salvamento manual
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
    
    console.log(`👤 Gerando QR Code PIX para salvamento manual: ${nome} (CPF: ${cpf})`);
    console.log(`💰 Valor: R$ ${VALOR_PIX},00`);
    console.log(`🔑 Chave PIX: ${CHAVE_PIX}`);

    // Usar biblioteca pix-utils com configuração ultra-simples
    const pixObject = createStaticPix({
      merchantName: 'EETAD',
      merchantCity: 'SAO PAULO',
      pixKey: CHAVE_PIX,
      transactionAmount: VALOR_PIX
      // Sem informações adicionais para máxima compatibilidade
    });
    
    if (hasError(pixObject)) {
      console.error('❌ Erro na geração do PIX:', pixObject);
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
    
    console.log(`📋 Código PIX ultra-simples: ${pixCode.length} caracteres`);
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
      message: 'QR Code PIX gerado com sucesso - Pronto para salvamento manual',
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
      instrucoes_salvamento_manual: {
        planilha: "dados pessoais",
        coluna: "Z",
        nome_coluna: "QR Code PIX estático",
        valor_a_copiar: qrCodeBase64,
        passos: [
          "1. Abra a planilha 'dados pessoais' no Google Sheets",
          "2. Encontre a linha do aluno pelo nome ou CPF",
          "3. Vá até a coluna Z (QR Code PIX estático)",
          "4. Cole o valor do campo 'qr_code_base64' na célula",
          "5. Salve a planilha"
        ],
        observacao: "O QR Code está em formato Base64 e pode ser usado diretamente no sistema"
      },
      como_usar_qr_code: {
        para_aluno: [
          "1. Escaneie o QR Code com o app do banco",
          "2. Ou copie e cole o código PIX no app do banco",
          "3. Confirme o pagamento de R$ 45,00",
          "4. Envie o comprovante para a secretaria"
        ],
        chave_vinculada: `${CHAVE_PIX} (vinculada ao CPF: ${cpf})`
      }
    });

  } catch (error) {
    console.error('[generate-qr-code-for-manual-save] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'generate-qr-code-for-manual-save',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;