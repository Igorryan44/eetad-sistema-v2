// Teste de Login com Supabase Funcionando
console.log('🧪 Testando Login com Supabase...\n');

async function testSupabaseLogin() {
  try {
    console.log('1. Testando listagem de usuários...');
    const listResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({ action: 'list' })
    });

    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ Listagem de usuários:', listResult);
    } else {
      console.log('❌ Erro na listagem:', listResponse.status, listResponse.statusText);
    }

    console.log('\n2. Testando login do Admin...');
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

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Resultado do login:', loginResult);
      
      if (loginResult.success) {
        console.log('🎉 LOGIN FUNCIONANDO COM SUPABASE!');
        console.log('👤 Usuário logado:', loginResult.user?.username);
      } else {
        console.log('❌ Login falhou:', loginResult.message);
      }
    } else {
      console.log('❌ Erro no login:', loginResponse.status, loginResponse.statusText);
    }

    console.log('\n3. Testando configuração de cabeçalho...');
    const setupResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
      },
      body: JSON.stringify({ action: 'setup-headers' })
    });

    if (setupResponse.ok) {
      const setupResult = await setupResponse.json();
      console.log('✅ Configuração de cabeçalho:', setupResult);
    } else {
      console.log('❌ Erro na configuração:', setupResponse.status, setupResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testSupabaseLogin();