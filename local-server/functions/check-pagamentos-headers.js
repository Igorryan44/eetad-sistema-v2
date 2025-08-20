import { readSheetData } from '../utils/google-auth.js';

export default async (req, res) => {
  try {
    console.log('🔍 Verificando cabeçalhos da aba pagamentos...');
    
    // Buscar cabeçalhos (primeira linha A1:N1)
    const headersData = await readSheetData('pagamentos!A1:N1');
    console.log('📋 Cabeçalhos da aba pagamentos:', headersData);
    
    // Buscar dados de exemplo (primeiras 10 linhas A1:N10)
    const exampleData = await readSheetData('pagamentos!A1:N10');
    console.log('📋 Dados de exemplo:', exampleData);
    
    res.json({
      success: true,
      headers: headersData && headersData.length > 0 ? headersData[0] : [],
      exampleData: exampleData || [],
      totalColumns: headersData && headersData.length > 0 ? headersData[0].length : 0,
      message: 'Cabeçalhos da aba pagamentos carregados com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar cabeçalhos da aba pagamentos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao verificar cabeçalhos da aba pagamentos'
    });
  }
};