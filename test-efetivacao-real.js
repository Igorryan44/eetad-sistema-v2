import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEfetivacaoReal() {
  console.log('🎯 TESTE REAL - Efetivando matrícula de aluno pendente\n');
  
  try {
    // 1. Buscar alunos pendentes
    console.log('1️⃣ Buscando alunos pendentes...');
    
    const { data: pendingData, error: pendingError } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (pendingError) {
      console.log('❌ Erro ao buscar alunos pendentes:', pendingError);
      return;
    }
    
    const students = pendingData?.pendingEnrollments || [];
    if (students.length === 0) {
      console.log('⚠️ Nenhum aluno pendente encontrado');
      return;
    }
    
    const student = students[0]; // Pegar o primeiro aluno
    console.log('👤 Aluno selecionado:', student.nome, '- CPF:', student.cpf);
    
    // 2. Verificar matrículas antes
    console.log('\n2️⃣ Verificando matrículas antes da efetivação...');
    
    const { data: beforeData, error: beforeError } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    const beforeCount = Array.isArray(beforeData) ? beforeData.length : 0;
    console.log('📊 Matrículas antes:', beforeCount);
    
    // 3. Efetivar a matrícula
    console.log('\n3️⃣ Efetivando matrícula...');
    
    const enrollmentData = {
      cpf: student.cpf,
      rowIndex: student.rowIndex,
      ciclo: 'Ciclo 2025',
      subnucleo: 'Subnúcleo Teste',
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Efetivado',
      observacao: 'Matrícula efetivada via teste - ' + new Date().toLocaleString()
    };
    
    console.log('📝 Dados da efetivação:', enrollmentData);
    
    const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-enrollment', {
      body: enrollmentData,
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (finalizeError) {
      console.log('❌ Erro ao efetivar matrícula:', finalizeError);
      return;
    }
    
    console.log('✅ Resposta da efetivação:', finalizeData);
    
    // 4. Aguardar e verificar se a matrícula apareceu
    console.log('\n4️⃣ Aguardando 5 segundos e verificando matrículas...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const { data: afterData, error: afterError } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (afterError) {
      console.log('❌ Erro ao buscar matrículas depois:', afterError);
    } else {
      const afterCount = Array.isArray(afterData) ? afterData.length : 0;
      console.log('📊 Matrículas depois:', afterCount);
      
      if (afterCount > beforeCount) {
        console.log('🎉 SUCESSO! Nova matrícula foi adicionada');
        
        // Procurar nossa matrícula específica
        if (Array.isArray(afterData)) {
          const ourEnrollment = afterData.find(enrollment => enrollment.cpf === student.cpf);
          if (ourEnrollment) {
            console.log('🎯 Nossa matrícula encontrada:', ourEnrollment);
          } else {
            console.log('⚠️ Matrícula adicionada, mas não encontramos a nossa pelo CPF');
          }
        }
      } else {
        console.log('❌ PROBLEMA! Nenhuma nova matrícula foi adicionada');
      }
    }
    
    // 5. Verificar se o aluno ainda está na lista de pendentes
    console.log('\n5️⃣ Verificando se o aluno ainda está pendente...');
    
    const { data: pendingAfterData, error: pendingAfterError } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (pendingAfterError) {
      console.log('❌ Erro ao buscar alunos pendentes depois:', pendingAfterError);
    } else {
      const studentsAfter = pendingAfterData?.pendingEnrollments || [];
      const stillPending = studentsAfter.find(s => s.cpf === student.cpf);
      
      if (stillPending) {
        console.log('⚠️ Aluno ainda está na lista de pendentes');
      } else {
        console.log('✅ Aluno foi removido da lista de pendentes');
      }
      
      console.log('📊 Alunos pendentes antes:', students.length);
      console.log('📊 Alunos pendentes depois:', studentsAfter.length);
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testEfetivacaoReal();