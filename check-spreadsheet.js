// Script simples para verificar a planilha
console.log('🔍 Verificando planilha via Supabase...\n');

async function checkViaSupabase() {
  try {
    // Testar todas as funções para ver qual está funcionando
    const functions = [
      'manage-secretary-users',
      'get-pending-enrollments', 
      'get-enrollments'
    ];

    for (const func of functions) {
      console.log(`\n📋 Testando função: ${func}`);
      
      try {
        let response;
        
        if (func === 'manage-secretary-users') {
          // Testar listagem de usuários
          response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/${func}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
            },
            body: JSON.stringify({ action: 'list' })
          });
        } else {
          // Testar outras funções
          response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/${func}`, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
            }
          });
        }

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

    // Agora vamos tentar criar um usuário simples
    console.log('\n\n👤 Tentando criar usuário simples...');
    
    const createResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({
        action: 'create',
        userData: {
          username: 'test123',
          email: 'test@example.com',
          fullName: 'Teste User',
          password: 'test12'
        }
      })
    });

    console.log(`Status criação: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Usuário criado:', JSON.stringify(createResult, null, 2));
    } else {
      const createError = await createResponse.text();
      console.log('❌ Erro na criação:', createError);
      
      // Vamos ver o erro detalhado
      try {
        const errorObj = JSON.parse(createError);
        console.log('📋 Erro detalhado:', errorObj.error);
      } catch (e) {
        console.log('📋 Erro bruto:', createError);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkViaSupabase();