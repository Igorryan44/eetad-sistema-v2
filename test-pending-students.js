import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPendingStudentsFlow() {
  console.log('🧪 Testando fluxo completo de alunos pendentes...');
  console.log('📋 Nova funcionalidade: Coluna Status na aba "dados pessoais"');
  console.log('🔄 Fluxo: Pendente → Buscar → Efetivar → Matriculado');
  
  try {
    // 1. Testar busca de alunos pendentes
    console.log('\n1️⃣ Testando função get-pending-students...');
    const { data: pendingData, error: pendingError } = await supabase.functions.invoke('get-pending-students', {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (pendingError) {
      console.error('❌ Erro ao buscar alunos pendentes:', pendingError);
      return;
    }

    console.log('✅ Resposta da busca:', pendingData);
    console.log(`📊 Total de alunos com status "Pendente": ${pendingData?.students?.length || 0}`);
    
    if (pendingData?.students?.length > 0) {
      console.log('\n📋 Detalhes dos alunos pendentes:');
      pendingData.students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.nome} (CPF: ${student.cpf}) - Status: ${student.status || 'N/A'}`);
      });

      // 2. Testar efetivação de matrícula
      console.log('\n2️⃣ Testando efetivação de matrícula...');
      const firstStudent = pendingData.students[0];
      
      const enrollmentData = {
        cpf: firstStudent.cpf,
        ciclo: 'Ciclo Básico',
        subnucleo: 'Subnúcleo Central',
        status: 'Ativo',
        observacao: 'Matrícula efetivada via teste automático',
        dataEvento: new Date().toLocaleDateString('pt-BR')
      };

      console.log('📝 Dados para efetivação:', enrollmentData);

      const { data: enrollmentResult, error: enrollmentError } = await supabase.functions.invoke('finalize-student-enrollment', {
        body: enrollmentData,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (enrollmentError) {
        console.error('❌ Erro ao efetivar matrícula:', enrollmentError);
      } else {
        console.log('✅ Matrícula efetivada com sucesso!');
        console.log('📄 Resultado:', enrollmentResult);
        
        // 3. Verificar se o status foi atualizado
        console.log('\n3️⃣ Verificando atualização do status...');
        const { data: updatedData, error: updateError } = await supabase.functions.invoke('get-pending-students', {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!updateError) {
          const remainingPending = updatedData?.students?.length || 0;
          console.log(`📊 Alunos pendentes restantes: ${remainingPending}`);
          
          if (remainingPending < pendingData.students.length) {
            console.log('✅ Status atualizado corretamente! Aluno removido da lista de pendentes.');
          } else {
            console.log('⚠️ Status pode não ter sido atualizado. Verificar manualmente.');
          }
        }
      }
    } else {
      console.log('ℹ️ Nenhum aluno com status "Pendente" encontrado.');
      console.log('💡 Para testar, adicione um aluno na aba "dados pessoais" com Status = "Pendente"');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testPendingStudentsFlow();