const { getGoogleJwt } = require('./utils/google-auth');

async function adicionarAlunoTeste() {
  console.log('🎯 Adicionando aluno de teste para efetivação...\n');
  
  try {
    // Obter token de acesso
    const accessToken = await getGoogleJwt();
    
    const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    
    // Dados do aluno de teste
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const alunoTeste = [
      currentDate, // A - timestamp
      'João Silva Teste', // B - nome
      'Núcleo Central', // C - nucleo
      '12345678901', // D - cpf
      'MG1234567', // E - rg
      '(31) 99999-9999', // F - telefone
      'joao.teste@email.com', // G - email
      'Masculino', // H - sexo
      'Solteiro', // I - estado civil
      '01/01/1990', // J - data nascimento
      'MG', // K - uf nascimento
      'Superior Completo', // L - escolaridade
      'Engenheiro', // M - profissao
      'Brasileira', // N - nacionalidade
      'Membro', // O - cargo igreja
      'Rua das Flores, 123', // P - endereco rua
      '30000-000', // Q - cep
      '123', // R - numero
      'Centro', // S - bairro
      'Belo Horizonte', // T - cidade
      'MG', // U - uf
      'Igreja Central', // V - congregacao
      'Pendente' // W - status (importante para aparecer como pendente)
    ];
    
    console.log('📝 Dados do aluno teste:', {
      nome: alunoTeste[1],
      cpf: alunoTeste[3],
      nucleo: alunoTeste[2],
      status: alunoTeste[22]
    });
    
    // Adicionar na planilha
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${DADOS_PESSOAIS_SHEET}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [alunoTeste]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao adicionar aluno: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Aluno de teste adicionado com sucesso!');
    console.log('📊 Range atualizado:', result.updates.updatedRange);
    
    // Extrair número da linha
    const rangeMatch = result.updates.updatedRange.match(/(\d+):(\d+)$/);
    if (rangeMatch) {
      const rowNumber = rangeMatch[1];
      console.log(`📍 Aluno adicionado na linha: ${rowNumber}`);
      console.log(`🎯 Use rowIndex: ${rowNumber} para testar a efetivação`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar aluno teste:', error);
  }
}

// Executar
adicionarAlunoTeste();