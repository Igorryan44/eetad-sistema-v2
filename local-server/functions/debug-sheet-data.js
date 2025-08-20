/**
 * 🔍 Função de Debug: debug-sheet-data
 * Mostra dados brutos das planilhas para debug
 */

import { Router } from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';
import { corsMiddleware } from '../utils/cors.js';

const router = Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🔍 [debug-sheet-data] Iniciando debug das planilhas...');
    
    const { sheet, cpf } = req.body;
    
    if (!sheet) {
      return res.status(400).json({ error: 'Nome da aba é obrigatório' });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba especificada com retry
    const rows = await readSheetDataWithRetry(spreadsheetId, sheet, 3);
    
    console.log(`🔍 [debug-sheet-data] Aba: ${sheet}`);
    console.log(`🔍 [debug-sheet-data] Total de linhas: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('🔍 [debug-sheet-data] Cabeçalhos:', rows[0]);
      
      // Se CPF foi fornecido, procurar por ele
      if (cpf) {
        const cpfClean = cpf.replace(/\D/g, '');
        console.log(`🔍 [debug-sheet-data] Procurando por CPF: ${cpfClean}`);
        
        // Procurar em todas as colunas
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          for (let j = 0; j < row.length; j++) {
            const cellValue = (row[j] || '').toString().replace(/\D/g, '');
            if (cellValue === cpfClean) {
              console.log(`🔍 [debug-sheet-data] CPF encontrado na linha ${i + 1}, coluna ${j}:`, row);
            }
          }
        }
      }
      
      // Mostrar primeiras 5 linhas de dados
      const sampleData = rows.slice(0, Math.min(6, rows.length));
      
      res.json({
        sheet,
        totalRows: rows.length,
        headers: rows[0],
        sampleData,
        success: true
      });
    } else {
      res.json({
        sheet,
        totalRows: 0,
        message: 'Nenhum dado encontrado',
        success: false
      });
    }
    
  } catch (error) {
    console.error('🔍 [debug-sheet-data] Erro:', error);
    res.status(500).json({ error: `Erro: ${error.message}` });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função debug-sheet-data operacional' });
});

export default router;