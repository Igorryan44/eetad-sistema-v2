import { createStaticPix, hasError } from 'pix-utils';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const handler = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, cpf, valor } = req.body;

    if (!nome || !cpf || !valor) {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        details: 'Nome, CPF e valor são obrigatórios'
      });
    }

    // Obter chave PIX das variáveis de ambiente
    const chavePix = process.env.CHAVE_PIX_ESTATICA;
    if (!chavePix) {
      return res.status(500).json({
        error: 'Configuração inválida',
        details: 'Chave PIX não configurada'
      });
    }

    console.log(`[generate-static-pix] Gerando PIX para: ${nome}, CPF: ${cpf}, Valor: R$ ${valor}`);
    
    // Criar PIX estático
    const staticPix = createStaticPix({
      merchantName: 'EETAD',
      merchantCity: 'SAO PAULO',
      pixKey: chavePix,
      infoAdicional: `Pagamento de livro - CPF: ${cpf}`,
      transactionAmount: parseFloat(valor)
    });

    if (hasError(staticPix)) {
      console.error('Erro na geração do PIX:', staticPix);
      throw new Error('Erro ao gerar código PIX');
    }

    // Gerar código PIX
    const pixCode = staticPix.toBRCode();

    // Gerar QR Code em base64
    const qrCodeBase64 = await QRCode.toDataURL(pixCode, {
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
    const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, '');

    console.log(`[generate-static-pix] PIX gerado para ${nome} (${cpf}) - Valor: R$ ${valor}`);

    return res.status(200).json({
      success: true,
      pix_code: pixCode,
      qr_code_base64: base64Data,
      chave_pix: chavePix,
      valor: parseFloat(valor),
      info_adicional: `Pagamento de livro - CPF: ${cpf}`
    });

  } catch (error) {
    console.error('[generate-static-pix] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

export default handler;