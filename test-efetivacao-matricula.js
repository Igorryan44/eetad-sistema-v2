import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://umkizxftwrwqiiahbjrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEfetivacaoMatricula() {
  console.log('🎯 TESTE: Efetivação de Matrícula\n');
  
  try {
    // 1. Buscar alunos pendentes
    console.log('1️⃣ Buscando alunos pendentes...');
    const { data: pendingData, error: pendingError } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    
    if (pendingError) {
      console.log('❌ Erro ao buscar alunos pendentes:', pendingError);
      return;
    }
    
    if (!Array.isArray(pendingData) || pendingData.length === 0) {
      console.log('⚠️ Nenhum aluno pendente encontrado');
      console.log('📊 Dados retornados:', pendingData);
      return;
    }
    
    console.log(`✅ Encontrados ${pendingData.length} alunos pendentes`);
    
    // Mostrar primeiro aluno
    const student = pendingData[0];
    console.log('👤 Primeiro aluno pendente:');
    console.log('   Nome:', student.nome);
    console.log('   CPF:', student.cpf);
    console.log('   Núcleo:', student.nucleo);
    console.log('   Row Index:', student.rowIndex);
    
    // 2. Contar matrículas antes
    console.log('\n2️⃣ Contando matrículas antes da efetivação...');
    const { data: beforeData, error: beforeError } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    
    const beforeCount = Array.isArray(beforeData) ? beforeData.length : 0;
    console.log(`📊 Matrículas antes: ${beforeCount}`);
    
    // 3. Efetivar matrícula
    console.log('\n3️⃣ Efetivando matrícula...');
    
    const enrollmentData = {
      cpf: student.cpf,
      ciclo: 'Ciclo 1',
      subnucleo: 'Subnúcleo A',
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Matriculado',
      observacao: 'Teste de efetivação via script',
      rowIndex: student.rowIndex
    };
    
    console.log('📝 Dados da matrícula:', enrollmentData);
    
    const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-enrollment', {
      headers: {
        Authorization: `Bearer ${supabaseKey}`
      },
      body: enrollmentData
    });
    
    if (finalizeError) {
      console.log('❌ Erro ao efetivar matrícula:', finalizeError);
      return;
    }
    
    console.log('✅ Resposta da efetivação:', finalizeData);
    
    // 4. Aguardar um pouco e verificar se a matrícula foi adicionada
    console.log('\n4️⃣ Aguardando 3 segundos e verificando resultado...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Contar matrículas depois
    const { data: afterData, error: afterError } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    
    const afterCount = Array.isArray(afterData) ? afterData.length : 0;
    console.log(`📊 Matrículas depois: ${afterCount}`);
    
    if (afterCount > beforeCount) {
      console.log('🎉 SUCESSO! Nova matrícula foi adicionada');
      
      // Procurar a matrícula específica
      const newEnrollment = afterData.find(e => e.cpf === student.cpf);
      if (newEnrollment) {
        console.log('✅ Matrícula encontrada:');
        console.log('   Nome:', newEnrollment.nome);
        console.log('   CPF:', newEnrollment.cpf);
        console.log('   Ciclo:', newEnrollment.ciclo);
        console.log('   Status:', newEnrollment.status);
      }
    } else {
      console.log('❌ FALHA! Nenhuma nova matrícula foi adicionada');
    }
    
    // 5. Verificar se o aluno ainda aparece como pendente
    console.log('\n5️⃣ Verificando se aluno ainda aparece como pendente...');
    const { data: newPendingData, error: newPendingError } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    
    if (newPendingError) {
      console.log('❌ Erro ao buscar alunos pendentes novamente:', newPendingError);
    } else {
      const stillPending = newPendingData.find(p => p.cpf === student.cpf);
      if (stillPending) {
        console.log('❌ PROBLEMA! Aluno ainda aparece como pendente');
        console.log('   Status na aba dados pessoais:', stillPending.status);
      } else {
        console.log('✅ Aluno não aparece mais como pendente');
      }
      
      console.log(`📊 Total de pendentes agora: ${newPendingData.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testEfetivacaoMatricula();