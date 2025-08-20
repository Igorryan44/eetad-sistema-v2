/**
 * 📊 Função: get-matriculated-students
 * Busca alunos com status 'matriculado' da aba 'dados pessoais'
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
    console.log('📊 [get-matriculated-students] Iniciando busca por alunos matriculados...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-matriculated-students] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "dados pessoais" com retry
    const rows = await readSheetDataWithRetry(spreadsheetId, "'dados pessoais'!A:Y", 3);
    
    if (rows.length === 0) {
      console.log('📊 [get-matriculated-students] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    console.log(`📊 [get-matriculated-students] ${rows.length} linhas encontradas na aba 'dados pessoais'`);
    
    // Processar dados (pular cabeçalho)
    const matriculatedStudents = rows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque pulamos cabeçalho e índice começa em 0
      
      const student = {
        rowIndex,
        origemAcademica: row[0] || '', // origem_academica
        escolaAnterior: row[1] || '', // em qual escola estudou?
        modalidadeAnterior: row[2] || '', // em qual modalidade estudou?
        congregacao: row[3] || '', // congregacao
        nome: row[4] || '', // nome
        rg: row[5] || '', // rg
        cpf: row[6] || '', // cpf
        telefone: row[7] || '', // telefone
        email: row[8] || '', // email
        sexo: row[9] || '', // sexo
        estadoCivil: row[10] || '', // estado_civil
        dataNascimento: row[11] || '', // data_nascimento
        ufNascimento: row[12] || '', // uf_nascimento
        escolaridade: row[13] || '', // escolaridade
        profissao: row[14] || '', // profissao
        nacionalidade: row[15] || '', // nacionalidade
        cargoIgreja: row[16] || '', // cargo_igreja
        enderecoRua: row[17] || '', // endereco_rua
        cep: row[18] || '', // cep
        numero: row[19] || '', // numero
        bairro: row[20] || '', // bairro
        cidade: row[21] || '', // cidade
        uf: row[22] || '', // uf
        dataCadastro: row[23] || '', // data_cadastro
        status: row[24] || '' // status
      };
      
      // DEBUG: Log das primeiras 5 entradas
      if (index < 5) {
        console.log(`📊 DEBUG - Aluno ${index + 1}:`, JSON.stringify({
          nome: student.nome,
          cpf: student.cpf,
          status: student.status
        }));
      }
      
      return student;
    }).filter(student => {
      // Filtrar apenas alunos com dados válidos e status 'matriculado'
      const hasValidData = student.nome && student.cpf;
      const isMatriculated = student.status && student.status.toLowerCase() === 'matriculado';
      
      if (hasValidData && isMatriculated) {
        console.log(`✅ [get-matriculated-students] Aluno matriculado encontrado: ${student.nome}`);
      }
      
      return hasValidData && isMatriculated;
    });

    console.log(`📊 [get-matriculated-students] Total de alunos matriculados: ${matriculatedStudents.length}`);

    res.json(matriculatedStudents);

  } catch (error) {
    console.error('❌ [get-matriculated-students] Erro:', error);
    
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
    console.log('📊 [get-matriculated-students] Iniciando busca por alunos matriculados (GET)...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-matriculated-students] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "dados pessoais" com retry
    const rows = await readSheetDataWithRetry(spreadsheetId, "'dados pessoais'!A:Y", 3);
    
    if (rows.length === 0) {
      console.log('📊 [get-matriculated-students] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    console.log(`📊 [get-matriculated-students] ${rows.length} linhas encontradas na aba 'dados pessoais'`);
    
    // Processar dados (pular cabeçalho)
    const matriculatedStudents = rows.slice(1).map((row, index) => {
      const rowIndex = index + 2; // +2 porque pulamos cabeçalho e índice começa em 0
      
      const student = {
        rowIndex,
        origemAcademica: row[0] || '', // origem_academica
        escolaAnterior: row[1] || '', // em qual escola estudou?
        modalidadeAnterior: row[2] || '', // em qual modalidade estudou?
        congregacao: row[3] || '', // congregacao
        nome: row[4] || '', // nome
        rg: row[5] || '', // rg
        cpf: row[6] || '', // cpf
        telefone: row[7] || '', // telefone
        email: row[8] || '', // email
        sexo: row[9] || '', // sexo
        estadoCivil: row[10] || '', // estado_civil
        dataNascimento: row[11] || '', // data_nascimento
        ufNascimento: row[12] || '', // uf_nascimento
        escolaridade: row[13] || '', // escolaridade
        profissao: row[14] || '', // profissao
        nacionalidade: row[15] || '', // nacionalidade
        cargoIgreja: row[16] || '', // cargo_igreja
        enderecoRua: row[17] || '', // endereco_rua
        cep: row[18] || '', // cep
        numero: row[19] || '', // numero
        bairro: row[20] || '', // bairro
        cidade: row[21] || '', // cidade
        uf: row[22] || '', // uf
        dataCadastro: row[23] || '', // data_cadastro
        status: row[24] || '' // status
      };
      
      // DEBUG: Log das primeiras 5 entradas
      if (index < 5) {
        console.log(`📊 DEBUG - Aluno ${index + 1}:`, JSON.stringify({
          nome: student.nome,
          cpf: student.cpf,
          status: student.status
        }));
      }
      
      return student;
    }).filter(student => {
      // Filtrar apenas alunos com dados válidos e status 'matriculado'
      const hasValidData = student.nome && student.cpf;
      const isMatriculated = student.status && student.status.toLowerCase() === 'matriculado';
      
      if (hasValidData && isMatriculated) {
        console.log(`✅ [get-matriculated-students] Aluno matriculado encontrado: ${student.nome}`);
      }
      
      return hasValidData && isMatriculated;
    });

    console.log(`📊 [get-matriculated-students] Total de alunos matriculados: ${matriculatedStudents.length}`);

    res.json(matriculatedStudents);

  } catch (error) {
    console.error('❌ [get-matriculated-students] Erro:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-matriculated-students operacional' });
});

export default router;