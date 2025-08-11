import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSheetTabs() {
  console.log('📋 Verificando abas da planilha...');
  
  try {
    // Usar a função debug-sheets para ver a estrutura
    console.log('\n1️⃣ Testando função debug-sheets...');
    
    const { data, error } = await supabase.functions.invoke('debug-sheets', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (error) {
      console.log('❌ Erro na função debug-sheets:', error);
    } else {
      console.log('✅ Função debug-sheets executada com sucesso');
      console.log('📊 Dados retornados:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Erro no teste debug-sheets:', error.message);
  }
  
  try {
    // Testar acesso direto à aba "matriculas"
    console.log('\n2️⃣ Testando acesso direto à aba matriculas...');
    
    const { data, error } = await supabase.functions.invoke('get-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (error) {
      console.log('❌ Erro na função get-enrollments:', error);
    } else {
      console.log('✅ Função get-enrollments executada com sucesso');
      console.log('📊 Dados retornados:', data);
      console.log('📈 Quantidade de matrículas:', Array.isArray(data) ? data.length : 'Formato inválido');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste get-enrollments:', error.message);
  }
  
  try {
    // Testar acesso à aba "dados pessoais" para comparar
    console.log('\n3️⃣ Testando acesso à aba dados pessoais...');
    
    const { data, error } = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      }
    });
    
    if (error) {
      console.log('❌ Erro na função get-pending-enrollments:', error);
    } else {
      console.log('✅ Função get-pending-enrollments executada com sucesso');
      console.log('📊 Quantidade de alunos pendentes:', Array.isArray(data) ? data.length : 'Formato inválido');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste get-pending-enrollments:', error.message);
  }
}

testSheetTabs();