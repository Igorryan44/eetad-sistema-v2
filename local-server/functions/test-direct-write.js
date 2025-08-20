import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { writeSheetData, readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.get('/', async (req, res) => {
  try {
    console.log('🧪 [test-direct-write] Testando escrita direta...');
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    
    // Dados de teste simples
    const testData = [
      'TESTE_A', // A
      'TESTE_B', // B  
      'TESTE_C', // C
      'TESTE_D', // D
      'TESTE_E', // E
      'TESTE_F', // F
      'TESTE_G_CPF', // G - CPF
      'TESTE_H', // H
      'TESTE_I', // I
      'TESTE_J', // J
      'TESTE_K', // K
      'TESTE_L', // L
      'TESTE_M', // M
      'TESTE_N', // N
      'TESTE_O', // O
      'TESTE_P', // P
      'TESTE_Q', // Q
      'TESTE_R', // R
      'TESTE_S', // S
      'TESTE_T', // T
      'TESTE_U', // U
      'TESTE_V', // V
      'TESTE_W', // W
      'TESTE_X', // X
      'TESTE_Y'  // Y
    ];
    
    console.log('🧪 [test-direct-write] Dados de teste:', testData);
    
    // Usar uma linha específica para teste (linha 1013 - última linha disponível)
    const testRow = 1013;
    const specificRange = `dados pessoais!A${testRow}:Y${testRow}`;
    
    console.log(`🧪 [test-direct-write] Escrevendo na linha ${testRow} com range: ${specificRange}`);
    
    // Escrever dados
    const writeResult = await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, specificRange, [testData]);
    console.log('🧪 [test-direct-write] Resultado da escrita:', writeResult);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ler dados para verificar
    const readData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, 'dados pessoais!A:Y', 3, true);
    
    console.log(`🧪 [test-direct-write] Total de linhas: ${readData.length}`);
    
    if (readData.length >= testRow) {
      const savedRow = readData[testRow - 1]; // -1 porque array é 0-indexed
      console.log(`🧪 [test-direct-write] Linha ${testRow} salva:`, savedRow);
      
      // Verificar se o CPF está na posição correta (coluna G, índice 6)
      const cpfValue = savedRow[6];
      console.log(`🧪 [test-direct-write] CPF na coluna G (índice 6): "${cpfValue}"`);
      
      if (cpfValue === 'TESTE_G_CPF') {
        console.log('✅ [test-direct-write] CPF encontrado na posição correta!');
      } else {
        console.log('❌ [test-direct-write] CPF não está na posição esperada');
      }
    } else {
      console.log('❌ [test-direct-write] Linha de teste não encontrada');
    }
    
    res.json({
      success: true,
      testRow,
      range: specificRange,
      writeResult,
      totalRows: readData.length
    });
    
  } catch (error) {
    console.error('❌ [test-direct-write] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;