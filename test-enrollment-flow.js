import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://umkizxftwrwqiiahjbrr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const authHeaders = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
};

async function testEnrollmentFlow() {
  console.log('🧪 Testando fluxo completo de efetivação de matrícula...\n');

  // Passo 1: Buscar alunos pendentes
  console.log('1️⃣ Buscando alunos pendentes...');
  const pendingResponse = await supabase.functions.invoke('get-pending-enrollments', {
    headers: authHeaders
  });

  if (pendingResponse.error) {
    console.log('❌ Erro ao buscar pendentes:', pendingResponse.error.message);
    return;
  }

  const pendingStudents = pendingResponse.data?.pendingEnrollments || [];
  console.log(`✅ Encontrados ${pendingStudents.length} alunos pendentes`);

  if (pendingStudents.length === 0) {
    console.log('⚠️ Não há alunos pendentes para testar. Criando dados de teste...');
    
    // Usar dados de teste
    const testStudent = {
      cpf: '12345678901',
      nome: 'Teste Aluno',
      rowIndex: 999
    };

    console.log('📝 Testando com aluno simulado:', testStudent.nome);
    await testEnrollmentWithStudent(testStudent);
    return;
  }

  // Usar o primeiro aluno pendente
  const student = pendingStudents[0];
  console.log('📝 Testando com aluno real:', student.nome);
  await testEnrollmentWithStudent(student);
}

async function testEnrollmentWithStudent(student) {
  console.log('\n2️⃣ Efetivando matrícula...');
  
  // Dados do formulário de matrícula
  const enrollmentData = {
    cpf: student.cpf,
    ciclo: 'Ciclo 1',
    subnucleo: 'Subnúcleo A',
    data: new Date().toLocaleDateString('pt-BR'),
    status: 'Cursando',
    observacao: 'Teste de efetivação automática',
    rowIndex: student.rowIndex
  };

  console.log('📋 Dados da matrícula:', enrollmentData);

  // Chamar função de efetivação
  const enrollmentResponse = await supabase.functions.invoke('finalize-enrollment', {
    headers: authHeaders,
    body: enrollmentData
  });

  if (enrollmentResponse.error) {
    console.log('❌ Erro ao efetivar matrícula:', enrollmentResponse.error.message);
    return;
  }

  console.log('✅ Matrícula efetivada com sucesso!');
  console.log('📄 Resposta:', enrollmentResponse.data);

  // Passo 3: Verificar se a matrícula aparece na lista
  console.log('\n3️⃣ Verificando se a matrícula foi adicionada...');
  
  // Aguardar um pouco para a planilha ser atualizada
  await new Promise(resolve => setTimeout(resolve, 2000));

  const enrollmentsResponse = await supabase.functions.invoke('get-enrollments', {
    headers: authHeaders
  });

  if (enrollmentsResponse.error) {
    console.log('❌ Erro ao buscar matrículas:', enrollmentsResponse.error.message);
    return;
  }

  const enrollments = enrollmentsResponse.data?.enrollments || enrollmentsResponse.data || [];
  console.log(`📊 Total de matrículas encontradas: ${enrollments.length}`);

  // Procurar pela matrícula recém-criada
  const newEnrollment = enrollments.find(e => e.cpf === student.cpf);
  
  if (newEnrollment) {
    console.log('✅ Matrícula encontrada na lista!');
    console.log('📋 Dados da matrícula:', {
      nome: newEnrollment.nome,
      cpf: newEnrollment.cpf,
      ciclo: newEnrollment.ciclo,
      status: newEnrollment.status
    });
  } else {
    console.log('❌ Matrícula NÃO encontrada na lista!');
    console.log('🔍 CPFs na lista:', enrollments.map(e => e.cpf).slice(0, 5));
  }

  // Passo 4: Verificar se o aluno foi removido dos pendentes
  console.log('\n4️⃣ Verificando se o aluno foi removido dos pendentes...');
  
  const newPendingResponse = await supabase.functions.invoke('get-pending-enrollments', {
    headers: authHeaders
  });

  if (newPendingResponse.error) {
    console.log('❌ Erro ao buscar pendentes atualizados:', newPendingResponse.error.message);
    return;
  }

  const newPendingStudents = newPendingResponse.data?.pendingEnrollments || [];
  const stillPending = newPendingStudents.find(s => s.cpf === student.cpf);

  if (stillPending) {
    console.log('❌ Aluno ainda está na lista de pendentes!');
  } else {
    console.log('✅ Aluno foi removido da lista de pendentes!');
  }

  console.log('\n🎯 Teste concluído!');
  console.log('📝 Resumo:');
  console.log(`   - Matrícula efetivada: ✅`);
  console.log(`   - Aparece na lista de matrículas: ${newEnrollment ? '✅' : '❌'}`);
  console.log(`   - Removido dos pendentes: ${!stillPending ? '✅' : '❌'}`);
}

testEnrollmentFlow().catch(console.error);