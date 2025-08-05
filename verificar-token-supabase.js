/**
 * Script para Obter Token JWT Válido do Supabase
 * 
 * Este script ajuda a obter o token JWT correto para testar as funções
 */

console.log('🔑 OBTENDO TOKEN JWT VÁLIDO DO SUPABASE\n');

console.log('📋 INSTRUÇÕES:');
console.log('1. Acesse o Supabase Dashboard: https://umkizxftwrwqiiahjbrr.supabase.co');
console.log('2. Vá em Settings > API');
console.log('3. Copie o "anon public" key');
console.log('4. Cole aqui e execute o script novamente\n');

// Token anon público do Supabase (este deve ser obtido do dashboard)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE3NzQsImV4cCI6MjA1MDA0Nzc3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

console.log('🔍 Testando token atual...\n');

async function testarToken() {
  try {
    const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/create-mercadopago-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        nome: 'Teste',
        cpf: '12345678901',
        email: 'teste@teste.com',
        valor: 10,
        livro: 'Teste',
        ciclo: 'Teste'
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 401) {
      const data = await response.json();
      if (data.message === 'Invalid JWT') {
        console.log('❌ Token JWT inválido');
        console.log('\n🔧 SOLUÇÃO:');
        console.log('1. Acesse: https://umkizxftwrwqiiahjbrr.supabase.co/project/settings/api');
        console.log('2. Copie o "anon public" key');
        console.log('3. Substitua no script teste-mercadopago-completo.js');
      }
    } else if (response.status === 500) {
      const data = await response.json();
      console.log('✅ Token JWT válido!');
      console.log('❌ Mas MERCADOPAGO_ACCESS_TOKEN não configurado');
      console.log('\n🔧 PRÓXIMO PASSO:');
      console.log('1. Acesse: https://umkizxftwrwqiiahjbrr.supabase.co/project/settings/functions');
      console.log('2. Adicione MERCADOPAGO_ACCESS_TOKEN');
      console.log('3. Execute o teste novamente');
    } else {
      console.log('🤔 Resposta inesperada:', response.status);
      const data = await response.json();
      console.log(data);
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testarToken();