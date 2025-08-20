/**
 * 📊 Função: list-sheet-tabs
 * Lista todas as abas da planilha do Google Sheets
 */

import { Router } from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { makeAuthenticatedRequest } from '../utils/google-auth.js';

const router = Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📊 [list-sheet-tabs] Listando abas da planilha...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [list-sheet-tabs] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Obter informações da planilha
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const spreadsheetResponse = await makeAuthenticatedRequest(getUrl);
    
    if (!spreadsheetResponse.ok) {
      const errorText = await spreadsheetResponse.text();
      console.error('❌ [list-sheet-tabs] Erro ao acessar planilha:', errorText);
      return res.status(500).json({ 
        error: 'Erro ao acessar planilha',
        details: errorText
      });
    }
    
    const spreadsheetData = await spreadsheetResponse.json();
    
    // Extrair informações das abas
    const sheets = spreadsheetData.sheets?.map(sheet => ({
      id: sheet.properties?.sheetId,
      title: sheet.properties?.title,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount
    })) || [];
    
    console.log('✅ [list-sheet-tabs] Abas encontradas:', sheets.map(s => s.title).join(', '));
    
    return res.json({ 
      success: true, 
      message: `Encontradas ${sheets.length} abas na planilha`,
      spreadsheetTitle: spreadsheetData.properties?.title,
      sheetsCount: sheets.length,
      sheets: sheets
    });

  } catch (error) {
    console.error('❌ [list-sheet-tabs] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;