/**
 * 📊 Função: create-tracking-sheet
 * Cria a aba 'rastreamento_pix' na planilha do Google Sheets se ela não existir
 */

import { Router } from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { makeAuthenticatedRequest } from '../utils/google-auth.js';

const router = Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📊 [create-tracking-sheet] Verificando/criando aba rastreamento_pix...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📊 [create-tracking-sheet] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Primeiro, verificar se a aba já existe
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const spreadsheetResponse = await makeAuthenticatedRequest(getUrl);
    const spreadsheetData = await spreadsheetResponse.json();
    
    // Verificar se a aba 'rastreamento_pix' já existe
    const sheetExists = spreadsheetData.sheets?.some(sheet => 
      sheet.properties?.title === 'rastreamento_pix'
    );
    
    if (sheetExists) {
      console.log('📊 [create-tracking-sheet] Aba rastreamento_pix já existe');
      return res.json({ 
        success: true, 
        message: 'Aba rastreamento_pix já existe',
        existed: true
      });
    }

    // Criar a aba 'rastreamento_pix'
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    
    const requestBody = {
      requests: [{
        addSheet: {
          properties: {
            title: 'rastreamento_pix',
            gridProperties: {
              rowCount: 1000,
              columnCount: 11
            },
            tabColor: {
              red: 0.2,
              green: 0.6,
              blue: 1.0
            }
          }
        }
      }]
    };

    const response = await makeAuthenticatedRequest(batchUpdateUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ [create-tracking-sheet] Aba rastreamento_pix criada com sucesso');
      
      // Adicionar cabeçalhos na nova aba
      const headers = [
        'ID Rastreamento',
        'Nome',
        'CPF',
        'Valor',
        'Chave PIX',
        'Descrição',
        'Status',
        'Data Criação',
        'Data Pagamento',
        'Observações',
        'Código PIX'
      ];
      
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/rastreamento_pix!A1:K1?valueInputOption=RAW`;
      
      await makeAuthenticatedRequest(valuesUrl, {
        method: 'PUT',
        body: JSON.stringify({
          values: [headers]
        })
      });
      
      console.log('✅ [create-tracking-sheet] Cabeçalhos adicionados na aba rastreamento_pix');
      
      return res.json({ 
        success: true, 
        message: 'Aba rastreamento_pix criada com sucesso',
        created: true,
        sheetId: result.replies[0].addSheet.properties.sheetId
      });
    } else {
      const errorText = await response.text();
      console.error('❌ [create-tracking-sheet] Erro ao criar aba:', errorText);
      return res.status(500).json({ 
        error: 'Erro ao criar aba rastreamento_pix',
        details: errorText
      });
    }

  } catch (error) {
    console.error('❌ [create-tracking-sheet] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;