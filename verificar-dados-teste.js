import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readSheetData } from './local-server/utils/google-auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente (mesma ordem do servidor local)
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

async function verificarDadosTeste() {
  try {
    console.log('🔍 VERIFICAÇÃO DE DADOS DE TESTE NA PLANILHA');
    console.log('=============================================');
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado');
    }
    
    console.log(`📊 ID da Planilha: ${GOOGLE_SHEETS_SPREADSHEET_ID}`);
    console.log(`📧 Email da conta de serviço: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    console.log(`🔑 Chave privada carregada: ${process.env.GOOGLE_PRIVATE_KEY ? 'SIM' : 'NÃO'}`);
    
    // Lista de abas para verificar
    const abas = ['matriculas', 'alunos matriculados', 'pedidos', 'pagamentos'];
    
    let totalDadosTeste = 0;
    
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
        let dadosTesteAba = 0;
        const linhasTeste = [];
        
        for (let i = 1; i < dados.length; i++) {
          const linha = dados[i];
          const linhaTexto = linha.join(' ').toLowerCase();
          
          if (linhaTexto.includes('teste') || 
              linhaTexto.includes('joão teste') || 
              linhaTexto.includes('núcleo teste') ||
              linhaTexto.includes('subnúcleo teste') ||
              linhaTexto.includes('ciclo teste')) {
            dadosTesteAba++;
            totalDadosTeste++;
            linhasTeste.push({
              linha: i + 1,
              dados: linha
            });
            console.log(`   🧪 Linha ${i + 1} contém dados de teste: ${JSON.stringify(linha)}`);
          }
        }
        
        if (dadosTesteAba > 0) {
          console.log(`   ⚠️  Total de linhas com dados de teste nesta aba: ${dadosTesteAba}`);
        } else {
          console.log(`   ✅ Nenhum dado de teste encontrado nesta aba`);
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
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de dados de teste encontrados: ${totalDadosTeste}`);
    
    if (totalDadosTeste > 0) {
      console.log(`\n⚠️  AÇÃO NECESSÁRIA: Foram encontrados ${totalDadosTeste} registros de teste na planilha.`);
      console.log(`   Estes dados podem estar causando problemas no sistema.`);
      console.log(`   Considere remover estes dados de teste da planilha.`);
    } else {
      console.log(`\n✅ TUDO OK: Nenhum dado de teste encontrado na planilha.`);
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
verificarDadosTeste();