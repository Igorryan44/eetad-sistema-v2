import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData, appendSheetData } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Extrai o identificador único do payload PIX ou descrição
 */
function extractIdFromDescription(description) {
  const match = description.match(/ID:([A-Z0-9]{8})/);
  return match ? match[1] : null;
}

/**
 * Confirma pagamento PIX usando identificador único
 */
router.post('/', async (req, res) => {
  try {
    const { identificador, valor_pago, comprovante_info, data_pagamento, observacoes } = req.body;
    
    if (!identificador) {
      return res.status(400).json({ 
        error: 'Identificador é obrigatório' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    const PAGAMENTOS_SHEET = 'pagamentos';

    console.log(`🔍 Confirmando pagamento PIX com identificador: ${identificador}`);

    // Buscar dados da planilha dados pessoais
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:AA`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum dado encontrado na planilha' 
      });
    }

    // Procurar pelo identificador na coluna AA (índice 26)
    let studentRow = null;
    let studentRowIndex = -1;
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const pixData = row[26] || ''; // Coluna AA - PIX com identificador
      
      // Verificar se o PIX contém o identificador
      if (pixData && pixData.includes && typeof pixData === 'string') {
        // Decodificar base64 e procurar pelo identificador
        try {
          const pixPayload = Buffer.from(pixData, 'base64').toString('utf-8');
          if (pixPayload.includes(`ID:${identificador}`)) {
            studentRow = row;
            studentRowIndex = i + 1;
            break;
          }
        } catch (e) {
          // Se não conseguir decodificar, pode ser que o identificador esteja diretamente no campo
          if (pixData.includes(identificador)) {
            studentRow = row;
            studentRowIndex = i + 1;
            break;
          }
        }
      }
    }

    if (!studentRow) {
      return res.status(404).json({ 
        error: `Identificador ${identificador} não encontrado` 
      });
    }

    const nomeAluno = studentRow[4] || ''; // Coluna E - nome
    const cpfAluno = studentRow[6] || ''; // Coluna G - cpf
    const telefoneAluno = studentRow[7] || ''; // Coluna H - telefone
    const emailAluno = studentRow[8] || ''; // Coluna I - email

    console.log(`👤 Aluno encontrado: ${nomeAluno} (${cpfAluno})`);

    // Verificar se já existe confirmação para este identificador na aba pagamentos
    let pagamentosData;
    try {
      pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:Z`);
    } catch (error) {
      console.log('📋 Aba pagamentos não encontrada');
      pagamentosData = [];
    }

    // Verificar se já foi confirmado (procurar pelo identificador na coluna external_reference)
    if (pagamentosData && pagamentosData.length > 1) {
      for (let i = 1; i < pagamentosData.length; i++) {
        const row = pagamentosData[i];
        const externalRef = row[0] || ''; // external_reference
        if (externalRef === identificador) {
          return res.status(400).json({ 
            error: `Pagamento ${identificador} já foi confirmado anteriormente`,
            dados: {
              nome: row[6] || '', // Nome
              cpf: row[7] || '', // CPF
              data_confirmacao: row[8] || '', // Data_Pagamento
              valor_confirmado: row[3] || '' // Valor
            }
          });
        }
      }
    }

    // Preparar dados da confirmação seguindo a estrutura da aba pagamentos
    const dataConfirmacao = data_pagamento || new Date().toLocaleString('pt-BR');
    const valorConfirmado = valor_pago || process.env.VALOR_PIX || '50.00';
    const dataPix = new Date().toLocaleString('pt-BR');
    
    // Estrutura: external_reference, Email, Transação_ID, Valor, Data_PIX, Status, Nome, cpf, Data_Pagamento, Validade, Pix_url, Pix_base64, livro, ciclo
    const confirmationRow = [
      identificador, // A - external_reference
      emailAluno || '', // B - Email
      `PIX_${identificador}`, // C - Transação_ID
      valorConfirmado, // D - Valor
      dataPix, // E - Data_PIX
      'Pago', // F - Status
      nomeAluno, // G - Nome
      cpfAluno, // H - cpf
      dataConfirmacao, // I - Data_Pagamento
      '', // J - Validade (vazio para PIX confirmado)
      '', // K - Pix_url (vazio, pois já foi usado)
      '', // L - Pix_base64 (vazio, pois já foi usado)
      'Livro EETAD', // M - livro
      process.env.CICLO_ATUAL || '2024' // N - ciclo
    ];

    // Salvar confirmação na aba pagamentos
    try {
      // Adicionar nova linha na aba pagamentos
      const nextRow = (pagamentosData?.length || 0) + 1;
      await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A${nextRow}:N${nextRow}`, [confirmationRow]);
      
      console.log(`✅ Confirmação salva na aba pagamentos: ${identificador}`);
    } catch (error) {
      console.error('❌ Erro ao salvar confirmação:', error);
      return res.status(500).json({ 
        error: 'Erro ao salvar confirmação do pagamento',
        details: error.message 
      });
    }

    console.log(`✅ Pagamento confirmado para ${nomeAluno} (${cpfAluno}) - ID: ${identificador}`);

    // Enviar notificação WhatsApp se telefone disponível
    try {
      if (telefoneAluno) {
        const notificationResponse = await fetch('http://localhost:3003/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentData: {
              nome: nomeAluno,
              telefone: telefoneAluno,
              livro: 'Livro EETAD',
              preco: valorConfirmado
            }
          })
        });
        
        if (notificationResponse.ok) {
          console.log(`📱 Notificação WhatsApp enviada para ${telefoneAluno}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao enviar notificação WhatsApp:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      dados: {
        identificador: identificador,
        nome: nomeAluno,
        cpf: cpfAluno,
        valor_confirmado: valorConfirmado,
        data_confirmacao: dataConfirmacao,
        status: 'Confirmado'
      },
      notificacao: telefoneAluno ? 'WhatsApp enviado' : 'Telefone não disponível'
    });

  } catch (error) {
    console.error('[confirm-pix-by-id] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

/**
 * Lista pagamentos pendentes (PIX gerados mas não confirmados)
 */
router.get('/list-pending', async (req, res) => {
  try {
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    const PAGAMENTOS_SHEET = 'pagamentos';

    console.log('📋 Listando pagamentos PIX pendentes...');

    // Buscar dados da planilha dados pessoais
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:AA`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.json({ pendentes: [] });
    }

    // Buscar confirmações existentes na aba pagamentos
    let pagamentosData = [];
    try {
      pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:Z`);
    } catch (error) {
      console.log('📋 Aba pagamentos não encontrada');
    }

    const confirmados = new Set();
    if (pagamentosData && pagamentosData.length > 1) {
      for (let i = 1; i < pagamentosData.length; i++) {
        const externalRef = pagamentosData[i][0]; // external_reference
        if (externalRef) {
          confirmados.add(externalRef);
        }
      }
    }

    // Encontrar PIX gerados mas não confirmados
    const pendentes = [];
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const pixData = row[26] || ''; // Coluna AA - PIX com identificador
      
      if (pixData && typeof pixData === 'string') {
        try {
          // Tentar extrair identificador do PIX
          const pixPayload = Buffer.from(pixData, 'base64').toString('utf-8');
          const match = pixPayload.match(/ID:([A-Z0-9]{8})/);
          
          if (match) {
            const identificador = match[1];
            
            if (!confirmados.has(identificador)) {
              pendentes.push({
                identificador: identificador,
                nome: row[4] || '',
                cpf: row[6] || '',
                telefone: row[7] || '',
                email: row[8] || '',
                qr_code_base64: pixData,
                chave_pix: process.env.CHAVE_PIX || 'eetad@exemplo.com',
                valor: process.env.VALOR_PIX || '50.00'
              });
            }
          }
        } catch (e) {
          // Ignorar erros de decodificação
        }
      }
    }

    console.log(`📊 Encontrados ${pendentes.length} pagamentos pendentes`);

    return res.json({
      success: true,
      pendentes: pendentes,
      total: pendentes.length,
      instrucoes: {
        secretaria: [
          'Use POST /confirm-pix-by-id para confirmar pagamentos',
          'Informe o identificador único de 8 caracteres',
          'Opcionalmente informe valor_pago e comprovante_info'
        ]
      }
    });

  } catch (error) {
    console.error('[confirm-pix-by-id] Erro ao listar pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'confirm-pix-by-id',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;