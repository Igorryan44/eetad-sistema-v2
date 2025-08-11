import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetData } from '../utils/google-auth.js';

const router = express.Router();

// Aplicar middleware CORS
router.use(corsMiddleware);

// Rota principal para buscar matrículas pendentes
router.post('/', async (req, res) => {
  try {
    console.log('📋 Buscando matrículas pendentes...');
    console.log('🔍 Nova lógica: Comparando "dados pessoais" vs "matriculas"');

    // Verificar se é uma requisição de debug
    const isDebugRequest = req.body?.debug === true;
    if (isDebugRequest) {
      console.log('🐛 Modo DEBUG ativado');
    }

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    const MATRICULAS_SHEET = 'matriculas';

    // Verificar credenciais
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // DEBUG: Mostrar informações das variáveis de ambiente
    if (isDebugRequest) {
      console.log('🔍 DEBUG - Variáveis de ambiente:');
      console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', GOOGLE_SERVICE_ACCOUNT_EMAIL ? `Configurado (${GOOGLE_SERVICE_ACCOUNT_EMAIL.substring(0, 20)}...)` : 'NÃO configurado');
      console.log('GOOGLE_PRIVATE_KEY:', GOOGLE_PRIVATE_KEY ? `Configurado (${GOOGLE_PRIVATE_KEY.substring(0, 50)}...)` : 'NÃO configurado');
      console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', GOOGLE_SHEETS_SPREADSHEET_ID);
    }

    // Se as credenciais não estiverem configuradas, retornar array vazio
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || 
        GOOGLE_SERVICE_ACCOUNT_EMAIL.includes('desenvolvimento') || 
        GOOGLE_PRIVATE_KEY.includes('desenvolvimento')) {
      
      console.log('⚠️ Credenciais do Google não configuradas - retornando array vazio');
      
      if (isDebugRequest) {
        const debugInfo = {
          pendingEnrollments: [],
          debug: {
            error: 'Credenciais não configuradas',
            GOOGLE_SERVICE_ACCOUNT_EMAIL: GOOGLE_SERVICE_ACCOUNT_EMAIL ? `Configurado (${GOOGLE_SERVICE_ACCOUNT_EMAIL.substring(0, 20)}...)` : 'NÃO configurado',
            GOOGLE_PRIVATE_KEY: GOOGLE_PRIVATE_KEY ? `Configurado (${GOOGLE_PRIVATE_KEY.substring(0, 50)}...)` : 'NÃO configurado',
            GOOGLE_SHEETS_SPREADSHEET_ID: GOOGLE_SHEETS_SPREADSHEET_ID,
            allEnvVars: {
              GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Existe' : 'Não existe',
              GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Existe' : 'Não existe',
              GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Existe' : 'Não existe'
            }
          }
        };
        
        return res.json(debugInfo);
      }
      
      return res.json([]);
    }

    // Buscar dados da aba "dados pessoais"
    console.log('📊 Buscando dados da aba "dados pessoais"...');
    const dadosPessoaisRows = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, DADOS_PESSOAIS_SHEET);

    // DEBUG: Mostrar estrutura dos dados pessoais
    console.log(`📊 DEBUG - Dados pessoais: ${dadosPessoaisRows.length} linhas`);
    if (dadosPessoaisRows.length > 0) {
      console.log('📊 DEBUG - Cabeçalho dados pessoais:', JSON.stringify(dadosPessoaisRows[0]));
      if (dadosPessoaisRows.length > 1) {
        console.log('📊 DEBUG - Primeira linha de dados:', JSON.stringify(dadosPessoaisRows[1]));
        if (dadosPessoaisRows.length > 2) {
          console.log('📊 DEBUG - Segunda linha de dados:', JSON.stringify(dadosPessoaisRows[2]));
        }
      }
    }

    // Buscar dados da aba "matriculas"
    console.log('📚 Buscando dados da aba "matriculas"...');
    const matriculasRows = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, MATRICULAS_SHEET);

    // DEBUG: Mostrar estrutura das matrículas
    console.log(`📚 DEBUG - Matrículas: ${matriculasRows.length} linhas`);
    if (matriculasRows.length > 0) {
      console.log('📚 DEBUG - Cabeçalho matrículas:', JSON.stringify(matriculasRows[0]));
      if (matriculasRows.length > 1) {
        console.log('📚 DEBUG - Primeira linha de matrículas:', JSON.stringify(matriculasRows[1]));
      }
    }

    // Processar dados pessoais (pular cabeçalho)
    const dadosPessoaisProcessados = dadosPessoaisRows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque começamos do índice 1 (pular cabeçalho) e as planilhas começam em 1
      
      return {
        rowIndex,
        timestamp: row[0] || '',
        nome: row[1] || '',
        nucleo: row[2] || '',
        cpf: row[3] || '',
        rg: row[4] || '',
        nascimento: row[5] || '',
        telefone: row[6] || '',
        email: row[7] || '',
        endereco: row[8] || '',
        numero: row[9] || '',
        complemento: row[10] || '',
        bairro: row[11] || '',
        cidade: row[12] || '',
        cep: row[13] || '',
        estado: row[14] || '',
        profissao: row[15] || '',
        escolaridade: row[16] || '',
        estadoCivil: row[17] || '',
        nomeConjuge: row[18] || '',
        telefoneConjuge: row[19] || '',
        nomeFilho1: row[20] || '',
        idadeFilho1: row[21] || '',
        nomeFilho2: row[22] || '',
        idadeFilho2: row[23] || '',
        status: row[22] || '' // Coluna W (índice 22)
      };
    });

    // Processar matrículas efetivadas (pular cabeçalho)
    const matriculasEfetivadas = matriculasRows.slice(1).map(row => ({
      nome: row[0] || '',
      cpf: row[1] || '',
      nucleo: row[2] || '',
      subnucleo: row[3] || '',
      ciclo: row[4] || '',
      data: row[5] || '',
      status: row[6] || '',
      observacao: row[7] || ''
    }));

    // Criar set de CPFs que já têm matrícula efetivada
    const cpfsMatriculados = new Set(
      matriculasEfetivadas
        .filter(matricula => matricula.cpf && matricula.cpf.trim() !== '')
        .map(matricula => matricula.cpf.replace(/\D/g, '')) // Remover formatação
    );

    console.log(`📊 CPFs já matriculados: ${cpfsMatriculados.size}`);
    if (isDebugRequest) {
      console.log('📊 DEBUG - CPFs matriculados:', Array.from(cpfsMatriculados));
    }

    // Filtrar alunos pendentes (que não estão na aba matriculas)
    const alunosPendentes = dadosPessoaisProcessados.filter(aluno => {
      // Verificar se tem CPF
      if (!aluno.cpf || aluno.cpf.trim() === '') {
        return false;
      }

      // Limpar CPF para comparação
      const cpfLimpo = aluno.cpf.replace(/\D/g, '');
      
      // Verificar se não está matriculado
      const jaMatriculado = cpfsMatriculados.has(cpfLimpo);
      
      if (isDebugRequest && !jaMatriculado) {
        console.log(`📋 DEBUG - Aluno pendente encontrado: ${aluno.nome} (CPF: ${cpfLimpo})`);
      }
      
      return !jaMatriculado;
    });

    console.log(`📋 Total de alunos pendentes: ${alunosPendentes.length}`);

    // Preparar resposta
    const pendingEnrollments = alunosPendentes.map(aluno => ({
      rowIndex: aluno.rowIndex,
      nome: aluno.nome,
      cpf: aluno.cpf,
      nucleo: aluno.nucleo,
      telefone: aluno.telefone,
      email: aluno.email,
      timestamp: aluno.timestamp,
      status: aluno.status || 'Pendente'
    }));

    if (isDebugRequest) {
      const debugInfo = {
        pendingEnrollments,
        debug: {
          totalDadosPessoais: dadosPessoaisRows.length - 1, // -1 para excluir cabeçalho
          totalMatriculas: matriculasRows.length - 1, // -1 para excluir cabeçalho
          cpfsMatriculados: Array.from(cpfsMatriculados),
          totalPendentes: pendingEnrollments.length,
          allEnvVars: {
            GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Existe' : 'Não existe',
            GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Existe' : 'Não existe',
            GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Existe' : 'Não existe'
          }
        }
      };
      
      return res.json(debugInfo);
    }

    res.json(pendingEnrollments);

  } catch (error) {
    console.error('❌ Erro ao buscar matrículas pendentes:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota GET para compatibilidade
router.get('/', async (req, res) => {
  // Redirecionar para POST com body vazio
  req.body = {};
  return router.handle(req, res);
});

// Rota para verificar status da função
router.get('/health', (req, res) => {
  res.json({
    function: 'get-pending-enrollments',
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleCredentials: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    }
  });
});

export default router;