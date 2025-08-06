import fetch from 'node-fetch';

// Dados dos alunos fornecidos pelo usuário
const alunosEsperados = [
  {
    nome: "Simião Alves da Costa Junior",
    cpf: "61767735120",
    email: "simacjr@hotmail.com",
    telefone: "5563985112006"
  },
  {
    nome: "Bruno Alexandre Barros dos Santos", 
    cpf: "003.807.533-40",
    email: "babs.bruno@gmail.com",
    telefone: "63992261578"
  }
];

async function diagnosticarMatriculasPendentes() {
  console.log('🔍 DIAGNÓSTICO: Por que os alunos não aparecem como matrículas pendentes?');
  console.log('================================================================================');
  
  try {
    // 1. Testar função get-pending-enrollments
    console.log('\n📋 1. Testando função get-pending-enrollments...');
    const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-pending-enrollments', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });

    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const pendingStudents = await response.json();
      console.log(`✅ Resposta recebida: ${pendingStudents.length} alunos pendentes encontrados`);
      
      if (pendingStudents.length > 0) {
        console.log('\n📊 Alunos pendentes retornados pela função:');
        pendingStudents.forEach((student, index) => {
          console.log(`${index + 1}. Nome: ${student.nome}`);
          console.log(`   CPF: ${student.cpf}`);
          console.log(`   Email: ${student.email}`);
          console.log(`   Telefone: ${student.telefone}`);
          console.log('   ---');
        });
        
        // 2. Verificar se os alunos esperados estão na lista
        console.log('\n🔍 2. Verificando se os alunos esperados estão na lista...');
        alunosEsperados.forEach((alunoEsperado, index) => {
          console.log(`\n🎯 Verificando aluno ${index + 1}: ${alunoEsperado.nome}`);
          
          // Normalizar CPF para comparação
          const cpfEsperado = alunoEsperado.cpf.replace(/[.-]/g, '');
          
          const encontrado = pendingStudents.find(student => {
            const cpfStudent = student.cpf.replace(/[.-]/g, '');
            return cpfStudent === cpfEsperado || student.nome.toLowerCase().includes(alunoEsperado.nome.toLowerCase());
          });
          
          if (encontrado) {
            console.log(`   ✅ ENCONTRADO na lista de pendentes!`);
            console.log(`   📋 Dados retornados:`);
            console.log(`      Nome: ${encontrado.nome}`);
            console.log(`      CPF: ${encontrado.cpf}`);
            console.log(`      Email: ${encontrado.email}`);
          } else {
            console.log(`   ❌ NÃO ENCONTRADO na lista de pendentes`);
            console.log(`   🔍 Possíveis causas:`);
            console.log(`      - CPF já existe na aba "matriculas"`);
            console.log(`      - Dados não estão na aba "dados pessoais"`);
            console.log(`      - Problema nos índices das colunas`);
            console.log(`      - Credenciais do Google Sheets não configuradas`);
          }
        });
        
      } else {
        console.log('\n⚠️ Nenhum aluno pendente foi retornado pela função');
        console.log('\n🔍 Possíveis causas:');
        console.log('   1. Credenciais do Google Sheets não configuradas no Supabase');
        console.log('   2. Todos os alunos já estão matriculados (existem na aba "matriculas")');
        console.log('   3. Dados não estão na aba "dados pessoais" ou estão em formato incorreto');
        console.log('   4. Problema de permissões na planilha Google Sheets');
        console.log('   5. ID da planilha incorreto');
      }
      
    } else {
      console.log(`❌ Erro na requisição: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Detalhes do erro: ${errorText}`);
    }
    
    // 3. Verificar estrutura esperada
    console.log('\n📋 3. Estrutura CORRIGIDA na aba "dados pessoais":');
    console.log('   Índice 4 (Coluna E): Nome');
    console.log('   Índice 6 (Coluna G): CPF');
    console.log('   Índice 7 (Coluna H): Telefone');
    console.log('   Índice 8 (Coluna I): Email');
    
    console.log('\n📋 4. Dados fornecidos pelo usuário:');
    alunosEsperados.forEach((aluno, index) => {
      console.log(`\n   Aluno ${index + 1}:`);
      console.log(`   Nome: ${aluno.nome}`);
      console.log(`   CPF: ${aluno.cpf}`);
      console.log(`   Email: ${aluno.email}`);
      console.log(`   Telefone: ${aluno.telefone}`);
    });
    
    console.log('\n🎯 5. Próximos passos recomendados:');
    console.log('   1. Verificar se as credenciais do Google Sheets estão configuradas no Supabase');
    console.log('   2. Confirmar se os dados estão na aba "dados pessoais" da planilha');
    console.log('   3. Verificar se os CPFs não estão já na aba "matriculas"');
    console.log('   4. Testar acesso direto à planilha Google Sheets');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarMatriculasPendentes();