import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';
import QRCode from 'qrcode';
import { createStaticPix, hasError } from 'pix-utils';

const router = express.Router();
router.use(corsMiddleware);

// Configurações PIX
const CHAVE_PIX = process.env.CHAVE_PIX_ESTATICA || 'simacjr@gmail.com';
const VALOR_PIX = parseFloat(process.env.VALOR_PIX) || 45.00;
const BENEFICIARIO = process.env.BENEFICIARIO || 'EETAD';
const CIDADE = process.env.CIDADE || 'SAO PAULO';

/**
 * Gera payload PIX estático ultra-simples - apenas chave PIX
 */
function generatePixPayload(nomeAluno, cpf, identificadorTemporal, livro, periodo) {
  console.log('🎯 INÍCIO DA FUNÇÃO generatePixPayload (regenerate)');
  console.log('🎯 Parâmetros recebidos:', { nomeAluno, cpf, identificadorTemporal, livro, periodo });
  try {
    console.log('🔍 Gerando PIX estático com valor predefinido:');
    console.log('  - Chave PIX:', CHAVE_PIX);
    console.log('  - Beneficiário:', BENEFICIARIO);
    console.log('  - Cidade:', CIDADE);
    console.log('  - Valor:', `R$ ${VALOR_PIX.toFixed(2)}`);
    console.log('  - SEM identificador (PIX mais limpo)');
    
    // PIX estático com valor predefinido
    const pixObject = createStaticPix({
      merchantName: BENEFICIARIO,
      merchantCity: CIDADE,
      pixKey: CHAVE_PIX,
      transactionAmount: VALOR_PIX // Incluir valor fixo de R$ 45,00
    });
    
    console.log('🔧 Objeto PIX criado:', pixObject);
    
    if (hasError(pixObject)) {
      console.error('❌ Erro na geração do PIX com pix-utils:', pixObject);
      throw new Error('Erro ao gerar PIX: ' + pixObject.error);
    }
    
    // Converter para string BR Code
    const staticPix = pixObject.toBRCode();
    console.log('🔧 BR Code gerado:', staticPix);
    
    // Validações adicionais
    if (!staticPix || staticPix.length < 50) {
      console.error('❌ Código PIX inválido ou muito curto:', staticPix);
      throw new Error('Código PIX inválido ou muito curto');
    }
    
    if (!staticPix.includes(CHAVE_PIX)) {
      console.error('❌ Chave PIX não encontrada no código gerado');
      throw new Error('Chave PIX não encontrada no código gerado');
    }
    
    console.log('✅ PIX com valor predefinido regenerado:', staticPix.length, 'caracteres');
    console.log('📋 Código completo:', staticPix);
    return staticPix;
  } catch (error) {
    console.error('❌ Erro na função generatePixPayload (regenerate):', error);
    throw error;
  }
}

/**
 * Regenera QR Code PIX para pagamento mensal e atualiza no banco de dados
 */
router.post('/', async (req, res) => {
  try {
    const { cpf, nome, livro, external_reference } = req.body;
    
    if (!cpf || !nome) {
      return res.status(400).json({ 
        error: 'CPF e nome são obrigatórios para regenerar o QR Code' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const PAGAMENTOS_SHEET = 'pagamentos';
    
    console.log('🔄 [regenerate-pix-qrcode] Regenerando QR Code PIX para:', {
      cpf,
      nome,
      livro,
      external_reference
    });

    // Gerar novo identificador temporal
    const agora = new Date();
    const identificadorTemporal = `PIX_${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}_${cpf.replace(/\D/g, '')}_${Date.now()}`;
    
    console.log('🆔 Novo identificador temporal:', identificadorTemporal);

    // Gerar novo payload PIX
    const pixPayload = generatePixPayload(nome, cpf, identificadorTemporal, livro, 'mensal');
    
    // Gerar novo QR Code
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
    
    // Buscar registro existente na aba pagamentos
    const pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:N`);
    
    let linhaEncontrada = -1;
    let registroExistente = null;
    
    if (pagamentosData && pagamentosData.length > 1) {
      for (let i = 1; i < pagamentosData.length; i++) {
        const row = pagamentosData[i];
        const cpfRow = row[7] ? row[7].toString().replace(/\D/g, '') : '';
        const livroRow = row[12] || '';
        
        if (cpfRow === cpf.replace(/\D/g, '') && livroRow === livro) {
          linhaEncontrada = i + 1; // +1 porque as linhas começam em 1
          registroExistente = row;
          console.log('📍 Registro existente encontrado na linha:', linhaEncontrada);
          break;
        }
      }
    }
    
    const dataAtual = new Date().toLocaleString('pt-BR');
    
    if (linhaEncontrada > 0 && registroExistente) {
      // Atualizar registro existente
      console.log('🔄 Atualizando registro existente...');
      
      // Manter dados existentes e atualizar apenas campos necessários
      const registroAtualizado = [...registroExistente];
      
      // Garantir que o array tenha pelo menos 14 elementos
      while (registroAtualizado.length < 14) {
        registroAtualizado.push('');
      }
      
      // Atualizar campos específicos
      registroAtualizado[0] = identificadorTemporal; // A - external_reference (novo)
      registroAtualizado[4] = dataAtual; // E - Data_PIX (atualizada)
      registroAtualizado[10] = pixPayload; // K - Pix_url (novo payload)
      registroAtualizado[11] = qrCodeData; // L - Pix_base64 (novo QR Code)
      
      // Atualizar a linha específica
      const range = `${PAGAMENTOS_SHEET}!A${linhaEncontrada}:N${linhaEncontrada}`;
      await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [registroAtualizado]);
      
      console.log('✅ Registro atualizado na linha:', linhaEncontrada);
    } else {
      // Criar novo registro
      console.log('➕ Criando novo registro...');
      
      const cicloFormatado = '1º Ciclo';
      
      // Estrutura: external_reference, Email, Transação_ID, Valor, Data_PIX, Status, Nome, cpf, Data_Pagamento, Validade, Pix_url, Pix_base64, livro, ciclo
      const pagamentoRow = [
        identificadorTemporal, // A - external_reference
        '', // B - Email
        '', // C - Transação_ID
        VALOR_PIX, // D - Valor
        dataAtual, // E - Data_PIX
        'pending', // F - Status
        nome, // G - Nome
        cpf, // H - cpf
        '', // I - Data_Pagamento
        '', // J - Validade
        pixPayload, // K - Pix_url
        qrCodeData, // L - Pix_base64
        livro || '', // M - livro
        cicloFormatado // N - ciclo
      ];
      
      // Adicionar nova linha
      const range = `${PAGAMENTOS_SHEET}!A:N`;
      const novaLinha = [pagamentoRow];
      
      // Encontrar próxima linha vazia
      const proximaLinha = pagamentosData ? pagamentosData.length + 1 : 2;
      const rangeEspecifico = `${PAGAMENTOS_SHEET}!A${proximaLinha}:N${proximaLinha}`;
      
      await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, rangeEspecifico, novaLinha);
      
      console.log('✅ Novo registro criado na linha:', proximaLinha);
    }
    
    console.log('🎉 QR Code PIX regenerado com sucesso!');
    
    return res.status(200).json({
      success: true,
      message: 'QR Code PIX regenerado com sucesso',
      transacao: {
        id: identificadorTemporal,
        status: 'pending'
      },
      pix: {
        chave: CHAVE_PIX,
        payload: pixPayload,
        qrcode: qrCodeData,
        tipo: 'PIX_MENSAL_REGENERADO'
      },
      dados_atualizados: {
        linha_planilha: linhaEncontrada > 0 ? linhaEncontrada : 'nova',
        data_regeneracao: dataAtual
      }
    });
    
  } catch (error) {
    console.error('[regenerate-pix-qrcode] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor ao regenerar QR Code',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'regenerate-pix-qrcode',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;