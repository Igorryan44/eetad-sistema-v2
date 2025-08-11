// Script para verificar todas as abas da planilha Google Sheets
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Função para carregar variáveis de ambiente
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  // Tentar carregar .env primeiro, depois .env.local
  const envFiles = ['.env', '.env.local'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      let currentKey = null;
      let currentValue = '';
      let inMultiLine = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Pular comentários e linhas vazias
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }
        
        // Se estamos em uma chave multi-linha
        if (inMultiLine) {
          currentValue += '\n' + line;
          // Verificar se chegamos ao final da chave privada
          if (line.includes('-----END PRIVATE KEY-----')) {
            process.env[currentKey] = currentValue;
            inMultiLine = false;
            currentKey = null;
            currentValue = '';
          }
          continue;
        }
        
        // Processar linha normal
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          
          // Verificar se é o início de uma chave privada
          if (value.includes('-----BEGIN PRIVATE KEY-----')) {
            currentKey = key;
            currentValue = value;
            inMultiLine = true;
          } else {
            process.env[key] = value;
          }
        }
      }
      
      console.log(`✅ Carregado arquivo: ${envFile}`);
      break;
    }
  }
}

// Carregar variáveis de ambiente
loadEnvFile();

// Usar as credenciais do arquivo .env
const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Função para obter token de acesso
async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };
    
    const token = jwt.sign(payload, GOOGLE_PRIVATE_KEY, { algorithm: 'RS256' });
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });
    
    const data = await response.json();
    return data.access_token;
}

async function verificarTodasAbas() {
    console.log('🔍 VERIFICAÇÃO DE TODAS AS ABAS');
    console.log('===============================\n');
    
    try {
        const accessToken = await getAccessToken();
        
        // 1. Obter informações da planilha e suas abas
        console.log('1️⃣ Obtendo informações da planilha...');
        const spreadsheetResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );
        
        const spreadsheetData = await spreadsheetResponse.json();
        
        if (!spreadsheetData.sheets) {
            console.log('❌ Nenhuma aba encontrada na planilha');
            return;
        }
        
        console.log(`📊 Total de abas: ${spreadsheetData.sheets.length}`);
        console.log('📋 Abas encontradas:');
        spreadsheetData.sheets.forEach((sheet, index) => {
            console.log(`   ${index + 1}. ${sheet.properties.title}`);
        });
        
        // 2. Verificar dados em cada aba
        console.log('\n2️⃣ Verificando dados em cada aba...\n');
        
        for (const sheet of spreadsheetData.sheets) {
            const sheetName = sheet.properties.title;
            console.log(`📄 Verificando aba: "${sheetName}"`);
            
            try {
                const dataResponse = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A:Z`,
                    {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    }
                );
                
                const sheetData = await dataResponse.json();
                
                if (!sheetData.values || sheetData.values.length === 0) {
                    console.log(`   ✅ Aba vazia\n`);
                    continue;
                }
                
                console.log(`   📊 Total de linhas: ${sheetData.values.length}`);
                
                // Mostrar cabeçalhos
                if (sheetData.values[0]) {
                    console.log(`   📋 Cabeçalhos: ${sheetData.values[0].join(' | ')}`);
                }
                
                // Verificar se há dados de teste
                let linhasTeste = 0;
                let dadosReais = 0;
                
                for (let i = 1; i < sheetData.values.length; i++) {
                    const row = sheetData.values[i];
                    const rowText = row.join(' ').toLowerCase();
                    
                    if (rowText.includes('teste') || rowText.includes('joão teste') || rowText.includes('núcleo teste')) {
                        linhasTeste++;
                        if (linhasTeste <= 3) { // Mostrar apenas as primeiras 3 linhas de teste
                            console.log(`   🧪 Linha teste ${i + 1}: ${row.slice(0, 4).join(' | ')}`);
                        }
                    } else if (row.some(cell => cell && cell.trim())) {
                        dadosReais++;
                        if (dadosReais <= 3) { // Mostrar apenas as primeiras 3 linhas reais
                            console.log(`   📝 Dados reais ${i + 1}: ${row.slice(0, 4).join(' | ')}`);
                        }
                    }
                }
                
                if (linhasTeste > 3) {
                    console.log(`   🧪 ... e mais ${linhasTeste - 3} linhas de teste`);
                }
                
                if (dadosReais > 3) {
                    console.log(`   📝 ... e mais ${dadosReais - 3} linhas de dados reais`);
                }
                
                console.log(`   📈 Resumo: ${linhasTeste} linhas de teste, ${dadosReais} linhas de dados reais\n`);
                
            } catch (error) {
                console.log(`   ❌ Erro ao acessar aba: ${error.message}\n`);
            }
            
            // Aguardar um pouco entre as consultas
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
}

// Executar verificação
verificarTodasAbas();