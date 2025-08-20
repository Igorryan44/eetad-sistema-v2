/**
 * 🔍 Função: count-real-rows
 * Conta quantas linhas realmente contêm dados válidos na planilha
 */

import { Router } from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';
import { corsMiddleware } from '../utils/cors.js';

const router = Router();
router.use(corsMiddleware);

router.get('/', async (req, res) => {
  try {
    console.log('🔍 [count-real-rows] Iniciando contagem de linhas com dados reais...');
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('🔍 [count-real-rows] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "dados pessoais"
    const currentData = await readSheetDataWithRetry(spreadsheetId, 'dados pessoais!A:Y');
    
    console.log(`🔍 [count-real-rows] Total de linhas na planilha: ${currentData.length}`);
    
    // Analisar cada linha para identificar dados reais
    const realDataAnalysis = [];
    
    for (let i = 1; i < currentData.length; i++) { // Pular cabeçalho (linha 0)
      const row = currentData[i];
      const hasName = row[4] && row[4].trim() !== ''; // Coluna E - nome
      const hasCpf = row[6] && row[6].trim() !== '';   // Coluna G - cpf
      
      if (hasName || hasCpf) {
        const rowInfo = {
          lineNumber: i + 1, // +1 porque arrays começam em 0 mas planilha em 1
          nome: row[4] || '',
          cpf: row[6] || '',
          hasValidData: hasName && hasCpf
        };
        
        realDataAnalysis.push(rowInfo);
        console.log(`🔍 [count-real-rows] Linha ${rowInfo.lineNumber}: Nome="${rowInfo.nome}", CPF="${rowInfo.cpf}", Válido=${rowInfo.hasValidData}`);
      }
    }
    
    // Contar apenas linhas com dados válidos (nome E cpf)
    const validDataRows = realDataAnalysis.filter(row => row.hasValidData);
    
    console.log(`🔍 [count-real-rows] Total de linhas com dados: ${realDataAnalysis.length}`);
    console.log(`🔍 [count-real-rows] Total de linhas com dados válidos: ${validDataRows.length}`);
    
    // Calcular próxima linha disponível
    const nextAvailableLine = validDataRows.length + 2; // +2 porque linha 1 é cabeçalho
    
    console.log(`🔍 [count-real-rows] Próxima linha disponível: ${nextAvailableLine}`);
    
    res.json({
      success: true,
      totalRows: currentData.length,
      totalDataRows: realDataAnalysis.length,
      validDataRows: validDataRows.length,
      nextAvailableLine,
      analysis: realDataAnalysis,
      validRows: validDataRows
    });
    
  } catch (error) {
    console.error('🔍 [count-real-rows] Erro:', error);
    res.status(500).json({ error: `Erro: ${error.message}` });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função count-real-rows operacional' });
});

export default router;