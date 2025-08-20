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
 * Gera identificador único temporal incluindo período/mês
 */
function generateTemporalId(cpf, periodo) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const cpfSuffix = cpf.replace(/\D/g, '').slice(-4);
  const periodoFormatted = periodo.replace(/\s+/g, '').toUpperCase();
  return `${periodoFormatted}${cpfSuffix}${timestamp.slice(-4)}`;
}

/**
 * Gera payload PIX estático ultra-simples - apenas chave PIX
 */
function generatePixPayload(nomeAluno, cpf, identificadorTemporal, livro, periodo) {
  console.log('🎯 INÍCIO DA FUNÇÃO generatePixPayload');
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
    
    console.log('✅ PIX com valor predefinido gerado:', staticPix.length, 'caracteres');
    console.log('📋 Código completo:', staticPix);
    return staticPix;
  } catch (error) {
    console.error('❌ Erro na função generatePixPayload:', error);
    throw error;
  }
}

/**
 * Gera PIX mensal com identificador temporal e salva diretamente na aba pagamentos
 */
router.post('/', async (req, res) => {
  try {
    const { cpf, nome, livro, ciclo, periodo, external_reference } = req.body;
    
    if (!cpf || !nome || !livro) {
      return res.status(400).json({ 
        error: 'CPF, nome e livro são obrigatórios' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    const PAGAMENTOS_SHEET = 'pagamentos';

    // Definir período padrão se não fornecido
    const periodoAtual = periodo || new Date().toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: '2-digit' 
    }).replace('/', '');

    console.log(`🔍 Gerando PIX mensal para: ${nome} (${cpf}) - ${livro} - Período: ${periodoAtual}`);

    // Buscar dados do aluno na planilha dados pessoais
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
        studentRowIndex = i + 1;
        break;
      }
    }

    if (!studentRow) {
      return res.status(404).json({ 
        error: 'Aluno não encontrado na planilha' 
      });
    }

    const nomeAluno = studentRow[4] || nome; // Coluna E - índice 4
    const emailAluno = studentRow[8] || ''; // Coluna I - índice 8
    
    // Usar external_reference fornecido ou gerar identificador temporal único
    const identificadorTemporal = external_reference || generateTemporalId(cpf, periodoAtual);
    
    // Verificar se já existe transação para este período
    let pagamentosData = [];
    try {
      pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:N`);
    } catch (error) {
      console.log('📋 Aba pagamentos não encontrada, será criada automaticamente');
    }

    // Verificar duplicidade pelo identificador exato
    if (pagamentosData && pagamentosData.length > 1) {
      for (let i = 1; i < pagamentosData.length; i++) {
        const row = pagamentosData[i];
        const externalRef = row[0] || '';
        
        if (externalRef === identificadorTemporal) {
          return res.status(400).json({ 
            error: `Já existe uma transação com este identificador: ${identificadorTemporal}`,
            dados: {
              identificador_existente: externalRef,
              nome: row[6] || '',
              data_criacao: row[4] || ''
            }
          });
        }
      }
    }
    
    // Gerar payload PIX com identificador temporal
    console.log('🚀 ANTES DE CHAMAR generatePixPayload...');
    console.log('🚀 Parâmetros:', { nomeAluno, cpf, identificadorTemporal, livro, periodoAtual });
    console.log('🚀 Tipo da função:', typeof generatePixPayload);
    
    const pixPayload = generatePixPayload(nomeAluno, cpf, identificadorTemporal, livro, periodoAtual);
    
    console.log('🚀 DEPOIS DE CHAMAR generatePixPayload');
    console.log('🚀 Payload PIX retornado:', pixPayload ? pixPayload.length + ' caracteres' : 'VAZIO');
    
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
    
    // Preparar dados para salvar na aba pagamentos
    const dataAtual = new Date().toLocaleString('pt-BR');
    const cicloFormatado = ciclo || '1º Ciclo';
    
    // Estrutura: external_reference, Email, Transação_ID, Valor, Data_PIX, Status, Nome, cpf, Data_Pagamento, Validade, Pix_url, Pix_base64, livro, ciclo
    const pagamentoRow = [
      identificadorTemporal, // A - external_reference
      emailAluno, // B - Email
      `PIX_${identificadorTemporal}`, // C - Transação_ID
      VALOR_PIX.toFixed(2), // D - Valor
      dataAtual, // E - Data_PIX
      'Pendente', // F - Status
      nomeAluno, // G - Nome
      cpf, // H - cpf
      '', // I - Data_Pagamento (vazio até confirmação)
      '', // J - Validade (vazio para PIX)
      '', // K - Pix_url (vazio)
      qrCodeData, // L - Pix_base64
      livro, // M - livro
      cicloFormatado // N - ciclo
    ];
    
    // Salvar na aba pagamentos
    const nextRow = pagamentosData ? pagamentosData.length + 1 : 2;
    const range = `${PAGAMENTOS_SHEET}!A${nextRow}:N${nextRow}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [pagamentoRow]);

    console.log(`✅ PIX mensal gerado e salvo para ${nomeAluno} (${cpf}) - ${livro}`);
    console.log(`🔑 Identificador temporal: ${identificadorTemporal}`);
    console.log(`📅 Período: ${periodoAtual}`);

    console.log('✅ PIX estático gerado com sucesso');
    
    // Resposta simplificada
    res.json({
      success: true,
      aluno: {
        nome: nomeAluno,
        cpf: cpf,
        livro: livro,
        ciclo: cicloFormatado,
        periodo: periodoAtual
      },
      transacao: {
        id: identificadorTemporal,
        valor: VALOR_PIX, // Valor de referência
        data: new Date().toISOString()
      },
      pix: {
        chave: CHAVE_PIX,
        payload: pixPayload,
        qrcode: qrCodeData,
        tipo: 'estatico' // PIX estático sem valor fixo
      },
      instrucoes: {
        aluno: `Olá ${nomeAluno}! Seu PIX para o livro "${livro}" (${periodoAtual}) foi gerado. IMPORTANTE: Informe o valor R$ ${VALOR_PIX.toFixed(2)} no seu app bancário. Use o QR Code ou copie o código PIX.`,
        secretaria: `PIX estático gerado para ${nomeAluno} - ${livro} (${periodoAtual}). ID: ${identificadorTemporal}. Valor a ser informado: R$ ${VALOR_PIX.toFixed(2)}`
      },
       message: 'PIX mensal estático com identificador temporal gerado com sucesso'
     });

  } catch (error) {
    console.error('[generate-monthly-pix] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'generate-monthly-pix',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;