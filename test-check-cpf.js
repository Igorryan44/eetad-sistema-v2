// Script para testar a função check-student-cpf do Supabase
async function testCheckStudentCPF() {
  try {
    console.log('🔍 Testando função check-student-cpf...');
    
    const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/check-student-cpf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({
        cpf: '12345678901' // CPF de teste
      })
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status text:', response.statusText);
    
    const data = await response.text();
    console.log('📋 Resposta completa:', data);
    
    if (response.status === 401) {
      console.log('❌ Erro 401: Problema de autenticação');
      console.log('🔧 Possíveis causas:');
      console.log('   - Credenciais do Google não configuradas');
      console.log('   - Service Account sem acesso à planilha');
      console.log('   - Chave privada inválida');
    } else if (response.status === 500) {
      console.log('❌ Erro 500: Erro interno do servidor');
      try {
        const errorData = JSON.parse(data);
        console.log('📋 Detalhes do erro:', errorData);
      } catch (e) {
        console.log('📋 Erro não é JSON:', data);
      }
    } else {
      console.log('✅ Resposta recebida com sucesso');
      try {
        const jsonData = JSON.parse(data);
        console.log('📋 Dados:', jsonData);
      } catch (e) {
        console.log('📋 Resposta não é JSON:', data);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error.message);
  }
}

// Executar teste
testCheckStudentCPF();