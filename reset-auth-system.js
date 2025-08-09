// Script para resetar completamente o sistema de autenticação
// Execute este script no console do navegador

console.log('🔄 RESETANDO SISTEMA DE AUTENTICAÇÃO');
console.log('=====================================');

// 1. Limpar todas as chaves relacionadas à autenticação
const keysToRemove = [
    'secretary-users',
    'eetad_secretary_session',
    'supabase.auth.token',
    'sb-umkizxftwrwqiiahjbrr-auth-token'
];

console.log('🗑️ Limpando localStorage...');
keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`   ✅ Removido: ${key}`);
    }
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

// 3. Criar usuário Admin padrão
console.log('👤 Criando usuário Admin...');
const defaultUser = {
    id: '1',
    username: 'Admin',
    email: 'admin@eetad.com',
    fullName: 'Administrador',
    passwordHash: hashPassword('admin1'),
    createdAt: new Date().toISOString(),
    status: 'ATIVO'
};

const userList = [defaultUser];
localStorage.setItem('secretary-users', JSON.stringify(userList));

console.log('✅ Usuário Admin criado com sucesso!');
console.log('📝 Credenciais:');
console.log('   Usuário: Admin');
console.log('   Senha: admin1');
console.log('   Hash: ' + defaultUser.passwordHash);

// 4. Verificar se foi criado corretamente
const savedUsers = JSON.parse(localStorage.getItem('secretary-users'));
console.log('🔍 Verificação:');
console.log('   Usuários salvos:', savedUsers.length);
savedUsers.forEach(user => {
    console.log(`   - ${user.username} (${user.email})`);
});

// 5. Testar login
console.log('🧪 Testando login...');
const testUsername = 'Admin';
const testPassword = 'admin1';
const testHash = hashPassword(testPassword);

const foundUser = savedUsers.find(u => u.username === testUsername);
if (foundUser && foundUser.passwordHash === testHash) {
    console.log('✅ TESTE DE LOGIN: SUCESSO!');
} else {
    console.log('❌ TESTE DE LOGIN: FALHOU!');
    console.log('   Hash esperado:', foundUser?.passwordHash);
    console.log('   Hash gerado:', testHash);
}

console.log('🎯 RESET COMPLETO!');
console.log('Agora tente fazer login com: Admin / admin1');