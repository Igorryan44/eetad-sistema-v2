/**
 * 🤖 Função: ai-data-query
 * Permite ao Agente IA consultar dados do Google Sheets
 */

import { Router } from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';
import { corsMiddleware } from '../utils/cors.js';

const router = Router();
router.use(corsMiddleware);

// Função para buscar dados completos do aluno por CPF
async function getStudentCompleteData(cpf) {
  const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  console.log(`🔍 [ai-data-query] Buscando dados completos para CPF: ${cpf}`);
  
  const result = {
    dadosPessoais: null,
    matriculas: [],
    pedidos: [],
    pagamentos: [],
    found: false
  };

  try {
    // 1. Buscar dados pessoais
    console.log('📊 Buscando dados pessoais...');
    const dadosPessoaisRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'dados pessoais'!A:Y");
    
    if (dadosPessoaisRows && dadosPessoaisRows.length > 1) {
      for (let i = 1; i < dadosPessoaisRows.length; i++) {
        const row = dadosPessoaisRows[i];
        const cpfRow = row[6] ? row[6].toString().replace(/\D/g, '') : '';
        
        if (cpfRow === cpfLimpo) {
          result.dadosPessoais = {
            origemAcademica: row[0] || '',
            escolaAnterior: row[1] || '',
            modalidadeAnterior: row[2] || '',
            congregacao: row[3] || '',
            nome: row[4] || '',
            rg: row[5] || '',
            cpf: row[6] || '',
            telefone: row[7] || '',
            email: row[8] || '',
            sexo: row[9] || '',
            estadoCivil: row[10] || '',
            dataNascimento: row[11] || '',
            ufNascimento: row[12] || '',
            escolaridade: row[13] || '',
            profissao: row[14] || '',
            nacionalidade: row[15] || '',
            cargoIgreja: row[16] || '',
            enderecoRua: row[17] || '',
            cep: row[18] || '',
            numero: row[19] || '',
            bairro: row[20] || '',
            cidade: row[21] || '',
            uf: row[22] || '',
            dataCadastro: row[23] || '',
            status: row[24] || ''
          };
          result.found = true;
          break;
        }
      }
    }

    // 2. Buscar dados de matrículas
    console.log('🎓 Buscando dados de matrículas...');
    const matriculasRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'matriculas'!A:H");
    
    if (matriculasRows && matriculasRows.length > 1) {
      for (let i = 1; i < matriculasRows.length; i++) {
        const row = matriculasRows[i];
        const cpfRow = row[1] ? row[1].toString().replace(/\D/g, '') : '';
        
        if (cpfRow === cpfLimpo) {
          result.matriculas.push({
            nome: row[0] || '',
            cpf: row[1] || '',
            nucleo: row[2] || '',
            subnucleo: row[3] || '',
            ciclo: row[4] || '',
            data: row[5] || '',
            status: row[6] || '',
            observacao: row[7] || ''
          });
        }
      }
    }

    // 3. Buscar pedidos de livros
    console.log('📚 Buscando pedidos de livros...');
    try {
      const pedidosRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'pedidos'!A:Z");
      
      if (pedidosRows && pedidosRows.length > 1) {
        for (let i = 1; i < pedidosRows.length; i++) {
          const row = pedidosRows[i];
          const cpfRow = row[1] ? row[1].toString().replace(/\D/g, '') : '';
          
          if (cpfRow === cpfLimpo) {
            result.pedidos.push({
              externalReference: row[0] || '',
              cpf: row[1] || '',
              nomeAluno: row[2] || '',
              ciclo: row[3] || '',
              livro: row[4] || '',
              dataPedido: row[5] || '',
              observacao: row[6] || '',
              statusPedido: row[7] || '',
              dataPagamento: row[8] || '',
              valorPago: row[9] || '',
              comprovante: row[10] || ''
            });
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Aba pedidos não encontrada ou erro:', error.message);
    }

    // 4. Buscar dados de pagamentos
    console.log('💰 Buscando dados de pagamentos...');
    try {
      const pagamentosRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'pagamentos'!A:N");
      
      if (pagamentosRows && pagamentosRows.length > 1) {
        for (let i = 1; i < pagamentosRows.length; i++) {
          const row = pagamentosRows[i];
          const cpfRow = row[7] ? row[7].toString().replace(/\D/g, '') : '';
          
          if (cpfRow === cpfLimpo) {
            result.pagamentos.push({
              identificador: row[0] || '',
              pixCode: row[1] || '',
              qrCode: row[2] || '',
              valor: row[3] || '',
              dataCriacao: row[4] || '',
              status: row[5] || '',
              nome: row[6] || '',
              cpf: row[7] || '',
              telefone: row[8] || '',
              email: row[9] || '',
              dataConfirmacao: row[10] || '',
              valorConfirmado: row[11] || '',
              livro: row[12] || '',
              ciclo: row[13] || ''
            });
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Aba pagamentos não encontrada ou erro:', error.message);
    }

    console.log(`✅ [ai-data-query] Dados encontrados para ${cpf}:`, {
      dadosPessoais: !!result.dadosPessoais,
      matriculas: result.matriculas.length,
      pedidos: result.pedidos.length,
      pagamentos: result.pagamentos.length
    });

    return result;

  } catch (error) {
    console.error('❌ [ai-data-query] Erro ao buscar dados:', error);
    throw error;
  }
}

// Endpoint principal para consulta de dados
router.post('/', async (req, res) => {
  try {
    const { cpf, query_type } = req.body;
    
    if (!cpf) {
      return res.status(400).json({
        success: false,
        error: 'CPF é obrigatório'
      });
    }

    console.log(`🤖 [ai-data-query] Consulta do Agente IA para CPF: ${cpf}, tipo: ${query_type || 'completo'}`);

    const studentData = await getStudentCompleteData(cpf);
    
    if (!studentData.found) {
      return res.json({
        success: false,
        error: 'Aluno não encontrado',
        data: null
      });
    }

    // Criar resumo formatado para a IA
    const summary = {
      dadosBasicos: studentData.dadosPessoais ? {
        nome: studentData.dadosPessoais.nome,
        cpf: studentData.dadosPessoais.cpf,
        telefone: studentData.dadosPessoais.telefone,
        email: studentData.dadosPessoais.email,
        congregacao: studentData.dadosPessoais.congregacao,
        status: studentData.dadosPessoais.status
      } : null,
      
      situacaoAcademica: {
        totalMatriculas: studentData.matriculas.length,
        matriculasAtivas: studentData.matriculas.filter(m => m.status.toLowerCase() === 'matriculado').length,
        cicloAtual: studentData.matriculas.length > 0 ? studentData.matriculas[studentData.matriculas.length - 1].ciclo : 'Não matriculado',
        nucleoAtual: studentData.matriculas.length > 0 ? studentData.matriculas[studentData.matriculas.length - 1].nucleo : 'Não definido'
      },
      
      pedidosLivros: {
        totalPedidos: studentData.pedidos.length,
        pedidosPendentes: studentData.pedidos.filter(p => p.statusPedido.toLowerCase().includes('pendente')).length,
        pedidosPagos: studentData.pedidos.filter(p => p.statusPedido.toLowerCase().includes('pago')).length,
        ultimoPedido: studentData.pedidos.length > 0 ? {
          livro: studentData.pedidos[studentData.pedidos.length - 1].livro,
          status: studentData.pedidos[studentData.pedidos.length - 1].statusPedido,
          data: studentData.pedidos[studentData.pedidos.length - 1].dataPedido
        } : null
      },
      
      situacaoFinanceira: {
        totalTransacoes: studentData.pagamentos.length,
        pagamentosPendentes: studentData.pagamentos.filter(p => p.status.toLowerCase() === 'pendente').length,
        pagamentosConfirmados: studentData.pagamentos.filter(p => p.status.toLowerCase() === 'confirmado').length,
        valorTotal: studentData.pagamentos.reduce((total, p) => {
          const valor = parseFloat(p.valor || 0);
          return total + (isNaN(valor) ? 0 : valor);
        }, 0),
        ultimosPagamentos: studentData.pagamentos.slice(-3).map(p => ({
          livro: p.livro,
          valor: p.valor,
          status: p.status,
          data: p.dataCriacao
        }))
      }
    };

    res.json({
      success: true,
      data: {
        completo: studentData,
        resumo: summary
      }
    });

  } catch (error) {
    console.error('🤖 [ai-data-query] Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: '✅ Função ai-data-query operacional',
    timestamp: new Date().toISOString()
  });
});

export default router;