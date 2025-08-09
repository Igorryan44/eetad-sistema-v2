// Script para debugar o problema de login
// Testando tanto localStorage quanto Supabase

console.log('🔍 TESTE DE LOGIN - DIAGNÓSTICO COMPLETO');
console.log('==========================================');

// 1. Verificar localStorage
console.log('\n1️⃣ VERIFICANDO LOCALSTORAGE:');
const STORAGE_KEY = 'secretary-users';
const users = localStorage.getItem(STORAGE_KEY);
const userList = users ? JSON.parse(users) : [];

console.log('📋 Usuários no localStorage:', userList.length);
userList.forEach((user, index) => {
  console.log(`   ${index + 1}. ${user.username} (${user.email}) - Hash: ${user.passwordHash}`);
});

// 2. Função de hash (mesma do authService)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// 3. Testar credenciais
console.log('\n2️⃣ TESTANDO CREDENCIAIS:');
const testCredentials = [
  { username: 'Admin', password: 'admin1' },
  { username: 'admin', password: 'admin1' },
  { username: 'Admin', password: 'Admin1' }
];

testCredentials.forEach(cred => {
  console.log(`\n🔐 Testando: ${cred.username} / ${cred.password}`);
  const inputHash = hashPassword(cred.password);
  console.log(`   Hash gerado: ${inputHash}`);
  
  const user = userList.find(u => u.username === cred.username);
  if (user) {
    console.log(`   Hash armazenado: ${user.passwordHash}`);
    console.log(`   ✅ Match: ${user.passwordHash === inputHash ? 'SIM' : 'NÃO'}`);
  } else {
    console.log(`   ❌ Usuário não encontrado`);
  }
});

// 4. Criar usuário Admin se não existir
if (userList.length === 0) {
  console.log('\n3️⃣ CRIANDO USUÁRIO ADMIN:');
  const defaultUser = {
    id: '1',
    username: 'Admin',
    email: 'admin@eetad.com',
    fullName: 'Administrador',
    passwordHash: hashPassword('admin1'),
    createdAt: new Date().toISOString()
  };
  
  userList.push(defaultUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userList));
  console.log('✅ Usuário Admin criado!');
  console.log('📝 Credenciais: Admin / admin1');
  console.log('🔐 Hash da senha: ' + defaultUser.passwordHash);
}

// 5. Testar função Supabase
console.log('\n4️⃣ TESTANDO SUPABASE:');
async function testSupabaseLogin() {
  try {
    const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users', {
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

    if (response.ok) {
      const result = await response.json();
      console.log('📡 Resposta Supabase:', result);
    } else {
      console.log('❌ Erro HTTP:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

testSupabaseLogin();

console.log('\n🎯 RESUMO DO DIAGNÓSTICO:');
console.log('- Verifique se o usuário Admin existe no localStorage');
console.log('- Teste as credenciais: Admin / admin1');
console.log('- Verifique se o hash da senha está correto');
console.log('- Teste a conexão com Supabase');