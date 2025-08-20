import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Função para confirmar pagamento PIX usando código de rastreamento
 * Permite identificar exatamente qual aluno fez o pagamento mesmo com chave estática
 */
router.post('/', async (req, res) => {
  try {
    const { tracking_id, valor_pago, data_pagamento, observacoes, comprovante_info } = req.body;
    
    if (!tracking_id) {
      return res.status(400).json({ 
        error: 'Código de rastreamento é obrigatório' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const TRACKING_SHEET = 'rastreamento_pix';

    console.log(`💰 Confirmando pagamento PIX com código: ${tracking_id}`);

    // Buscar registro de rastreamento
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A:K`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum registro de rastreamento encontrado na planilha' 
      });
    }

    // Procurar pelo código de rastreamento
    let trackingRow = null;
    let rowIndex = -1;
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const trackingCode = row[0] ? row[0].toString().trim() : '';
      const status = row[6] || '';
      
      if (trackingCode === tracking_id.trim()) {
        trackingRow = row;
        rowIndex = i + 1; // +1 porque as linhas da planilha começam em 1
        break;
      }
    }

    if (!trackingRow) {
      return res.status(404).json({ 
        error: `Código de rastreamento ${tracking_id} não encontrado` 
      });
    }

    const nomeAluno = trackingRow[1] || '';
    const cpfAluno = trackingRow[2] || '';
    const valorOriginal = trackingRow[3] || '';
    const chavePix = trackingRow[4] || '';
    const descricao = trackingRow[5] || '';
    const statusAtual = trackingRow[6] || '';

    // Verificar se já foi pago
    if (statusAtual.toLowerCase() === 'pago' || statusAtual.toLowerCase() === 'confirmado') {
      return res.status(400).json({ 
        error: `Pagamento ${tracking_id} já foi confirmado anteriormente`,
        dados: {
          nome: nomeAluno,
          cpf: cpfAluno,
          status: statusAtual,
          data_confirmacao: trackingRow[8] || ''
        }
      });
    }

    // Atualizar status do pagamento
    const dataConfirmacao = data_pagamento || new Date().toLocaleString('pt-BR');
    const valorConfirmado = valor_pago || valorOriginal;
    
    // Preparar dados atualizados
    const updatedRow = [...trackingRow];
    updatedRow[6] = 'Pago'; // Status
    updatedRow[8] = dataConfirmacao; // Data/hora pagamento
    updatedRow[9] = observacoes || `Pagamento confirmado via código ${tracking_id}`; // Observações

    // Atualizar a linha na planilha
    const range = `${TRACKING_SHEET}!A${rowIndex}:K${rowIndex}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [updatedRow]);

    console.log(`✅ Pagamento confirmado: ${tracking_id} - ${nomeAluno} (${cpfAluno})`);

    // Tentar atualizar também na planilha de pedidos de livros se existir
    try {
      const PEDIDOS_SHEET = 'pedidos de livros';
      const pedidosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PEDIDOS_SHEET}!A:Z`);
      
      if (pedidosData && pedidosData.length > 1) {
        for (let i = 1; i < pedidosData.length; i++) {
          const row = pedidosData[i];
          const cpfPedido = row[2] ? row[2].toString().replace(/\D/g, '') : '';
          const statusPagamento = row[6] || '';
          
          if (cpfPedido === cpfAluno.replace(/\D/g, '') && statusPagamento.toLowerCase() === 'pendente') {
            const updatedPedidoRow = [...row];
            updatedPedidoRow[6] = 'Pago';
            updatedPedidoRow[7] = dataConfirmacao;
            updatedPedidoRow[8] = valorConfirmado;
            updatedPedidoRow[9] = `Pago via código ${tracking_id}`;
            
            const pedidoRange = `${PEDIDOS_SHEET}!A${i + 1}:Z${i + 1}`;
            await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, pedidoRange, [updatedPedidoRow]);
            console.log(`✅ Pedido de livro também atualizado para ${nomeAluno}`);
            break;
          }
        }
      }
    } catch (pedidoError) {
      console.warn(`⚠️ Erro ao atualizar pedido de livro: ${pedidoError.message}`);
    }

    // Enviar notificação WhatsApp se possível
    try {
      // Buscar telefone do aluno na planilha de dados pessoais
      const DADOS_SHEET = 'dados pessoais';
      const dadosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_SHEET}!A:Z`);
      
      let telefone = '';
      if (dadosData && dadosData.length > 1) {
        for (let i = 1; i < dadosData.length; i++) {
          const row = dadosData[i];
          const cpfDados = row[3] ? row[3].toString().replace(/\D/g, '') : '';
          
          if (cpfDados === cpfAluno.replace(/\D/g, '')) {
            telefone = row[6] || ''; // Assumindo que telefone está na coluna G
            break;
          }
        }
      }

      if (telefone) {
        const notificationData = {
          studentData: {
            nome: nomeAluno,
            telefone: telefone,
            livro: 'Material didático',
            preco: valorConfirmado
          }
        };

        const notificationResponse = await fetch('http://localhost:3003/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notificationData)
        });

        if (notificationResponse.ok) {
          console.log(`📱 Notificação WhatsApp enviada para ${telefone}`);
        }
      }
    } catch (notificationError) {
      console.warn(`⚠️ Erro ao enviar notificação: ${notificationError.message}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Pagamento PIX confirmado com sucesso',
      tracking_id: tracking_id,
      dados: {
        nome: nomeAluno,
        cpf: cpfAluno,
        valor_original: valorOriginal,
        valor_pago: valorConfirmado,
        chave_pix: chavePix,
        descricao: descricao,
        data_confirmacao: dataConfirmacao,
        observacoes: observacoes || `Confirmado via código ${tracking_id}`
      }
    });

  } catch (error) {
    console.error('[confirm-pix-by-tracking] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Endpoint para listar pagamentos pendentes
router.get('/pending', async (req, res) => {
  try {
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const TRACKING_SHEET = 'rastreamento_pix';

    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A:K`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.json({ pagamentos_pendentes: [] });
    }

    const pagamentosPendentes = [];
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const status = row[6] || '';
      
      if (status.toLowerCase() === 'pendente') {
        pagamentosPendentes.push({
          tracking_id: row[0] || '',
          nome: row[1] || '',
          cpf: row[2] || '',
          valor: row[3] || '',
          chave_pix: row[4] || '',
          descricao: row[5] || '',
          data_criacao: row[7] || ''
        });
      }
    }

    return res.json({
      success: true,
      total_pendentes: pagamentosPendentes.length,
      pagamentos_pendentes: pagamentosPendentes
    });

  } catch (error) {
    console.error('[confirm-pix-by-tracking] Erro ao listar pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Endpoint para buscar pagamento por código
router.get('/search/:tracking_id', async (req, res) => {
  try {
    const { tracking_id } = req.params;
    
    if (!tracking_id) {
      return res.status(400).json({ 
        error: 'Código de rastreamento é obrigatório' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const TRACKING_SHEET = 'rastreamento_pix';

    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${TRACKING_SHEET}!A:K`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum registro encontrado' 
      });
    }

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const trackingCode = row[0] ? row[0].toString().trim() : '';
      
      if (trackingCode === tracking_id.trim()) {
        return res.json({
          success: true,
          pagamento: {
            tracking_id: row[0] || '',
            nome: row[1] || '',
            cpf: row[2] || '',
            valor: row[3] || '',
            chave_pix: row[4] || '',
            descricao: row[5] || '',
            status: row[6] || '',
            data_criacao: row[7] || '',
            data_pagamento: row[8] || '',
            observacoes: row[9] || ''
          }
        });
      }
    }

    return res.status(404).json({ 
      error: `Código de rastreamento ${tracking_id} não encontrado` 
    });

  } catch (error) {
    console.error('[confirm-pix-by-tracking] Erro na busca:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'confirm-pix-by-tracking',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;