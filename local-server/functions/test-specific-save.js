import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { appendSheetData, readSheetDataWithRetry, writeSheetData } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.get('/', async (req, res) => {
  try {
    console.log('🧪 [test-specific-save] Testando salvamento específico...');
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    
    // Primeiro, vamos ler os dados atuais para ver a estrutura
    console.log('🔍 [test-specific-save] Lendo dados atuais...');
    const currentRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'dados pessoais'!A:Y", 3, true);
    console.log('🔍 [test-specific-save] Total de linhas atuais:', currentRows.length);
    
    if (currentRows.length > 0) {
      console.log('🔍 [test-specific-save] Cabeçalho atual:', currentRows[0]);
      if (currentRows.length > 1) {
        console.log('🔍 [test-specific-save] Última linha antes do teste:', currentRows[currentRows.length - 1]);
      }
    }
    
    // Agora vamos salvar dados simples e específicos
    const testCpf = '999.888.777-66';
    const currentTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    // Criar um array com exatamente 25 elementos (A até Y)
    const rowData = [
      'Origem Teste',        // A - origem_academica
      'Escola Teste',        // B - em qual escola estudou?
      'Modalidade Teste',    // C - em qual modalidade estudou?
      'Congregacao Teste',   // D - congregacao
      'Nome Teste Específico', // E - nome
      '12.345.678-9',        // F - rg
      testCpf,               // G - cpf
      '(11) 99999-9999',     // H - telefone
      'teste@especifico.com', // I - email
      'Masculino',           // J - sexo
      'Solteiro',            // K - estado_civil
      '01/01/1990',          // L - data_nascimento
      'SP',                  // M - uf_nascimento
      'Superior',            // N - escolaridade
      'Testador',            // O - profissao
      'Brasileira',          // P - nacionalidade
      'Membro',              // Q - cargo_igreja
      'Rua Teste, 123',      // R - endereco_rua
      '12345-678',           // S - cep
      '123',                 // T - numero
      'Bairro Teste',        // U - bairro
      'Cidade Teste',        // V - cidade
      'SP',                  // W - uf
      currentTimestamp,      // X - data_cadastro
      'Pendente'             // Y - status
    ];
    
    console.log('🧪 [test-specific-save] Dados a serem salvos (25 elementos):');
    rowData.forEach((item, index) => {
      const columnLetter = String.fromCharCode(65 + index);
      console.log(`  ${columnLetter} (${index}): "${item}"`);
    });
    
    // Primeiro, vamos descobrir qual é a próxima linha vazia
    const currentData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, 'dados pessoais!A:Y');
    
    // Determinar a próxima linha vazia (considerando que linhas 2 e 3 têm dados reais)
    // Se há apenas dados reais nas linhas 2 e 3, a próxima linha disponível é a 4
    const realDataRows = currentData.filter((row, index) => {
      if (index === 0) return false; // Pular cabeçalho
      const hasName = row[4] && row[4].trim() !== ''; // Coluna E - nome
      const hasCpf = row[6] && row[6].trim() !== '';   // Coluna G - cpf
      return hasName || hasCpf;
    }).length;
    
    const nextRow = Math.min(realDataRows + 2, 1013); // +2 porque linha 1 é cabeçalho e contamos a partir da linha 2
    const specificRange = `dados pessoais!A${nextRow}:Y${nextRow}`;
    
    console.log(`🧪 [test-specific-save] Salvando na linha ${nextRow} com range: ${specificRange}`);
    
    // Usar writeSheetData para posicionamento exato
    const saveResult = await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, specificRange, [rowData]);
    console.log('🧪 [test-specific-save] Resultado do salvamento:', saveResult);
    
    // Aguardar e verificar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ler novamente para verificar
    const updatedRows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'dados pessoais'!A:Y", 3, true);
    console.log('🧪 [test-specific-save] Total de linhas após salvamento:', updatedRows.length);
    
    if (updatedRows.length > 0) {
      const lastRow = updatedRows[updatedRows.length - 1];
      console.log('🧪 [test-specific-save] Última linha após salvamento:', lastRow);
      console.log('🧪 [test-specific-save] Número de colunas na última linha:', lastRow ? lastRow.length : 0);
      
      // Verificar se o CPF está na posição correta
      if (lastRow && lastRow.length > 6) {
        const cpfInRow = lastRow[6]; // Coluna G (índice 6)
        console.log('🧪 [test-specific-save] CPF na coluna G (índice 6):', cpfInRow);
        
        if (cpfInRow === testCpf) {
          console.log('✅ [test-specific-save] CPF encontrado na posição correta!');
        } else {
          console.log('❌ [test-specific-save] CPF não está na posição esperada');
          // Procurar o CPF em outras posições
          for (let i = 0; i < lastRow.length; i++) {
            if (lastRow[i] === testCpf) {
              const columnLetter = String.fromCharCode(65 + i);
              console.log(`🔍 [test-specific-save] CPF encontrado na coluna ${columnLetter} (índice ${i})`);
              break;
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      testCpf: testCpf,
      totalRowsBefore: currentRows.length,
      totalRowsAfter: updatedRows.length,
      lastRow: updatedRows.length > 0 ? updatedRows[updatedRows.length - 1] : null
    });
    
  } catch (error) {
    console.error('❌ [test-specific-save] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;