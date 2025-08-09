// Debug das Funções Supabase
console.log('🔍 Debugando funções do Supabase...\n');

async function debugFunctions() {
  const actions = ['list', 'setup-headers', 'create'];
  
  for (const action of actions) {
    try {
      console.log(`\n📋 Testando ação: ${action}`);
      
      let body = { action };
      
      // Adicionar dados específicos para cada ação
      if (action === 'create') {
        body = {
          action: 'create',
          username: 'TestUser',
          email: 'test@test.com',
          password: 'test123'
        };
      }
      
      const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify(body)
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resposta:', JSON.stringify(result, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Erro:', errorText);
      }
      
    } catch (error) {
      console.error(`❌ Erro na ação ${action}:`, error.message);
    }
  }
  
  // Testar outras funções também
  console.log('\n\n🔍 Testando outras funções...');
  
  const otherFunctions = [
    'get-pending-enrollments',
    'get-enrollments'
  ];
  
  for (const func of otherFunctions) {
    try {
      console.log(`\n📋 Testando função: ${func}`);
      
      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/${func}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resposta:', JSON.stringify(result, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Erro:', errorText);
      }
      
    } catch (error) {
      console.error(`❌ Erro na função ${func}:`, error.message);
    }
  }
}

debugFunctions();