/**
 * 📊 Função: get-pendente-students
 * Busca alunos com status 'pendente' da aba 'dados pessoais'
 */

import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();

// Aplicar CORS
router.use(corsMiddleware);

// Rota POST principal
router.post('/', async (req, res) => {
  try {
    console.log('📊 [get-pendente-students] Iniciando busca por alunos pendentes...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-pendente-students] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "dados pessoais" com retry
    const rows = await readSheetDataWithRetry(spreadsheetId, "'dados pessoais'!A:Y", 3);
    
    if (rows.length === 0) {
      console.log('📊 [get-pendente-students] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    console.log(`📊 [get-pendente-students] ${rows.length} linhas encontradas na aba 'dados pessoais'`);
    
    // Processar dados (pular cabeçalho)
    const pendenteStudents = rows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque pulamos cabeçalho e índice começa em 0
      
      const student = {
        rowIndex,
        origem_academica: row[0] || '', // A
        subnucleo: row[1] || '', // B
        congregacao: row[2] || '', // C
        nucleo: row[3] || '', // D
        nome: row[4] || '', // E
        rg: row[5] || '', // F
        cpf: row[6] || '', // G
        telefone: row[7] || '', // H
        email: row[8] || '', // I
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
      
      return student;
    }).filter(student => {
      // Filtrar apenas alunos com dados válidos e status 'pendente'
      const hasValidData = student.nome && student.cpf;
      const isPendente = student.status && student.status.toLowerCase() === 'pendente';
      
      if (hasValidData && isPendente) {
        console.log(`✅ [get-pendente-students] Aluno pendente encontrado: ${student.nome}`);
      }
      
      return hasValidData && isPendente;
    });

    console.log(`📊 [get-pendente-students] Total de alunos pendentes: ${pendenteStudents.length}`);

    res.json(pendenteStudents);

  } catch (error) {
    console.error('❌ [get-pendente-students] Erro:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota GET para compatibilidade
router.get('/', async (req, res) => {
  try {
    console.log('📊 [get-pendente-students] Iniciando busca por alunos pendentes (GET)...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-pendente-students] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "dados pessoais" com retry
    const rows = await readSheetDataWithRetry(spreadsheetId, "'dados pessoais'!A:Y", 3);
    
    if (rows.length === 0) {
      console.log('📊 [get-pendente-students] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    console.log(`📊 [get-pendente-students] ${rows.length} linhas encontradas na aba 'dados pessoais'`);
    
    // Processar dados (pular cabeçalho)
    const pendenteStudents = rows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque pulamos cabeçalho e índice começa em 0
      
      const student = {
        rowIndex,
        origem_academica: row[0] || '', // A
        subnucleo: row[1] || '', // B
        congregacao: row[2] || '', // C
        nucleo: row[3] || '', // D
        nome: row[4] || '', // E
        rg: row[5] || '', // F
        cpf: row[6] || '', // G
        telefone: row[7] || '', // H
        email: row[8] || '', // I
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
      
      return student;
    }).filter(student => {
      // Filtrar apenas alunos com dados válidos e status 'pendente'
      const hasValidData = student.nome && student.cpf;
      const isPendente = student.status && student.status.toLowerCase() === 'pendente';
      
      if (hasValidData && isPendente) {
        console.log(`✅ [get-pendente-students] Aluno pendente encontrado: ${student.nome}`);
      }
      
      return hasValidData && isPendente;
    });

    console.log(`📊 [get-pendente-students] Total de alunos pendentes: ${pendenteStudents.length}`);

    res.json(pendenteStudents);

  } catch (error) {
    console.error('❌ [get-pendente-students] Erro:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-pendente-students operacional' });
});

export default router;