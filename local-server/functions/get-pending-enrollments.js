import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry } from '../utils/google-auth.js';

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
      
      console.log('⚠️ Credenciais do Google não configuradas - retornando resposta de erro estruturada');
      
      if (isDebugRequest) {
        const debugInfo = {
          success: false,
          pendingEnrollments: [],
          error: 'Credenciais não configuradas',
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
        
        return res.status(503).json(debugInfo);
      }
      
      return res.status(503).json({
        success: false,
        pendingEnrollments: [],
        error: 'Serviço temporariamente indisponível - credenciais não configuradas'
      });
    }

    // Buscar dados da aba "dados pessoais"
    console.log('📊 Buscando dados da aba "dados pessoais"...');
    const dadosPessoaisRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, DADOS_PESSOAIS_SHEET);

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
    const matriculasRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, MATRICULAS_SHEET);

    // DEBUG: Mostrar estrutura das matrículas
    console.log(`📚 DEBUG - Matrículas: ${matriculasRows.length} linhas`);
    if (matriculasRows.length > 0) {
      console.log('📚 DEBUG - Cabeçalho matrículas:', JSON.stringify(matriculasRows[0]));
      if (matriculasRows.length > 1) {
        console.log('📚 DEBUG - Primeira linha de matrículas:', JSON.stringify(matriculasRows[1]));
      }
    }

    // DEBUG: Mostrar cabeçalhos e primeiras linhas
    if (isDebugRequest) {
      console.log('📊 DEBUG - Cabeçalhos dados pessoais:', JSON.stringify(dadosPessoaisRows[0]));
      if (dadosPessoaisRows.length > 1) {
        console.log('📊 DEBUG - Primeira linha dados:', JSON.stringify(dadosPessoaisRows[1]));
      }
      if (dadosPessoaisRows.length > 2) {
        console.log('📊 DEBUG - Segunda linha dados:', JSON.stringify(dadosPessoaisRows[2]));
      }
    }

    // Processar dados pessoais (pular cabeçalho)
    const dadosPessoaisProcessados = dadosPessoaisRows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque começamos do índice 1 (pular cabeçalho) e as planilhas começam em 1
      
      const processedData = {
        rowIndex,
        origem_academica: row[0] || '', // A
        escola_anterior: row[1] || '', // B
        modalidade_anterior: row[2] || '', // C
        congregacao: row[3] || '', // D
        nome: row[4] || '', // E - nome
        rg: row[5] || '', // F
        cpf: row[6] || '', // G - cpf
        telefone: row[7] || '', // H - telefone
        email: row[8] || '', // I - email
        sexo: row[9] || '', // J
        estado_civil: row[10] || '', // K
        data_nascimento: row[11] || '', // L
        uf_nascimento: row[12] || '', // M
        escolaridade: row[13] || '', // N
        profissao: row[14] || '', // O
        nacionalidade: row[15] || '', // P
        cargo_igreja: row[16] || '', // Q
        endereco_rua: row[17] || '', // R
        cep: row[18] || '', // S
        numero: row[19] || '', // T
        bairro: row[20] || '', // U
        cidade: row[21] || '', // V
        uf: row[22] || '', // W
        data_cadastro: row[23] || '', // X
        status: row[24] || '' // Y - status
      };

      // DEBUG: Mostrar dados processados das primeiras linhas
      if (isDebugRequest && index < 3) {
        console.log(`📊 DEBUG - Linha ${index + 1} processada:`, JSON.stringify(processedData));
        console.log(`📊 DEBUG - Row original linha ${index + 1}:`, JSON.stringify(row));
      }

      return processedData;
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

    // Filtrar alunos pendentes (que não estão na aba matriculas E não têm status 'matriculado')
    const alunosPendentes = dadosPessoaisProcessados.filter(aluno => {
      // Verificar se tem CPF
      if (!aluno.cpf || aluno.cpf.trim() === '') {
        return false;
      }

      // Limpar CPF para comparação
      const cpfLimpo = aluno.cpf.replace(/\D/g, '');
      
      // Verificar se não está matriculado na aba 'matriculas'
      const jaMatriculadoNaAba = cpfsMatriculados.has(cpfLimpo);
      
      // Verificar se o status na coluna Y não é 'matriculado'
      const statusMatriculado = aluno.status && aluno.status.toLowerCase().includes('matriculado');
      
      // Aluno é pendente se:
      // 1. NÃO está na aba 'matriculas' E
      // 2. NÃO tem status 'matriculado' na coluna Y
      const isPendente = !jaMatriculadoNaAba && !statusMatriculado;
      
      if (isDebugRequest) {
        console.log(`📋 DEBUG - Aluno: ${aluno.nome} (CPF: ${cpfLimpo})`);
        console.log(`   - Na aba matriculas: ${jaMatriculadoNaAba}`);
        console.log(`   - Status: '${aluno.status}' (matriculado: ${statusMatriculado})`);
        console.log(`   - É pendente: ${isPendente}`);
      }
      
      return isPendente;
    });

    console.log(`📋 Total de alunos pendentes: ${alunosPendentes.length}`);

    // Preparar resposta - mapeamento correto baseado no novo esquema
    const pendingEnrollments = alunosPendentes.map(aluno => ({
      rowIndex: aluno.rowIndex,
      nome: aluno.nome, // E - nome (índice 4)
      cpf: aluno.cpf, // G - cpf (índice 6)
      nucleo: aluno.congregacao, // D - congregacao (índice 3)
      telefone: aluno.telefone, // H - telefone (índice 7)
      email: aluno.email, // I - email (índice 8)
      timestamp: aluno.data_cadastro, // X - data_cadastro (índice 23)
      status: aluno.status || 'Pendente' // Y - status (índice 24)
    }));

    // DEBUG: Mostrar dados finais se solicitado
    if (isDebugRequest && pendingEnrollments.length > 0) {
      console.log('📋 DEBUG - Dados finais primeiro aluno:', JSON.stringify(pendingEnrollments[0]));
      if (pendingEnrollments.length > 1) {
        console.log('📋 DEBUG - Dados finais segundo aluno:', JSON.stringify(pendingEnrollments[1]));
      }
    }

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

// Rota GET para compatibilidade (redireciona para POST)
router.get('/', async (req, res) => {
  // Simular requisição POST com parâmetros de query
  const debugParam = req.query.debug === 'true';
  req.body = { debug: debugParam };
  
  // Chamar a mesma lógica da rota POST
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
            totalDadosPessoais: 0,
            totalMatriculas: 0,
            cpfsMatriculados: 0,
            alunosPendentes: 0,
            environment: {
              hasGoogleCredentials: false,
              hasSpreadsheetId: !!GOOGLE_SHEETS_SPREADSHEET_ID
            }
          }
        };
        return res.json(debugInfo);
      }
      
      return res.json({ pendingEnrollments: [] });
    }

    console.log('📊 Buscando dados da aba "dados pessoais"...');
    
    // Buscar dados da aba "dados pessoais" com retry
    const dadosPessoaisRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `'${DADOS_PESSOAIS_SHEET}'!A:Y`, 3);
    
    if (isDebugRequest) {
      console.log(`📊 DEBUG - Dados pessoais: ${dadosPessoaisRows.length} linhas`);
      if (dadosPessoaisRows.length > 0) {
        console.log('📊 DEBUG - Cabeçalho dados pessoais:', JSON.stringify(dadosPessoaisRows[0]));
      }
      if (dadosPessoaisRows.length > 1) {
        console.log('📊 DEBUG - Primeira linha de dados:', JSON.stringify(dadosPessoaisRows[1]));
      }
      if (dadosPessoaisRows.length > 2) {
        console.log('📊 DEBUG - Segunda linha de dados:', JSON.stringify(dadosPessoaisRows[2]));
      }
    }

    // Processar dados pessoais (pular cabeçalho)
    const dadosPessoaisProcessados = dadosPessoaisRows.slice(1).map((row, index) => {
      const processedData = {
        rowIndex: index + 2, // +2 porque pulamos cabeçalho e índices começam em 1
        origem_academica: row[0] || '', // A
        escola_anterior: row[1] || '', // B
        modalidade_anterior: row[2] || '', // C
        congregacao: row[3] || '', // D
        nome: row[4] || '', // E - nome (coluna correta conforme estrutura da planilha)
        rg: row[5] || '', // F
        cpf: row[6] || '', // G - cpf
        telefone: row[7] || '', // H - telefone
        email: row[8] || '', // I - email
        sexo: row[9] || '', // J
        estado_civil: row[10] || '', // K
        data_nascimento: row[11] || '', // L
        uf_nascimento: row[12] || '', // M
        escolaridade: row[13] || '', // N
        profissao: row[14] || '', // O
        nacionalidade: row[15] || '', // P
        cargo_igreja: row[16] || '', // Q
        endereco_rua: row[17] || '', // R
        cep: row[18] || '', // S
        numero: row[19] || '', // T
        bairro: row[20] || '', // U
        cidade: row[21] || '', // V
        uf: row[22] || '', // W
        data_cadastro: row[23] || '', // X
        status: row[24] || '' // Y - status
      };

      // DEBUG: Mostrar dados processados das primeiras linhas
      if (isDebugRequest && index < 3) {
        console.log(`📊 DEBUG - Linha ${index + 1} processada:`, JSON.stringify(processedData));
        console.log(`📊 DEBUG - Row original linha ${index + 1}:`, JSON.stringify(row));
      }

      return processedData;
    });

    console.log('📚 Buscando dados da aba "matriculas"...');
     
     // Buscar dados da aba "matriculas" com retry
     const matriculasRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `'${MATRICULAS_SHEET}'!A:H`, 3);

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
    
    if (isDebugRequest) {
      console.log(`📚 DEBUG - Matrículas: ${matriculasRows.length} linhas`);
      if (matriculasRows.length > 0) {
        console.log('📚 DEBUG - Cabeçalho matrículas:', JSON.stringify(matriculasRows[0]));
      }
      if (matriculasRows.length > 1) {
        console.log('📚 DEBUG - Primeira linha de matrículas:', JSON.stringify(matriculasRows[1]));
      }
    }

    // Criar conjunto de CPFs já matriculados
    const cpfsMatriculados = new Set();
    matriculasEfetivadas.forEach(matricula => {
      if (matricula.cpf) {
        const cpfLimpo = matricula.cpf.replace(/\D/g, '');
        if (cpfLimpo) {
          cpfsMatriculados.add(cpfLimpo);
        }
      }
    });

    console.log(`📊 CPFs já matriculados: ${cpfsMatriculados.size}`);
    
    if (isDebugRequest) {
      console.log('📊 DEBUG - CPFs matriculados:', Array.from(cpfsMatriculados));
    }

    // Filtrar alunos pendentes (que não estão matriculados)
    const alunosPendentes = dadosPessoaisProcessados.filter(aluno => {
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

    // Preparar resposta - mapeamento correto baseado no novo esquema
    const pendingEnrollments = alunosPendentes.map(aluno => ({
      rowIndex: aluno.rowIndex,
      nome: aluno.nome, // E - nome (índice 4)
      cpf: aluno.cpf, // G - cpf (índice 6)
      nucleo: aluno.congregacao, // D - congregacao (índice 3)
      telefone: aluno.telefone, // H - telefone (índice 7)
      email: aluno.email, // I - email (índice 8)
      timestamp: aluno.data_cadastro, // X - data_cadastro (índice 23)
      status: aluno.status || 'Pendente' // Y - status (índice 24)
    }));

    // DEBUG: Mostrar dados finais se solicitado
    if (isDebugRequest && pendingEnrollments.length > 0) {
      console.log('📋 DEBUG - Dados finais primeiro aluno:', JSON.stringify(pendingEnrollments[0]));
      if (pendingEnrollments.length > 1) {
        console.log('📋 DEBUG - Dados finais segundo aluno:', JSON.stringify(pendingEnrollments[1]));
      }
    }

    if (isDebugRequest) {
      const debugInfo = {
        pendingEnrollments,
        allStudents: dadosPessoaisProcessados, // Incluir todos os alunos da aba "dados pessoais"
        debug: {
          totalDadosPessoais: dadosPessoaisRows.length - 1, // -1 para excluir cabeçalho
          totalMatriculas: matriculasRows.length - 1, // -1 para excluir cabeçalho
          cpfsMatriculados: Array.from(cpfsMatriculados),
          totalPendentes: alunosPendentes.length,
          allEnvVars: {
            GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Existe' : 'Não existe',
            GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Existe' : 'Não existe',
            GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Existe' : 'Não existe'
          }
        }
      };
      return res.json(debugInfo);
    }

    res.json({ pendingEnrollments });

  } catch (error) {
    console.error('❌ Erro ao buscar matrículas pendentes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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