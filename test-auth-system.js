/**
 * Script para testar o sistema de autenticação
 * Execute no console do navegador na página /secretaria
 */

console.log('🔐 TESTANDO SISTEMA DE AUTENTICAÇÃO');
console.log('=====================================');
console.log('');

// Verificar se há dados no localStorage
const users = localStorage.getItem('eetad_secretary_users');
const session = localStorage.getItem('eetad_secretary_session');

console.log('📊 DADOS ATUAIS:');
console.log('Usuários no localStorage:', users ? JSON.parse(users).length : 0);
console.log('Sessão ativa:', session ? 'Sim' : 'Não');
console.log('');

if (users) {
  const userList = JSON.parse(users);
  console.log('👥 USUÁRIOS CADASTRADOS:');
  userList.forEach(user => {
    console.log(`- ${user.username} (${user.email})`);
  });
  console.log('');
}

console.log('🔄 LIMPANDO DADOS PARA TESTE LIMPO...');
localStorage.removeItem('eetad_secretary_users');
localStorage.removeItem('eetad_secretary_session');

console.log('✅ Dados limpos!');
console.log('');
console.log('📝 INSTRUÇÕES:');
console.log('1. Recarregue a página (F5)');
console.log('2. Tente fazer login com:');
console.log('   👤 Usuário: Admin');
console.log('   🔑 Senha: admin1');
console.log('');
console.log('💡 O sistema criará automaticamente o usuário padrão se não existir.');

// Recarregar automaticamente após 2 segundos
setTimeout(() => {
  console.log('🔄 Recarregando página...');
  window.location.reload();
}, 2000);