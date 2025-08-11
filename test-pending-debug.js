/**
 * 🧪 TESTE DEBUG - Verificar função get-pending-enrollments
 */

async function testPendingEnrollments() {
  console.log('🔍 TESTE: Verificando função get-pending-enrollments\n');
  
  try {
    const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-pending-enrollments', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs',
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta recebida:');
      console.log(JSON.stringify(data, null, 2));
      
      // Verificar estrutura dos dados
      if (data.pendingEnrollments) {
        console.log(`\n📋 Total de alunos pendentes: ${data.pendingEnrollments.length}`);
        
        if (data.pendingEnrollments.length > 0) {
          console.log('\n👥 Primeiros alunos:');
          data.pendingEnrollments.slice(0, 3).forEach((student, index) => {
            console.log(`${index + 1}. ${student.nome} (CPF: ${student.cpf})`);
          });
        }
      } else {
        console.log('⚠️ Propriedade pendingEnrollments não encontrada');
        console.log('📋 Estrutura da resposta:', Object.keys(data));
      }
      
    } else {
      console.log(`❌ Erro na requisição: ${response.status}`);
      const errorText = await response.text();
      console.log(`Detalhes: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testPendingEnrollments();