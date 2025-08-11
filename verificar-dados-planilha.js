import { readSheetData } from './local-server/utils/google-auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para carregar variáveis de ambiente
function loadEnvFile() {
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
        
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }
        
        if (inMultiLine) {
          currentValue += '\n' + line;
          if (line.includes('-----END PRIVATE KEY-----')) {
            process.env[currentKey] = currentValue;
            inMultiLine = false;
            currentKey = null;
            currentValue = '';
          }
          continue;
        }
        
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          
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

async function verificarDadosPlanilha() {
  try {
    console.log('🔍 VERIFICAÇÃO DOS DADOS DA PLANILHA');
    console.log('====================================');
    
    // Carregar variáveis de ambiente
    loadEnvFile();
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado');
    }
    
    console.log(`📊 ID da Planilha: ${GOOGLE_SHEETS_SPREADSHEET_ID}`);
    
    // Lista de abas para verificar
    const abas = ['matriculas', 'alunos matriculados', 'pedidos', 'pagamentos', 'usuarios'];
    
    for (const aba of abas) {
      try {
        console.log(`\n📋 Verificando aba: "${aba}"`);
        
        const dados = await readSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, aba);
        
        if (!dados || dados.length === 0) {
          console.log(`   ❌ Aba "${aba}" está vazia ou não existe`);
          continue;
        }
        
        console.log(`   ✅ Aba "${aba}" encontrada com ${dados.length} linhas`);
        
        // Mostrar cabeçalho se existir
        if (dados.length > 0) {
          console.log(`   📝 Cabeçalho: ${JSON.stringify(dados[0])}`);
        }
        
        // Verificar se há dados de teste
        let dadosTeste = 0;
        for (let i = 1; i < dados.length; i++) {
          const linha = dados[i];
          const linhaTexto = linha.join(' ').toLowerCase();
          
          if (linhaTexto.includes('teste') || 
              linhaTexto.includes('joão teste') || 
              linhaTexto.includes('núcleo teste') ||
              linhaTexto.includes('subnúcleo teste') ||
              linhaTexto.includes('ciclo teste')) {
            dadosTeste++;
            console.log(`   🧪 Linha ${i + 1} contém dados de teste: ${JSON.stringify(linha)}`);
          }
        }
        
        if (dadosTeste > 0) {
          console.log(`   ⚠️  Total de linhas com dados de teste: ${dadosTeste}`);
        } else {
          console.log(`   ✅ Nenhum dado de teste encontrado`);
        }
        
        // Mostrar algumas linhas de exemplo (máximo 3)
        const exemplos = Math.min(3, dados.length - 1);
        if (exemplos > 0) {
          console.log(`   📄 Primeiras ${exemplos} linhas de dados:`);
          for (let i = 1; i <= exemplos; i++) {
            console.log(`      ${i}: ${JSON.stringify(dados[i])}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao acessar aba "${aba}": ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
verificarDadosPlanilha();