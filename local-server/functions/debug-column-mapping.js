import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { appendSheetData, readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.get('/', async (req, res) => {
  try {
    console.log('🔍 [debug-column-mapping] Verificando mapeamento de colunas...');
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    
    // Ler dados da planilha
    const rows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'dados pessoais'!A:Y", 3, true);
    
    console.log('🔍 [debug-column-mapping] Total de linhas:', rows.length);
    
    // Verificar quantas linhas têm dados reais
    let realDataCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const hasName = row[4] && row[4].trim() !== ''; // Coluna E - nome
      const hasCpf = row[6] && row[6].trim() !== '';   // Coluna G - cpf
      
      if (hasName || hasCpf) {
        realDataCount++;
        console.log(`✅ [debug-column-mapping] Linha ${i + 1} com dados: Nome="${row[4] || 'N/A'}", CPF="${row[6] || 'N/A'}"`);
      }
    }
    
    console.log(`📊 [debug-column-mapping] Linhas com dados reais: ${realDataCount}`);
    console.log(`📊 [debug-column-mapping] Próxima linha disponível: ${realDataCount + 2}`);
    
    // Verificar a última linha salva
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      console.log('🔍 [debug-column-mapping] Última linha completa:', lastRow);
      console.log('🔍 [debug-column-mapping] Número de colunas na última linha:', lastRow ? lastRow.length : 0);
      
      // Verificar cada coluna individualmente
      if (lastRow && lastRow.length > 0) {
        for (let i = 0; i < Math.min(lastRow.length, 25); i++) {
          const columnLetter = String.fromCharCode(65 + i); // A=65, B=66, etc.
          console.log(`🔍 [debug-column-mapping] Coluna ${columnLetter} (índice ${i}): "${lastRow[i] || ''}"`);
        }
      }
    }
    
    // Verificar também o cabeçalho se existir
    if (rows.length > 1) {
      const headerRow = rows[0];
      console.log('🔍 [debug-column-mapping] Cabeçalho:', headerRow);
      console.log('🔍 [debug-column-mapping] Número de colunas no cabeçalho:', headerRow ? headerRow.length : 0);
    }
    
    res.json({
      success: true,
      totalRows: rows.length,
      lastRow: rows.length > 0 ? rows[rows.length - 1] : null,
      headerRow: rows.length > 1 ? rows[0] : null
    });
    
  } catch (error) {
    console.error('❌ [debug-column-mapping] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;