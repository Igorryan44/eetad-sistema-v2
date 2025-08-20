import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();
router.use(corsMiddleware);

router.get('/', async (req, res) => {
  try {
    console.log('🔍 [debug-save-data] Verificando dados salvos na planilha...');

    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const range = "'dados pessoais'!A:Y";

    // Forçar refresh para garantir dados atualizados
    const rows = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, range, 3, true);
    
    console.log('📊 [debug-save-data] Total de linhas:', rows.length);
    
    // Mostrar as últimas 10 linhas
    console.log('📊 [debug-save-data] Últimas 10 linhas:');
    const startIndex = Math.max(1, rows.length - 10);
    for (let i = startIndex; i < rows.length; i++) {
      console.log(`Linha ${i}:`, rows[i]);
    }
    
    // Verificar especificamente a linha 1007 (última linha com dados)
    if (rows.length > 1007) {
      console.log('🔍 [debug-save-data] Linha 1007 completa:', JSON.stringify(rows[1007]));
      console.log('🔍 [debug-save-data] Coluna 6 (CPF) da linha 1007:', rows[1007][6]);
    }
    
    // Procurar por CPFs específicos de teste
    const testCpfs = ['12345678900', '98765432100', '11122233344'];
    console.log('🔍 [debug-save-data] Procurando CPFs de teste:', testCpfs);
    
    for (const testCpf of testCpfs) {
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row.length > 0) {
          for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').replace(/\D/g, '');
            if (cellValue === testCpf) {
              console.log(`✅ [debug-save-data] CPF ${testCpf} encontrado na linha ${i}, coluna ${j}:`, row);
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
      if (!found) {
        console.log(`❌ [debug-save-data] CPF ${testCpf} NÃO encontrado`);
      }
    }

    res.json({
      success: true,
      totalRows: rows.length,
      lastRows: rows.slice(-5),
      message: 'Debug concluído - verifique os logs do servidor'
    });

  } catch (error) {
    console.error('❌ [debug-save-data] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;