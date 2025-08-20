import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Confirma pagamento PIX mensal usando identificador temporal
 * Suporta múltiplas transações do mesmo aluno em períodos diferentes
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
    const PAGAMENTOS_SHEET = 'pagamentos';

    console.log(`🔍 Confirmando pagamento PIX mensal com identificador: ${identificador}`);

    // Buscar dados da aba pagamentos
    const pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:N`);
    
    if (!pagamentosData || pagamentosData.length <= 1) {
      return res.status(404).json({ 
        error: 'Nenhuma transação encontrada na aba pagamentos' 
      });
    }

    // Procurar pela transação com o identificador
    let transacaoRow = null;
    let transacaoRowIndex = -1;
    
    for (let i = 1; i < pagamentosData.length; i++) {
      const row = pagamentosData[i];
      const externalRef = row[0] || ''; // external_reference
      
      if (externalRef === identificador) {
        transacaoRow = row;
        transacaoRowIndex = i + 1; // +1 porque as linhas da planilha começam em 1
        break;
      }
    }

    if (!transacaoRow) {
      return res.status(404).json({ 
        error: `Transação com identificador ${identificador} não encontrada` 
      });
    }

    // Extrair dados da transação
    const emailAluno = transacaoRow[1] || '';
    const transacaoId = transacaoRow[2] || '';
    const valorOriginal = transacaoRow[3] || '';
    const dataPix = transacaoRow[4] || '';
    const statusAtual = transacaoRow[5] || '';
    const nomeAluno = transacaoRow[6] || '';
    const cpfAluno = transacaoRow[7] || '';
    const livro = transacaoRow[12] || '';
    const ciclo = transacaoRow[13] || '';

    // Verificar se já foi confirmado
    if (statusAtual.toLowerCase() === 'pago' || statusAtual.toLowerCase() === 'confirmado') {
      return res.status(400).json({ 
        error: `Pagamento ${identificador} já foi confirmado anteriormente`,
        dados: {
          nome: nomeAluno,
          cpf: cpfAluno,
          livro: livro,
          ciclo: ciclo,
          data_confirmacao: transacaoRow[8] || '',
          valor_confirmado: valorOriginal
        }
      });
    }

    // Preparar dados da confirmação
    const dataConfirmacao = data_pagamento || new Date().toLocaleString('pt-BR');
    const valorConfirmado = valor_pago || valorOriginal;
    
    // Atualizar a transação na aba pagamentos
    const updatedRow = [...transacaoRow];
    updatedRow[5] = 'Pago'; // F - Status
    updatedRow[8] = dataConfirmacao; // I - Data_Pagamento
    updatedRow[3] = valorConfirmado; // D - Valor (atualizar se necessário)
    
    // Adicionar observações se fornecidas
    if (observacoes) {
      // Se houver uma coluna para observações, adicionar aqui
      // Por enquanto, vamos manter na estrutura atual
    }

    // Salvar a linha atualizada
    const range = `${PAGAMENTOS_SHEET}!A${transacaoRowIndex}:N${transacaoRowIndex}`;
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, range, [updatedRow]);

    console.log(`✅ Pagamento confirmado: ${identificador} - ${nomeAluno} (${cpfAluno}) - ${livro}`);

    // Enviar notificação WhatsApp se telefone disponível
    try {
      // Buscar telefone do aluno na aba dados pessoais
      const DADOS_PESSOAIS_SHEET = 'dados pessoais';
      const dadosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:Z`);
      
      let telefoneAluno = '';
      if (dadosData && dadosData.length > 1) {
        const cpfLimpo = cpfAluno.replace(/\D/g, '');
        for (let i = 1; i < dadosData.length; i++) {
          const row = dadosData[i];
          if (row[6] && row[6].toString().replace(/\D/g, '') === cpfLimpo) {
            telefoneAluno = row[7] || ''; // Coluna H - telefone
            break;
          }
        }
      }

      if (telefoneAluno) {
        const notificationData = {
          studentData: {
            nome: nomeAluno,
            telefone: telefoneAluno,
            livro: livro,
            preco: valorConfirmado,
            ciclo: ciclo,
            identificador: identificador
          }
        };

        const whatsappResponse = await fetch('http://localhost:3003/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'payment_confirmation',
            data: notificationData
          })
        });

        if (whatsappResponse.ok) {
          console.log(`📱 Notificação WhatsApp enviada para ${telefoneAluno}`);
        } else {
          console.log(`⚠️ Falha ao enviar notificação WhatsApp`);
        }
      }
    } catch (notificationError) {
      console.log(`⚠️ Erro ao enviar notificação:`, notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Pagamento PIX mensal confirmado com sucesso',
      transacao: {
        identificador: identificador,
        nome: nomeAluno,
        cpf: cpfAluno,
        livro: livro,
        ciclo: ciclo,
        valor_confirmado: valorConfirmado,
        data_confirmacao: dataConfirmacao,
        status: 'Pago'
      },
      detalhes: {
        transacao_id: transacaoId,
        data_pix_original: dataPix,
        email: emailAluno,
        observacoes: observacoes || 'Pagamento confirmado via identificador temporal'
      }
    });

  } catch (error) {
    console.error('[confirm-monthly-pix] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

/**
 * Lista pagamentos pendentes por período
 */
router.get('/pendentes', async (req, res) => {
  try {
    const { periodo } = req.query;
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const PAGAMENTOS_SHEET = 'pagamentos';

    console.log(`📋 Listando pagamentos pendentes${periodo ? ` para período: ${periodo}` : ''}`);

    // Buscar dados da aba pagamentos
    const pagamentosData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${PAGAMENTOS_SHEET}!A:N`);
    
    if (!pagamentosData || pagamentosData.length <= 1) {
      return res.json({ pendentes: [] });
    }

    // Filtrar transações pendentes
    const pendentes = [];
    
    for (let i = 1; i < pagamentosData.length; i++) {
      const row = pagamentosData[i];
      const identificador = row[0] || '';
      const status = row[5] || '';
      const nome = row[6] || '';
      const cpf = row[7] || '';
      const livro = row[12] || '';
      const ciclo = row[13] || '';
      const dataPix = row[4] || '';
      const valor = row[3] || '';
      
      // Verificar se está pendente
      if (status.toLowerCase() === 'pendente') {
        // Filtrar por período se especificado
        if (!periodo || identificador.includes(periodo.replace(/\s+/g, '').toUpperCase())) {
          pendentes.push({
            identificador: identificador,
            nome: nome,
            cpf: cpf,
            livro: livro,
            ciclo: ciclo,
            valor: valor,
            data_criacao: dataPix,
            status: status
          });
        }
      }
    }

    console.log(`📊 Encontrados ${pendentes.length} pagamentos pendentes`);

    return res.json({
      pendentes: pendentes,
      total: pendentes.length,
      periodo_filtro: periodo || 'Todos'
    });

  } catch (error) {
    console.error('[confirm-monthly-pix] Erro ao listar pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'confirm-monthly-pix',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;