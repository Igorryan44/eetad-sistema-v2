import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://umkizxftwrwqiiahjbrr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testMatriculasSheet() {
  console.log('🧪 Testando acesso direto à aba "matriculas"...\n');

  // Teste direto com Google Sheets API
  const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
  const SHEET_NAME = 'matriculas';

  try {
    // Usar a função debug-sheets para verificar a estrutura
    console.log('1️⃣ Verificando estrutura da planilha...');
    
    const debugResponse = await supabase.functions.invoke('debug-sheets', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });

    if (debugResponse.error) {
      console.log('❌ Erro no debug:', debugResponse.error.message);
    } else {
      console.log('✅ Debug da planilha:', debugResponse.data);
    }

    // Testar get-enrollments
    console.log('\n2️⃣ Testando get-enrollments...');
    
    const enrollmentsResponse = await supabase.functions.invoke('get-enrollments', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });

    if (enrollmentsResponse.error) {
      console.log('❌ Erro ao buscar matrículas:', enrollmentsResponse.error.message);
    } else {
      const enrollments = enrollmentsResponse.data;
      console.log(`✅ Matrículas encontradas: ${Array.isArray(enrollments) ? enrollments.length : 'Não é array'}`);
      
      if (Array.isArray(enrollments) && enrollments.length > 0) {
        console.log('📋 Primeira matrícula:', enrollments[0]);
      } else {
        console.log('⚠️ Nenhuma matrícula encontrada ou formato incorreto');
        console.log('📄 Dados recebidos:', enrollments);
      }
    }

    // Testar adição manual de uma matrícula
    console.log('\n3️⃣ Testando adição de matrícula de teste...');
    
    const testEnrollment = {
      cpf: '99999999999',
      ciclo: 'Teste Ciclo',
      subnucleo: 'Teste Subnúcleo',
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Teste',
      observacao: 'Matrícula de teste automático',
      rowIndex: 999 // Usar um rowIndex fictício
    };

    const addResponse = await supabase.functions.invoke('finalize-enrollment', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: testEnrollment
    });

    if (addResponse.error) {
      console.log('❌ Erro ao adicionar matrícula de teste:', addResponse.error.message);
    } else {
      console.log('✅ Matrícula de teste adicionada:', addResponse.data);
      
      // Aguardar e verificar se aparece na lista
      console.log('\n4️⃣ Aguardando e verificando se a matrícula aparece...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newEnrollmentsResponse = await supabase.functions.invoke('get-enrollments', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        }
      });

      if (newEnrollmentsResponse.error) {
        console.log('❌ Erro ao verificar matrículas atualizadas:', newEnrollmentsResponse.error.message);
      } else {
        const newEnrollments = newEnrollmentsResponse.data;
        console.log(`📊 Matrículas após adição: ${Array.isArray(newEnrollments) ? newEnrollments.length : 'Não é array'}`);
        
        if (Array.isArray(newEnrollments)) {
          const testMatricula = newEnrollments.find(e => e.cpf === '99999999999');
          if (testMatricula) {
            console.log('✅ Matrícula de teste encontrada!');
            console.log('📋 Dados:', testMatricula);
          } else {
            console.log('❌ Matrícula de teste NÃO encontrada');
            console.log('🔍 CPFs encontrados:', newEnrollments.map(e => e.cpf).slice(0, 5));
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }

  console.log('\n🎯 Teste concluído!');
}

testMatriculasSheet();