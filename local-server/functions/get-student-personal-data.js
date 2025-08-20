/**
 * 📊 Função: get-student-personal-data
 * Busca dados pessoais completos do aluno por CPF
 */

import { Router } from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';
import { corsMiddleware } from '../utils/cors.js';

const router = Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📊 [get-student-personal-data] Iniciando busca por dados pessoais...');
    
    const { cpf } = req.body;
    
    if (!cpf) {
      console.error('📊 [get-student-personal-data] CPF não fornecido');
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [get-student-personal-data] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "dados pessoais" com range específico e retry (sempre forçar refresh para garantir dados atualizados)
    const rows = await readSheetDataWithRetry(spreadsheetId, "'dados pessoais'!A:Y", 3, true);
    
    if (rows.length === 0) {
      console.log('📊 [get-student-personal-data] Nenhum dado encontrado na planilha');
      return res.json({ found: false });
    }

    // Mapear índices dos cabeçalhos (baseado na estrutura da planilha)
    const headerRow = rows[0];
    console.log('📊 [get-student-personal-data] Cabeçalhos encontrados:', headerRow);
    console.log('📊 [get-student-personal-data] Total de linhas na planilha:', rows.length);
    
    // Buscar por CPF - vamos verificar em qual posição está realmente
    const cpfClean = cpf.replace(/\D/g, '');
    console.log('🔍 [get-student-personal-data] Procurando CPF:', cpfClean);
    
    // Log das primeiras 5 linhas para debug
    console.log('📊 [get-student-personal-data] Primeiras 5 linhas de dados:');
    for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
      console.log(`Linha ${i}:`, rows[i]);
    }
    
    // Log das últimas 5 linhas para debug
    console.log('📊 [get-student-personal-data] Últimas 5 linhas de dados:');
    for (let i = Math.max(1, rows.length - 5); i < rows.length; i++) {
      console.log(`Linha ${i}:`, rows[i]);
    }
    
    let studentRow = null;
    let cpfColumnIndex = -1;
    
    // Procurar o CPF em todas as linhas (pular cabeçalho)
    console.log(`🔍 [get-student-personal-data] Total de linhas para verificar: ${rows.length}`);
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Verificar cada coluna da linha
      for (let j = 0; j < row.length; j++) {
        const cellValue = (row[j] || '').toString().replace(/\D/g, '');
        if (cellValue === cpfClean) {
          console.log(`✅ [get-student-personal-data] CPF encontrado na linha ${i}, coluna ${j}`);
          console.log(`📋 [get-student-personal-data] Dados da linha:`, row);
          studentRow = row;
          cpfColumnIndex = j;
          break;
        }
        // Log para CPFs similares (debug)
        if (cellValue.length >= 8 && cpfClean.includes(cellValue.substring(0, 8))) {
          console.log(`🔍 [get-student-personal-data] CPF similar encontrado na linha ${i}, coluna ${j}: ${cellValue}`);
        }
      }
      
      if (studentRow) break;
    }

    if (!studentRow) {
      console.log(`📊 [get-student-personal-data] Aluno não encontrado para CPF: ${cpf}`);
      return res.json({ found: false });
    }

    // Mapear dados do aluno baseado nos cabeçalhos reais da planilha
    // Cabeçalhos: ['origem_academica', 'em qual escola estudou?', 'em qual modalidade estudou?', 'congregacao', 'nome', 'rg', 'cpf', 'telefone', 'email', 'sexo', 'estado_civil', 'data_nascimento', 'uf_nascimento', 'escolaridade', 'profissao', 'nacionalidade', 'cargo_igreja', 'endereco_rua', 'cep', 'numero', 'bairro', 'cidade', 'uf', 'data_cadastro', 'status']
    
    // Encontrar os índices corretos baseados nos cabeçalhos
    const getColumnIndex = (headerName) => {
      const index = headerRow.findIndex(header => header.toLowerCase().includes(headerName.toLowerCase()));
      return index >= 0 ? index : -1;
    };
    
    const studentData = {
      origemAcademica: studentRow[getColumnIndex('origem_academica')] || studentRow[0] || '',
      escolaAnterior: studentRow[getColumnIndex('escola estudou')] || studentRow[1] || '',
      modalidadeAnterior: studentRow[getColumnIndex('modalidade estudou')] || studentRow[2] || '',
      congregacao: studentRow[getColumnIndex('congregacao')] || studentRow[3] || '',
      nome: studentRow[getColumnIndex('nome')] || studentRow[4] || '',
      rg: studentRow[getColumnIndex('rg')] || studentRow[5] || '',
      cpf: studentRow[cpfColumnIndex] || studentRow[getColumnIndex('cpf')] || studentRow[6] || '',
      telefone: studentRow[getColumnIndex('telefone')] || studentRow[7] || '',
      email: studentRow[getColumnIndex('email')] || studentRow[8] || '',
      sexo: studentRow[getColumnIndex('sexo')] || studentRow[9] || '',
      estadoCivil: studentRow[getColumnIndex('estado_civil')] || studentRow[10] || '',
      dataNascimento: studentRow[getColumnIndex('data_nascimento')] || studentRow[11] || '',
      ufNascimento: studentRow[getColumnIndex('uf_nascimento')] || studentRow[12] || '',
      escolaridade: studentRow[getColumnIndex('escolaridade')] || studentRow[13] || '',
      profissao: studentRow[getColumnIndex('profissao')] || studentRow[14] || '',
      nacionalidade: studentRow[getColumnIndex('nacionalidade')] || studentRow[15] || '',
      cargoIgreja: studentRow[getColumnIndex('cargo_igreja')] || studentRow[16] || '',
      enderecoRua: studentRow[getColumnIndex('endereco_rua')] || studentRow[17] || '',
      cep: studentRow[getColumnIndex('cep')] || studentRow[18] || '',
      numero: studentRow[getColumnIndex('numero')] || studentRow[19] || '',
      bairro: studentRow[getColumnIndex('bairro')] || studentRow[20] || '',
      cidade: studentRow[getColumnIndex('cidade')] || studentRow[21] || '',
      uf: studentRow[getColumnIndex('uf')] || studentRow[22] || '',
      dataCadastro: studentRow[getColumnIndex('data_cadastro')] || studentRow[23] || '',
      status: studentRow[getColumnIndex('status')] || studentRow[24] || ''
    };
    
    console.log('📊 [get-student-personal-data] Dados mapeados:', studentData);

    console.log(`📊 [get-student-personal-data] Dados encontrados para CPF: ${cpf}`);

    res.json({
      found: true,
      data: studentData
    });
    
  } catch (error) {
    console.error('📊 [get-student-personal-data] Erro:', error);
    res.status(500).json({ error: `Erro: ${error.message}` });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-student-personal-data operacional' });
});

export default router;