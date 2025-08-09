// Script para testar leitura da planilha diretamente
const SPREADSHEET_ID = '1Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testPlanilha() {
  try {
    console.log('🔍 Testando acesso à planilha...');
    
    // Simular obtenção do token (usando um token fictício para teste)
    const accessToken = 'fake-token-for-testing';
    
    // Testar diferentes ranges
    const ranges = ['usuarios!A:H', 'usuarios!A:G', 'usuarios!A1:H10'];
    
    for (const range of ranges) {
      console.log(`\n📊 Testando range: ${range}`);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
      
      try {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Resposta:', JSON.stringify(data, null, 2));
        
        if (data.values) {
          console.log(`Linhas encontradas: ${data.values.length}`);
          if (data.values.length > 0) {
            console.log('Primeira linha:', data.values[0]);
            if (data.values.length > 1) {
              console.log('Segunda linha:', data.values[1]);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Erro no range ${range}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testPlanilha();