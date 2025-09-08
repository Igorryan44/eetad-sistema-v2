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
    const TRACKING_SHEET = 'rastreamento_pix';
    const PAGAMENTOS_SHEET = 'pagamentos';

    console.log(`🔍 Confirmando pagamento PIX com identificador: ${identificador}`);

    // Buscar dados da planilha de rastreamento PIX
    let trackingData;
    try {
      trackingData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A:K`);
    } catch (error) {
      console.error('❌ Erro ao acessar aba rastreamento_pix:', error);
      return res.status(500).json({ 
        error: 'Erro ao acessar dados de rastreamento PIX' 
      });
    }
    
    if (!trackingData || trackingData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum dado de rastreamento PIX encontrado' 
      });
    }

    // Procurar pelo identificador na planilha de rastreamento
    let trackingRow = null;
    let trackingRowIndex = -1;
    
    for (let i = 1; i < trackingData.length; i++) {
      const row = trackingData[i];
      const rowId = row[0] || ''; // Coluna A - ID de rastreamento
      
      if (rowId === identificador) {
        trackingRow = row;
        trackingRowIndex = i + 1;
        break;
      }
    }

    if (!trackingRow) {
      return res.status(404).json({ 
        error: `Identificador ${identificador} não encontrado` 
      });
    }

    const nomeAluno = trackingRow[1] || ''; // Coluna B - Nome
    const cpfAluno = trackingRow[2] || ''; // Coluna C - CPF
    const valorOriginal = trackingRow[3] || '45'; // Coluna D - Valor
    const chavePix = trackingRow[4] || ''; // Coluna E - Chave PIX
    const descricao = trackingRow[5] || ''; // Coluna F - Descrição
    const statusAtual = trackingRow[6] || 'Pendente'; // Coluna G - Status

    console.log(`👤 Aluno encontrado: ${nomeAluno} (${cpfAluno})`);
    console.log(`💰 Valor original: R$ ${valorOriginal}`);
    console.log(`📊 Status atual: ${statusAtual}`);

    // Verificar se já foi confirmado
    if (statusAtual === 'Confirmado' || statusAtual === 'Pago') {
      return res.status(400).json({ 
        error: `Pagamento ${identificador} já foi confirmado anteriormente`,
        dados: {
          nome: nomeAluno,
          cpf: cpfAluno,
          status: statusAtual,
          valor: valorOriginal
        }
      });
    }

    // Verificar se já existe confirmação na aba pagamentos
    let pagamentosData;
    try {
      pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:Z`);
    } catch (error) {
      console.log('📋 Aba pagamentos não encontrada, será criada');
      pagamentosData = [];
    }

    // Verificar duplicata na aba pagamentos
    if (pagamentosData && pagamentosData.length > 1) {
      for (let i = 1; i < pagamentosData.length; i++) {
        const row = pagamentosData[i];
        const externalRef = row[0] || ''; // external_reference
        if (externalRef === identificador) {
          return res.status(400).json({ 
            error: `Pagamento ${identificador} já foi registrado na aba pagamentos`,
            dados: {
              nome: row[6] || '',
              cpf: row[7] || '',
              data_confirmacao: row[8] || '',
              valor_confirmado: row[3] || ''
            }
          });
        }
      }
    }

    // Preparar dados da confirmação
    const dataConfirmacao = data_pagamento || new Date().toLocaleString('pt-BR');
    const valorConfirmado = valor_pago || valorOriginal;
    const dataPix = new Date().toLocaleString('pt-BR');
    
    // Estrutura: external_reference, Email, Transação_ID, Valor, Data_PIX, Status, Nome, cpf, Data_Pagamento, Validade, Pix_url, Pix_base64, livro, ciclo
    const confirmationRow = [
      identificador, // A - external_reference
      '', // B - Email (buscaremos dos dados pessoais se necessário)
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

    try {
      // Salvar confirmação na aba pagamentos
      const nextPaymentRow = (pagamentosData?.length || 0) + 1;
      await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A${nextPaymentRow}:N${nextPaymentRow}`, [confirmationRow]);
      console.log(`✅ Confirmação salva na aba pagamentos: ${identificador}`);

      // Atualizar status na aba de rastreamento
      const updatedTrackingRow = [
        identificador,        // A - ID de rastreamento
        nomeAluno,           // B - Nome do aluno
        cpfAluno,            // C - CPF limpo
        valorConfirmado,     // D - Valor
        chavePix,            // E - Chave PIX
        descricao,           // F - Descrição
        'Confirmado',        // G - Status
        trackingRow[7] || '', // H - Data/hora criação (manter original)
        dataConfirmacao,     // I - Data/hora pagamento
        observacoes || 'Pagamento confirmado manualmente', // J - Observações
        trackingRow[10] || '' // K - Código PIX (manter original)
      ];
      
      await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A${trackingRowIndex}:K${trackingRowIndex}`, [updatedTrackingRow]);
      console.log(`✅ Status atualizado na aba de rastreamento: ${identificador}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar confirmação:', error);
      return res.status(500).json({ 
        error: 'Erro ao salvar confirmação do pagamento',
        details: error.message 
      });
    }

    console.log(`✅ Pagamento confirmado para ${nomeAluno} (${cpfAluno}) - ID: ${identificador}`);

    // Tentar buscar telefone dos dados pessoais para notificação
    let telefoneAluno = '';
    try {
      const dadosPessoais = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `dados pessoais!A:H`);
      if (dadosPessoais && dadosPessoais.length > 1) {
        for (let i = 1; i < dadosPessoais.length; i++) {
          const row = dadosPessoais[i];
          const cpfDados = (row[6] || '').replace(/\D/g, ''); // Coluna G - CPF
          if (cpfDados === cpfAluno) {
            telefoneAluno = row[7] || ''; // Coluna H - telefone
            break;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar telefone dos dados pessoais:', error.message);
    }

    // Enviar notificação WhatsApp se telefone disponível
    if (telefoneAluno) {
      try {
        const notificationResponse = await fetch('http://localhost:3003/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'payment_confirmed',
            studentData: {
              nome: nomeAluno,
              telefone: telefoneAluno,
              livro: 'Livro EETAD',
              preco: valorConfirmado,
              identificador: identificador
            }
          })
        });
        
        if (notificationResponse.ok) {
          console.log(`📱 Notificação WhatsApp enviada para ${telefoneAluno}`);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao enviar notificação WhatsApp:', error.message);
      }
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
    const TRACKING_SHEET = 'rastreamento_pix';
    const PAGAMENTOS_SHEET = 'pagamentos';

    console.log('📋 Listando pagamentos PIX pendentes...');

    // Buscar dados da planilha de rastreamento PIX
    let trackingData;
    try {
      trackingData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A:K`);
    } catch (error) {
      return res.json({ 
        pendentes: [],
        message: 'Planilha de rastreamento PIX não encontrada' 
      });
    }
    
    if (!trackingData || trackingData.length <= 1) {
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
    
    for (let i = 1; i < trackingData.length; i++) {
      const row = trackingData[i];
      const identificador = row[0] || ''; // Coluna A - ID de rastreamento
      const nome = row[1] || ''; // Coluna B - Nome
      const cpf = row[2] || ''; // Coluna C - CPF
      const valor = row[3] || '45'; // Coluna D - Valor
      const chavePix = row[4] || ''; // Coluna E - Chave PIX
      const status = row[6] || 'Pendente'; // Coluna G - Status
      
      // Incluir apenas os que estão pendentes e não foram confirmados na aba pagamentos
      if (identificador && status !== 'Confirmado' && status !== 'Pago' && !confirmados.has(identificador)) {
        pendentes.push({
          identificador: identificador,
          nome: nome,
          cpf: cpf,
          valor: valor,
          chave_pix: chavePix,
          status: status,
          data_criacao: row[7] || '', // Coluna H - Data/hora criação
          descricao: row[5] || '' // Coluna F - Descrição
        });
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