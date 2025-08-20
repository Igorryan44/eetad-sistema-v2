import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { appendSheetData, readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.get('/', async (req, res) => {
  try {
    console.log('🧪 [test-save-complete] Testando salvamento completo...');
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    
    // Dados de teste completos
    const currentTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const testCpf = '555.666.777-88';
    
    const rowData = [
      'Teste Completo', // A - origem_academica
      'Escola Completa', // B - escola_anterior
      'Modalidade Completa', // C - modalidade_anterior
      'Congregacao Completa', // D - congregacao
      'Aluno Teste Completo', // E - nome
      '55.666.777-8', // F - rg
      testCpf, // G - cpf
      '(11) 88888-8888', // H - telefone
      'completo@teste.com', // I - email
      'Masculino', // J - sexo
      'Solteiro', // K - estado_civil
      '01/01/1995', // L - data_nascimento
      'SP', // M - uf_nascimento
      'Superior Completo', // N - escolaridade
      'Testador', // O - profissao
      'Brasileira', // P - nacionalidade
      'Membro', // Q - cargo_igreja
      'Rua Completa, 555', // R - endereco_rua
      '01234-567', // S - cep
      '555', // T - numero
      'Bairro Completo', // U - bairro
      'São Paulo', // V - cidade
      'SP', // W - uf
      currentTimestamp, // X - data_cadastro
      'Pendente' // Y - Status inicial
    ];
    
    console.log('🧪 [test-save-complete] Dados a serem salvos:', rowData);
    console.log('🧪 [test-save-complete] CPF de teste:', testCpf);
    
    // Descobrir a próxima linha vazia e salvar dados
    const currentData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:Y`);
    const nextRow = Math.min(currentData.length + 1, 1013); // Limitar ao máximo de linhas
    const specificRange = `${DADOS_PESSOAIS_SHEET}!A${nextRow}:Y${nextRow}`;
    
    console.log(`🧪 [test-save-complete] Salvando na linha ${nextRow} com range: ${specificRange}`);
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, specificRange, [rowData]);
    
    console.log('✅ [test-save-complete] Dados salvos com sucesso');
    
    // Aguardar um pouco e verificar se foi salvo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ler dados da planilha
    const rows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'dados pessoais'!A:Y", 3, true);
    
    console.log('🧪 [test-save-complete] Total de linhas após salvamento:', rows.length);
    
    // Verificar se o CPF foi encontrado
    const cpfClean = testCpf.replace(/\D/g, '');
    console.log('🔍 [test-save-complete] Procurando CPF:', cpfClean);
    
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row.length > 6) {
        const cellValue = String(row[6] || '').replace(/\D/g, '');
        if (cellValue === cpfClean) {
          console.log('✅ [test-save-complete] CPF encontrado na linha', i, ':', row);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      console.log('❌ [test-save-complete] CPF não encontrado');
      // Mostrar as últimas 3 linhas
      console.log('🧪 [test-save-complete] Últimas 3 linhas:');
      for (let i = Math.max(1, rows.length - 3); i < rows.length; i++) {
        console.log(`Linha ${i}:`, rows[i]);
      }
    }
    
    res.json({
      success: true,
      testCpf: testCpf,
      found: found,
      totalRows: rows.length,
      message: found ? 'CPF encontrado após salvamento' : 'CPF não encontrado após salvamento'
    });
    
  } catch (error) {
    console.error('❌ [test-save-complete] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;