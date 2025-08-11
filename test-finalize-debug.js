import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalizeDebug() {
  console.log('🔍 Testando função finalize-enrollment em detalhes...');
  
  try {
    // 1. Primeiro, verificar quantas matrículas existem antes
    console.log('\n1️⃣ Verificando matrículas antes da efetivação...');
    
    const { data: beforeData, error: beforeError } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (beforeError) {
      console.log('❌ Erro ao buscar matrículas antes:', beforeError);
    } else {
      console.log('✅ Matrículas antes:', Array.isArray(beforeData) ? beforeData.length : 'Formato inválido');
    }
    
    // 2. Buscar um aluno pendente para efetivar
    console.log('\n2️⃣ Buscando alunos pendentes...');
    
    const { data: pendingData, error: pendingError } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (pendingError) {
      console.log('❌ Erro ao buscar alunos pendentes:', pendingError);
      return;
    }
    
    if (!Array.isArray(pendingData) || pendingData.length === 0) {
      console.log('⚠️ Nenhum aluno pendente encontrado');
      return;
    }
    
    const student = pendingData[0];
    console.log('👤 Aluno selecionado:', student.nome, '- CPF:', student.cpf);
    
    // 3. Efetivar a matrícula
    console.log('\n3️⃣ Efetivando matrícula...');
    
    const enrollmentData = {
      cpf: student.cpf,
      rowIndex: student.rowIndex,
      ciclo: 'Teste 2025',
      subnucleo: 'Teste Subnúcleo',
      data: new Date().toISOString().split('T')[0],
      status: 'Efetivado',
      observacao: 'Teste de efetivação - ' + new Date().toLocaleString()
    };
    
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
    
    console.log('✅ Matrícula efetivada:', finalizeData);
    
    // 4. Aguardar um pouco e verificar se a matrícula apareceu
    console.log('\n4️⃣ Aguardando 3 segundos e verificando matrículas...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: afterData, error: afterError } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (afterError) {
      console.log('❌ Erro ao buscar matrículas depois:', afterError);
    } else {
      console.log('✅ Matrículas depois:', Array.isArray(afterData) ? afterData.length : 'Formato inválido');
      
      if (Array.isArray(afterData) && afterData.length > 0) {
        console.log('📋 Primeira matrícula encontrada:', afterData[0]);
        
        // Verificar se nossa matrícula está lá
        const ourEnrollment = afterData.find(enrollment => enrollment.cpf === student.cpf);
        if (ourEnrollment) {
          console.log('🎯 Nossa matrícula encontrada:', ourEnrollment);
        } else {
          console.log('❌ Nossa matrícula NÃO encontrada');
        }
      } else {
        console.log('⚠️ Nenhuma matrícula encontrada após efetivação');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testFinalizeDebug();