// Script para testar a busca de alunos pendentes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPendingStudents() {
  console.log('🔍 Testando busca de alunos pendentes...\n');
  
  try {
    console.log('📡 Chamando função get-pending-enrollments...');
    const response = await supabase.functions.invoke('get-pending-enrollments');
    
    console.log('📊 Resposta completa:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      console.error('❌ Erro na função:', response.error);
      return;
    }
    
    const students = response.data;
    console.log('\n👥 Dados dos alunos pendentes:');
    console.log('📈 Quantidade:', Array.isArray(students) ? students.length : 'Não é array');
    console.log('📋 Tipo dos dados:', typeof students);
    console.log('🔍 É array?', Array.isArray(students));
    
    if (Array.isArray(students)) {
      console.log('\n📝 Lista de alunos:');
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.nome} - CPF: ${student.cpf} - Email: ${student.email}`);
        console.log(`   ID: ${student.id}`);
        console.log(`   Dados completos:`, student);
        console.log('');
      });
      
      if (students.length === 0) {
        console.log('⚠️  Nenhum aluno pendente encontrado!');
        console.log('💡 Verifique se há dados na aba "usuarios" da planilha');
      }
    } else {
      console.log('❌ Os dados retornados não são um array:', students);
    }
    
  } catch (error) {
    console.error('💥 Erro ao testar:', error);
  }
}

// Executar o teste
testPendingStudents();