// Script para criar usuário Admin
console.log('👤 Criando usuário Admin...\n');

async function createAdmin() {
  try {
    console.log('📋 Criando usuário Admin...');
    
    const createResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({
        action: 'create',
        userData: {
          username: 'Admin',
          email: 'simacjr@hotmail.com',
          fullName: 'Administrador',
          password: 'admin1'
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
    }

    // Aguardar um pouco
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Listar usuários para verificar
    console.log('\n📋 Listando usuários...');
    
    const listResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({
        action: 'list'
      })
    });

    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ Usuários encontrados:', JSON.stringify(listResult, null, 2));
    } else {
      const listError = await listResponse.text();
      console.log('❌ Erro na listagem:', listError);
    }

    // Testar login com o Admin
    console.log('\n🔐 Testando login do Admin...');
    
    const loginResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({
        action: 'login',
        username: 'Admin',
        password: 'admin1'
      })
    });

    console.log(`Status login: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login realizado:', JSON.stringify(loginResult, null, 2));
      
      if (loginResult.success) {
        console.log('\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
        console.log('👤 Admin criado e login funcionando!');
      }
    } else {
      const loginError = await loginResponse.text();
      console.log('❌ Erro no login:', loginError);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createAdmin();