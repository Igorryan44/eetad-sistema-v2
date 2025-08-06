import fetch from 'node-fetch';

// Dados dos alunos que deveriam aparecer
const alunosEsperados = [
  { nome: "Simião Alves da Costa Junior", cpf: "61767735120" },
  { nome: "Bruno Alexandre Barros dos Santos", cpf: "003.807.533-40" }
];

async function verificarEstruturaDadosPessoais() {
  console.log('🔍 VERIFICANDO ESTRUTURA REAL DA ABA "dados pessoais"');
  console.log('================================================================');
  
  try {
    // Simular a mesma lógica da função get-pending-enrollments
    const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';
    
    // Fazer uma requisição direta para a API do Google Sheets (sem autenticação para teste)
    console.log('\n📊 1. Tentando acessar a planilha diretamente...');
    console.log(`ID da Planilha: ${GOOGLE_SHEETS_SPREADSHEET_ID}`);
    console.log(`Aba: ${DADOS_PESSOAIS_SHEET}`);
    
    // Como não temos as credenciais aqui, vamos simular o que a função deveria fazer
    console.log('\n⚠️ Não é possível acessar diretamente sem credenciais do Google');
    console.log('Mas podemos analisar o problema baseado nos dados fornecidos...');
    
    console.log('\n📋 2. ANÁLISE DOS DADOS FORNECIDOS:');
    console.log('Estrutura dos dados que você mostrou:');
    console.log('- origem_academica');
    console.log('- em qual escola estudou?');
    console.log('- em qual modalidade estudou?');
    console.log('- congregacao');
    console.log('- nome');
    console.log('- rg');
    console.log('- cpf');
    console.log('- telefone');
    console.log('- email');
    console.log('- sexo');
    console.log('- estado_civil');
    console.log('- data_nascimento');
    console.log('- uf_nascimento');
    console.log('- escolaridade');
    console.log('- profissao');
    console.log('- nacionalidade');
    console.log('- cargo_igreja');
    console.log('- endereco_rua');
    console.log('- cep');
    console.log('- numero');
    console.log('- bairro');
    console.log('- cidade');
    console.log('- uf');
    console.log('- data_cadastro');
    
    console.log('\n🔍 3. COMPARAÇÃO COM ESTRUTURA ESPERADA:');
    console.log('Função get-pending-enrollments espera:');
    console.log('- Índice 1 (Coluna B): Nome');
    console.log('- Índice 3 (Coluna D): CPF');
    console.log('- Índice 4 (Coluna E): Telefone');
    console.log('- Índice 5 (Coluna F): Email');
    
    console.log('\n🎯 4. POSSÍVEL PROBLEMA IDENTIFICADO:');
    console.log('Baseado nos dados fornecidos, parece que a estrutura real é:');
    console.log('- Coluna A: origem_academica');
    console.log('- Coluna B: em qual escola estudou?');
    console.log('- Coluna C: em qual modalidade estudou?');
    console.log('- Coluna D: congregacao');
    console.log('- Coluna E: nome ← AQUI está o nome (índice 4)');
    console.log('- Coluna F: rg');
    console.log('- Coluna G: cpf ← AQUI está o CPF (índice 6)');
    console.log('- Coluna H: telefone ← AQUI está o telefone (índice 7)');
    console.log('- Coluna I: email ← AQUI está o email (índice 8)');
    
    console.log('\n❌ PROBLEMA ENCONTRADO:');
    console.log('A função get-pending-enrollments está usando índices INCORRETOS!');
    console.log('');
    console.log('ATUAL (INCORRETO):');
    console.log('- Nome: índice 1 (Coluna B) → Mas na verdade é "em qual escola estudou?"');
    console.log('- CPF: índice 3 (Coluna D) → Mas na verdade é "congregacao"');
    console.log('- Telefone: índice 4 (Coluna E) → Mas na verdade é "nome"');
    console.log('- Email: índice 5 (Coluna F) → Mas na verdade é "rg"');
    console.log('');
    console.log('DEVERIA SER (CORRETO):');
    console.log('- Nome: índice 4 (Coluna E)');
    console.log('- CPF: índice 6 (Coluna G)');
    console.log('- Telefone: índice 7 (Coluna H)');
    console.log('- Email: índice 8 (Coluna I)');
    
    console.log('\n🔧 5. SOLUÇÃO:');
    console.log('Precisamos corrigir a função get-pending-enrollments para usar os índices corretos:');
    console.log('');
    console.log('ANTES:');
    console.log('const nome = row[1] || ""');
    console.log('const cpf = row[3] || ""');
    console.log('const telefone = row[4] || ""');
    console.log('const email = row[5] || ""');
    console.log('');
    console.log('DEPOIS:');
    console.log('const nome = row[4] || ""');
    console.log('const cpf = row[6] || ""');
    console.log('const telefone = row[7] || ""');
    console.log('const email = row[8] || ""');
    
    console.log('\n✅ 6. DADOS DOS ALUNOS ESPERADOS:');
    alunosEsperados.forEach((aluno, index) => {
      console.log(`\nAluno ${index + 1}:`);
      console.log(`Nome: ${aluno.nome}`);
      console.log(`CPF: ${aluno.cpf}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
verificarEstruturaDadosPessoais();