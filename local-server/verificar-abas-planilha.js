import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { makeAuthenticatedRequest } from './utils/google-auth.js';

async function verificarAbas() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    console.log('❌ GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    return;
  }

  console.log('🔍 Verificando abas da planilha...\n');
  
  try {
    // Busca informações da planilha
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const response = await makeAuthenticatedRequest(url);
    const data = await response.json();
    
    console.log('📊 ABAS ENCONTRADAS:');
    console.log('='.repeat(50));
    
    data.sheets.forEach((sheet, index) => {
      const title = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      const rowCount = sheet.properties.gridProperties?.rowCount || 0;
      const columnCount = sheet.properties.gridProperties?.columnCount || 0;
      
      console.log(`${index + 1}. "${title}"`);
      console.log(`   ID: ${sheetId}`);
      console.log(`   Dimensões: ${rowCount} linhas x ${columnCount} colunas`);
      console.log('');
    });
    
    console.log('✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar abas:', error.message);
  }
}

verificarAbas();