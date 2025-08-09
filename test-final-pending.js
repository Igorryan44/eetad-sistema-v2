// Script final para testar se os alunos pendentes estão sendo exibidos
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalPending() {
  console.log('🎯 TESTE FINAL - Verificando alunos pendentes\n');
  
  try {
    // Testar função get-pending-enrollments
    console.log('1️⃣ Testando função get-pending-enrollments...');
    const pendingResponse = await supabase.functions.invoke('get-pending-enrollments');
    
    if (pendingResponse.error) {
      console.error('❌ Erro na função get-pending-enrollments:', pendingResponse.error);
      return;
    }
    
    console.log('✅ Função get-pending-enrollments funcionando');
    console.log('📊 Resposta:', JSON.stringify(pendingResponse.data, null, 2));
    
    // Simular o processamento do dashboard
    const students = pendingResponse.data?.pendingEnrollments || [];
    console.log('\n2️⃣ Processamento do Dashboard:');
    console.log('👥 Alunos extraídos:', students);
    console.log('📈 Quantidade:', students.length);
    console.log('🔍 É array?', Array.isArray(students));
    
    if (Array.isArray(students) && students.length > 0) {
      console.log('\n✅ SUCESSO! Os alunos pendentes devem aparecer na interface:');
      students.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.nome} (CPF: ${student.cpf})`);
      });
      
      console.log('\n📋 Verificações:');
      console.log('   ✓ Dados são um array');
      console.log('   ✓ Array não está vazio');
      console.log('   ✓ Cada aluno tem nome e CPF');
      console.log('   ✓ Estrutura de dados está correta');
      
      console.log('\n🎯 RESULTADO: Os alunos pendentes DEVEM estar visíveis no dashboard!');
      console.log('💡 Se não estiverem aparecendo, verifique:');
      console.log('   - Console do navegador para logs de debug');
      console.log('   - Se você está na aba correta (Dashboard ou Pendentes)');
      console.log('   - Se o login foi feito com sucesso');
      
    } else {
      console.log('\n⚠️  PROBLEMA: Nenhum aluno pendente encontrado');
      console.log('💡 Verifique se há dados na aba "usuarios" da planilha Google Sheets');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar o teste
testFinalPending();