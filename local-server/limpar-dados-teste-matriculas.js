import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { readSheetData, writeSheetData } from './utils/google-auth.js';

async function limparDadosTesteMatriculas() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    console.log('❌ GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    return;
  }

  console.log('🧹 Limpando dados de teste da aba "matriculas"...\n');
  
  try {
    // Lê os dados da aba matriculas
    console.log('📖 Lendo dados da aba "matriculas"...');
    const data = await readSheetData(spreadsheetId, 'matriculas');
    
    if (!data || data.length === 0) {
      console.log('✅ Aba "matriculas" está vazia');
      return;
    }
    
    console.log(`📊 Total de linhas encontradas: ${data.length}`);
    
    // Identifica o cabeçalho (primeira linha)
    const header = data[0];
    console.log('📝 Cabeçalho:', header.slice(0, 5).join(', '), '...');
    
    // Filtra dados que não são de teste
    const dadosLimpos = [header]; // Mantém o cabeçalho
    let dadosTesteRemovidos = 0;
    
    for (let i = 1; i < data.length; i++) {
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
        dadosTesteRemovidos++;
        console.log(`🗑️  Removendo linha ${i + 1}: ${linha.slice(0, 3).join(' | ')}`);
      } else {
        dadosLimpos.push(linha);
      }
    }
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Linhas originais: ${data.length}`);
    console.log(`   Dados de teste removidos: ${dadosTesteRemovidos}`);
    console.log(`   Linhas restantes: ${dadosLimpos.length}`);
    
    if (dadosTesteRemovidos > 0) {
      console.log('\n💾 Salvando dados limpos na planilha...');
      
      // Calcula o range para limpar toda a aba
      const maxRows = Math.max(data.length, 1000); // Garante que limpe linhas suficientes
      const maxCols = Math.max(header.length, 50); // Garante que limpe colunas suficientes
      
      // Converte número da coluna para letra (A, B, C, ..., Z, AA, AB, ...)
      function numberToColumn(num) {
        let result = '';
        while (num > 0) {
          num--;
          result = String.fromCharCode(65 + (num % 26)) + result;
          num = Math.floor(num / 26);
        }
        return result;
      }
      
      const lastColumn = numberToColumn(maxCols);
      const clearRange = `matriculas!A1:${lastColumn}${maxRows}`;
      
      console.log(`📝 Limpando range: ${clearRange}`);
      
      // Primeiro limpa toda a aba
      await writeSheetData(spreadsheetId, clearRange, []);
      
      // Depois escreve os dados limpos
      if (dadosLimpos.length > 0) {
        const writeRange = `matriculas!A1:${lastColumn}${dadosLimpos.length}`;
        console.log(`📝 Escrevendo dados limpos: ${writeRange}`);
        await writeSheetData(spreadsheetId, writeRange, dadosLimpos);
      }
      
      console.log('✅ Dados de teste removidos com sucesso!');
    } else {
      console.log('✅ Nenhum dado de teste encontrado para remover');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error.message);
  }
}

limparDadosTesteMatriculas();