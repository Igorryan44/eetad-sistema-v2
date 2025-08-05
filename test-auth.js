// Script de teste para verificar autenticação
// Execute no console do navegador

console.log('=== TESTE DE AUTENTICAÇÃO ===');

// Verificar se o localStorage tem os dados
const users = localStorage.getItem('eetad_secretary_users');
console.log('Usuários no localStorage:', users);

if (users) {
  const parsedUsers = JSON.parse(users);
  console.log('Usuários parseados:', parsedUsers);
  
  // Verificar o hash da senha "admin1"
  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  const testHash = hashPassword('admin1');
  console.log('Hash da senha "admin1":', testHash);
  
  const adminUser = parsedUsers.find(u => u.username === 'Admin');
  if (adminUser) {
    console.log('Usuário Admin encontrado:', adminUser);
    console.log('Hash armazenado:', adminUser.passwordHash);
    console.log('Hash calculado:', testHash);
    console.log('Hashes coincidem?', adminUser.passwordHash === testHash);
  } else {
    console.log('Usuário Admin NÃO encontrado!');
  }
} else {
  console.log('Nenhum usuário encontrado no localStorage');
}

// Limpar localStorage para forçar recriação
console.log('\n=== LIMPANDO LOCALSTORAGE ===');
localStorage.removeItem('eetad_secretary_users');
localStorage.removeItem('eetad_secretary_session');
console.log('localStorage limpo. Recarregue a página para recriar o usuário padrão.');