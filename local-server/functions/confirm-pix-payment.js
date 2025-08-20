import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    const { cpf, valor_pago, data_pagamento, observacoes } = req.body;
    
    if (!cpf) {
      return res.status(400).json({ 
        error: 'CPF é obrigatório' 
      });
    }

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const PEDIDOS_SHEET = 'pedidos de livros';

    console.log(`💰 Confirmando pagamento PIX para CPF: ${cpf}`);

    // Buscar pedidos pendentes
    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PEDIDOS_SHEET}!A:Z`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhum pedido encontrado na planilha' 
      });
    }

    // Procurar pelo CPF e status pendente
    let pedidoRow = null;
    let rowIndex = -1;
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const cpfPedido = row[2] ? row[2].toString().replace(/\D/g, '') : '';
      const statusPagamento = row[6] || '';
      
      if (cpfPedido === cpf.replace(/\D/g, '') && statusPagamento.toLowerCase() === 'pendente') {
        pedidoRow = row;
        rowIndex = i + 1; // +1 porque as linhas da planilha começam em 1
        break;
      }
    }

    if (!pedidoRow) {
      return res.status(404).json({ 
        error: 'Pedido pendente não encontrado para este CPF' 
      });
    }

    const nomeAluno = pedidoRow[1] || '';
    const livro = pedidoRow[3] || '';
    const valorPedido = pedidoRow[4] || '';
    const telefone = pedidoRow[5] || '';

    // Atualizar status do pagamento
    const dataConfirmacao = data_pagamento || new Date().toLocaleString('pt-BR');
    const valorConfirmado = valor_pago || valorPedido;
    
    // Preparar dados atualizados
    const updatedRow = [...pedidoRow];
    updatedRow[6] = 'Pago'; // Status do pagamento
    updatedRow[7] = dataConfirmacao; // Data de confirmação
    updatedRow[8] = valorConfirmado; // Valor confirmado
    updatedRow[9] = observacoes || 'Pagamento PIX confirmado'; // Observações

    // Atualizar a linha na planilha
    const range = `${PEDIDOS_SHEET}!A${rowIndex}:Z${rowIndex}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [updatedRow]);

    console.log(`✅ Pagamento confirmado para ${nomeAluno} (${cpf}) - Livro: ${livro}`);

    // Enviar notificação WhatsApp de confirmação
    try {
      if (telefone) {
        const notificationData = {
          studentData: {
            nome: nomeAluno,
            telefone: telefone,
            livro: livro,
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
        } else {
          console.log(`⚠️ Erro ao enviar notificação WhatsApp para ${telefone}`);
        }
      }
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError);
      // Não falha a confirmação do pagamento por causa da notificação
    }

    return res.status(200).json({
      success: true,
      message: 'Pagamento PIX confirmado com sucesso',
      dados: {
        nome: nomeAluno,
        cpf: cpf,
        livro: livro,
        valor_pedido: valorPedido,
        valor_pago: valorConfirmado,
        data_confirmacao: dataConfirmacao,
        telefone: telefone
      }
    });

  } catch (error) {
    console.error('[confirm-pix-payment] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Endpoint para listar pedidos pendentes
router.get('/pending', async (req, res) => {
  try {
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const PEDIDOS_SHEET = 'pedidos de livros';

    const sheetData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PEDIDOS_SHEET}!A:Z`);
    
    if (!sheetData || sheetData.length <= 1) {
      return res.json({ pedidos_pendentes: [] });
    }

    const pedidosPendentes = [];
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const statusPagamento = row[6] || '';
      
      if (statusPagamento.toLowerCase() === 'pendente') {
        pedidosPendentes.push({
          linha: i + 1,
          nome: row[1] || '',
          cpf: row[2] || '',
          livro: row[3] || '',
          valor: row[4] || '',
          telefone: row[5] || '',
          data_pedido: row[0] || ''
        });
      }
    }

    return res.json({
      success: true,
      total_pendentes: pedidosPendentes.length,
      pedidos_pendentes: pedidosPendentes
    });

  } catch (error) {
    console.error('[confirm-pix-payment] Erro ao listar pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'confirm-pix-payment',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;