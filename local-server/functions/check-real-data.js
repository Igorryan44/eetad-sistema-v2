import express from 'express';
import { readSheetDataWithRetry } from '../utils/google-auth.js';

const router = express.Router();
const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const DADOS_PESSOAIS_SHEET = 'dados pessoais';

router.get('/', async (req, res) => {
  try {
    console.log('🔍 [check-real-data] Verificando dados reais na planilha...');
    
    // Ler todos os dados da planilha
    const allData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, "'dados pessoais'!A:Y");
    
    console.log(`📊 [check-real-data] Total de linhas na planilha: ${allData.length}`);
    
    // Verificar quantas linhas têm dados reais (não vazias)
    let realDataRows = 0;
    let emptyRows = 0;
    const realDataDetails = [];
    
    for (let i = 1; i < allData.length; i++) { // Começar do índice 1 para pular o cabeçalho
      const row = allData[i];
      
      // Verificar se a linha tem dados significativos (pelo menos nome e CPF)
      const hasName = row[4] && row[4].trim() !== ''; // Coluna E - nome
      const hasCpf = row[6] && row[6].trim() !== '';   // Coluna G - cpf
      
      if (hasName || hasCpf) {
        realDataRows++;
        realDataDetails.push({
          linha: i + 1, // +1 porque o índice começa em 0
          nome: row[4] || 'N/A',
          cpf: row[6] || 'N/A',
          origem: row[0] || 'N/A'
        });
        console.log(`✅ [check-real-data] Linha ${i + 1}: Nome="${row[4] || 'N/A'}", CPF="${row[6] || 'N/A'}"`);
      } else {
        emptyRows++;
        if (emptyRows <= 5) { // Mostrar apenas as primeiras 5 linhas vazias
          console.log(`❌ [check-real-data] Linha ${i + 1}: Vazia ou sem dados principais`);
        }
      }
    }
    
    console.log(`📈 [check-real-data] Resumo:`);
    console.log(`   - Linhas com dados reais: ${realDataRows}`);
    console.log(`   - Linhas vazias: ${emptyRows}`);
    console.log(`   - Próxima linha disponível seria: ${realDataRows + 2}`);
    
    res.json({
      success: true,
      totalRows: allData.length,
      realDataRows: realDataRows,
      emptyRows: emptyRows,
      nextAvailableRow: realDataRows + 2, // +1 para o cabeçalho, +1 para a próxima linha
      realDataDetails: realDataDetails
    });
    
  } catch (error) {
    console.error('❌ [check-real-data] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;