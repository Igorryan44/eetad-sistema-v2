import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDadosPessoais() {
  console.log('📋 Verificando dados na aba "dados pessoais"...');
  
  try {
    // Testar função get-pending-enrollments
    console.log('\n1️⃣ Testando get-pending-enrollments...');
    
    const { data, error } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (error) {
      console.log('❌ Erro na função get-pending-enrollments:', error);
    } else {
      console.log('✅ Função get-pending-enrollments executada com sucesso');
      console.log('📊 Tipo de dados retornados:', typeof data);
      console.log('📊 Dados retornados:', data);
      
      if (Array.isArray(data)) {
        console.log('📈 Quantidade de alunos pendentes:', data.length);
        if (data.length > 0) {
          console.log('👤 Primeiro aluno:', data[0]);
        }
      } else {
        console.log('⚠️ Dados não são um array');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testDadosPessoais();