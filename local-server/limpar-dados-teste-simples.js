import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { readSheetData, makeAuthenticatedRequest } from './utils/google-auth.js';

async function limparDadosTesteSimples() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    console.log('❌ GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    return;
  }

  console.log('🧹 Identificando dados de teste na aba "matriculas"...\n');
  
  try {
    // Lê os dados da aba matriculas
    console.log('📖 Lendo dados da aba "matriculas"...');
    const data = await readSheetData(spreadsheetId, 'matriculas');
    
    if (!data || data.length === 0) {
      console.log('✅ Aba "matriculas" está vazia');
      return;
    }
    
    console.log(`📊 Total de linhas encontradas: ${data.length}`);
    
    // Identifica linhas de teste
    const linhasTeste = [];
    
    for (let i = 1; i < data.length; i++) { // Pula o cabeçalho (linha 0)
      const linha = data[i];
      
      // Verifica se é dado de teste
      const isTestData = linha.some(cell => {
        if (!cell) return false;
        const cellStr = cell.toString().toLowerCase();
        return cellStr.includes('teste') || 
               cellStr.includes('test') ||
               cellStr.includes('joão teste') ||
               cellStr.includes('núcleo teste') ||
               cellStr.includes('subnúcleo teste');
      });
      
      if (isTestData) {
        linhasTeste.push({
          linha: i + 1, // +1 porque o Google Sheets usa índice baseado em 1
          dados: linha.slice(0, 5).join(' | ') // Primeiras 5 colunas para identificação
        });
      }
    }
    
    console.log(`\n📊 DADOS DE TESTE ENCONTRADOS:`);
    console.log('='.repeat(60));
    
    if (linhasTeste.length === 0) {
      console.log('✅ Nenhum dado de teste encontrado');
      return;
    }
    
    linhasTeste.forEach((item, index) => {
      console.log(`${index + 1}. Linha ${item.linha}: ${item.dados}`);
    });
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de linhas: ${data.length}`);
    console.log(`   Dados de teste encontrados: ${linhasTeste.length}`);
    
    // Para remover as linhas, vamos usar a API de batch update
    console.log('\n🗑️ Removendo linhas de teste...');
    
    // Ordena as linhas em ordem decrescente para remover de baixo para cima
    // (evita problemas com índices que mudam após remoção)
    const linhasOrdenadas = linhasTeste
      .map(item => item.linha - 1) // Converte para índice baseado em 0
      .sort((a, b) => b - a); // Ordem decrescente
    
    // Prepara as requisições de remoção
    const requests = linhasOrdenadas.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId: 1590144264, // ID da aba "matriculas" (obtido anteriormente)
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1
        }
      }
    }));
    
    // Executa a remoção em lote
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    
    const response = await makeAuthenticatedRequest(batchUpdateUrl, {
      method: 'POST',
      body: JSON.stringify({
        requests: requests
      })
    });
    
    const result = await response.json();
    
    console.log(`✅ ${linhasTeste.length} linhas de teste removidas com sucesso!`);
    console.log('📊 Planilha limpa e pronta para uso');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error.message);
    
    // Se der erro, mostra instruções manuais
    console.log('\n💡 INSTRUÇÕES PARA LIMPEZA MANUAL:');
    console.log('1. Abra a planilha no Google Sheets');
    console.log('2. Vá para a aba "matriculas"');
    console.log('3. Procure por linhas que contenham:');
    console.log('   - "João Teste"');
    console.log('   - "Núcleo Teste"');
    console.log('   - "Subnúcleo Teste"');
    console.log('   - Qualquer texto com "teste"');
    console.log('4. Delete essas linhas manualmente');
  }
}

limparDadosTesteSimples();