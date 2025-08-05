// Script para testar a conexão com Google Sheets

// Simular as variáveis de ambiente do Supabase
const SPREADSHEET_ID = '1o3nM1lDX17l6Hnqg-cxYsKXzsnNV6sQrALUgn2kJ2t0';

async function testGoogleSheetsConnection() {
  try {
    console.log('🔍 Testando conexão com Google Sheets...');
    console.log('📊 Spreadsheet ID:', SPREADSHEET_ID);
    
    // Testar se a planilha é acessível publicamente (para diagnóstico)
    const testUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
    console.log('🔗 URL da planilha:', testUrl);
    
    // Verificar se a planilha existe tentando acessar via API sem autenticação
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
    
    console.log('📡 Testando acesso à API...');
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (response.status === 403) {
      console.log('✅ Planilha existe, mas requer autenticação (esperado)');
      console.log('📋 Detalhes do erro:', data.error?.message);
      
      if (data.error?.message?.includes('does not have access')) {
        console.log('⚠️  A planilha não está compartilhada publicamente (correto para segurança)');
      }
    } else if (response.status === 404) {
      console.log('❌ Planilha não encontrada - verifique o ID');
      console.log('📋 Resposta:', data);
    } else {
      console.log('📊 Status da resposta:', response.status);
      console.log('📋 Dados:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
  }
}

// Executar teste
testGoogleSheetsConnection();