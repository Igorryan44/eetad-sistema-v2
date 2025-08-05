// Script de debug para o problema de login
console.log('=== DEBUG LOGIN EETAD ===');

// Função de hash idêntica à do authService
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Testar o hash da senha "admin1"
const testPassword = 'admin1';
const expectedHash = hashPassword(testPassword);
console.log('Hash esperado para "admin1":', expectedHash);

// Verificar localStorage
const storageKey = 'eetad_secretary_users';
const usersData = localStorage.getItem(storageKey);

if (!usersData) {
  console.log('❌ Nenhum usuário encontrado no localStorage');
  console.log('Executando: localStorage.clear() para forçar recriação...');
  localStorage.clear();
  location.reload();
} else {
  console.log('✅ Dados encontrados no localStorage');
  
  try {
    const users = JSON.parse(usersData);
    console.log('Usuários encontrados:', users.length);
    
    users.forEach((user, index) => {
      console.log(`\n--- Usuário ${index + 1} ---`);
      console.log('Username:', user.username);
      console.log('Hash armazenado:', user.passwordHash);
      console.log('Hash esperado:', expectedHash);
      console.log('Hashes coincidem?', user.passwordHash === expectedHash);
      
      if (user.username === 'Admin') {
        console.log('\n🔍 TESTE DE LOGIN PARA ADMIN:');
        console.log('Username correto: Admin');
        console.log('Password testada: admin1');
        console.log('Hash calculado:', expectedHash);
        console.log('Hash no storage:', user.passwordHash);
        console.log('Match?', user.passwordHash === expectedHash);
        
        if (user.passwordHash !== expectedHash) {
          console.log('❌ PROBLEMA ENCONTRADO: Hashes não coincidem!');
          console.log('Recriando usuário com hash correto...');
          
          // Recriar usuário com hash correto
          user.passwordHash = expectedHash;
          localStorage.setItem(storageKey, JSON.stringify(users));
          console.log('✅ Usuário Admin atualizado com hash correto');
          console.log('Tente fazer login novamente');
        } else {
          console.log('✅ Hash está correto, problema pode ser em outro lugar');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao parsear dados:', error);
    console.log('Limpando localStorage e recarregando...');
    localStorage.clear();
    location.reload();
  }
}

console.log('\n=== FIM DEBUG ===');