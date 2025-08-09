// Script para diagnosticar problema de login
console.log('🔍 Diagnosticando problema de login...\n');

async function testLoginIssue() {
  try {
    // 1. Verificar se há usuários cadastrados
    console.log('📋 Verificando usuários cadastrados...');
    
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
      console.log('✅ Usuários encontrados:', JSON.stringify(listResult, null, 2));
      
      if (listResult.success && listResult.users.length === 0) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO: Não há usuários cadastrados!');
        console.log('🔧 Vou tentar criar o usuário Admin...\n');
        
        // Tentar criar usuário Admin
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
              email: 'admin@eetad.com',
              fullName: 'Administrador',
              password: 'admin1'
            }
          })
        });

        console.log(`Status criação: ${createResponse.status} ${createResponse.statusText}`);
        
        if (createResponse.ok) {
          const createResult = await createResponse.json();
          console.log('✅ Usuário Admin criado:', JSON.stringify(createResult, null, 2));
        } else {
          const createError = await createResponse.text();
          console.log('❌ Erro na criação:', createError);
          
          // Se falhar, vamos verificar se é problema da planilha
          console.log('\n🔍 Verificando se é problema da planilha...');
          console.log('💡 Possíveis soluções:');
          console.log('   1. A aba "usuarios" não existe na planilha');
          console.log('   2. A planilha não tem permissões corretas');
          console.log('   3. As credenciais do Google Sheets estão incorretas');
        }
      }
    } else {
      const listError = await listResponse.text();
      console.log('❌ Erro ao listar usuários:', listError);
    }

    // 2. Testar login com credenciais comuns
    console.log('\n🔐 Testando credenciais comuns...');
    
    const commonCredentials = [
      { username: 'Admin', password: 'admin1' },
      { username: 'admin', password: 'admin1' },
      { username: 'Admin', password: 'admin123' },
      { username: 'admin', password: 'admin123' },
      { username: 'secretaria', password: 'secret' }
    ];

    for (const cred of commonCredentials) {
      console.log(`\n🔑 Testando: ${cred.username} / ${cred.password}`);
      
      const loginResponse = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({
          action: 'login',
          username: cred.username,
          password: cred.password
        })
      });

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        if (loginResult.success) {
          console.log('✅ LOGIN FUNCIONOU!', loginResult.user?.username);
          break;
        } else {
          console.log('❌ Falhou:', loginResult.error);
        }
      } else {
        console.log('❌ Erro HTTP:', loginResponse.status);
      }
    }

    // 3. Verificar se o localStorage tem dados
    console.log('\n💾 Verificando dados locais...');
    console.log('📝 Para verificar o localStorage, abra o DevTools no navegador e execute:');
    console.log('   console.log(localStorage.getItem("eetad_users"));');
    console.log('   console.log(localStorage.getItem("eetad_current_user"));');

    // 4. Sugestões de solução
    console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
    console.log('1. 🔧 Criar usuário Admin manualmente na planilha');
    console.log('2. 🔄 Verificar se a aba "usuarios" existe');
    console.log('3. 🔑 Verificar credenciais do Google Sheets');
    console.log('4. 📋 Usar dados do localStorage como fallback');
    console.log('5. 🆕 Criar conta nova através da interface');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testLoginIssue();