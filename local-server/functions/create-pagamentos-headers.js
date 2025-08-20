import { writeSheetData } from '../utils/google-auth.js';

export default async (req, res) => {
  try {
    console.log('📝 Criando cabeçalhos para a aba pagamentos...');
    
    // Cabeçalhos para a aba pagamentos (A1:N1)
    const headers = [
      'payment_id',
      'external_reference', 
      'cpf',
      'nome_do_aluno',
      'ciclo',
      'livro',
      'valor_livro',
      'data_pagamento',
      'status_pagamento',
      'metodo_pagamento',
      'transaction_id',
      'observacao_pagamento',
      'timestamp_pagamento',
      'dados_adicionais'
    ];
    
    console.log('📋 Cabeçalhos a serem criados:', headers);
    
    // Escrever cabeçalhos na primeira linha da aba pagamentos
    await writeSheetData('pagamentos!A1:N1', [headers]);
    
    console.log('✅ Cabeçalhos da aba pagamentos criados com sucesso');
    
    res.json({
      success: true,
      headers: headers,
      totalColumns: headers.length,
      message: 'Cabeçalhos da aba pagamentos criados com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar cabeçalhos da aba pagamentos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao criar cabeçalhos da aba pagamentos'
    });
  }
};