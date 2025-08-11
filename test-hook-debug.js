// Script para testar o hook usePendingStudents
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahbjrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPendingStudentsService() {
  console.log('🧪 Testando serviço de alunos pendentes...');
  
  try {
    // Testar função get-pending-enrollments
    console.log('📞 Chamando função get-pending-enrollments...');
    const response = await supabase.functions.invoke('get-pending-enrollments', {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Dados da resposta:', response.data);
    console.log('❌ Erro da resposta:', response.error);
    
    if (response.data) {
      const students = response.data.pendingEnrollments || [];
      console.log(`✅ ${students.length} alunos pendentes encontrados`);
      
      students.forEach((student, index) => {
        console.log(`👤 Aluno ${index + 1}:`, {
          nome: student.nome,
          cpf: student.cpf,
          nucleo: student.nucleo,
          email: student.email
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPendingStudentsService();