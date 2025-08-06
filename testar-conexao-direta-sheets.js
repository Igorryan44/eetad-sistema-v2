// Teste direto da conexão com Google Sheets
// Este script simula exatamente o que a função Supabase faz

console.log('🔍 TESTE DIRETO - CONEXÃO GOOGLE SHEETS');
console.log('=======================================');

// Configurações (mesmas da função Supabase)
const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
const SHEET_NAME = 'dados pessoais';

// Simular as credenciais (você precisa substituir pelos valores reais)
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'SEU_EMAIL_SERVICE_ACCOUNT_AQUI';
const GOOGLE_PRIVATE_KEY = 'SUA_CHAVE_PRIVADA_AQUI';

console.log('\n📋 CONFIGURAÇÕES:');
console.log(`Planilha ID: ${GOOGLE_SHEETS_SPREADSHEET_ID}`);
console.log(`Aba: ${SHEET_NAME}`);
console.log(`Service Account: ${GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
console.log(`Private Key: ${GOOGLE_PRIVATE_KEY ? 'Configurada' : 'NÃO CONFIGURADA'}`);

// Função para criar JWT (mesma lógica da função Supabase)
async function createJWT() {
    try {
        console.log('\n🔐 Criando JWT...');
        
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        console.log('   ✅ Header e Payload criados');
        console.log(`   📊 Payload: ${JSON.stringify(payload, null, 2)}`);
        
        // Verificar se as credenciais estão válidas
        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || GOOGLE_SERVICE_ACCOUNT_EMAIL === 'SEU_EMAIL_SERVICE_ACCOUNT_AQUI') {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL não configurado');
        }
        
        if (!GOOGLE_PRIVATE_KEY || GOOGLE_PRIVATE_KEY === 'SUA_CHAVE_PRIVADA_AQUI') {
            throw new Error('GOOGLE_PRIVATE_KEY não configurada');
        }
        
        console.log('   ⚠️ Este teste requer as credenciais reais configuradas');
        return null;
        
    } catch (error) {
        console.log(`   ❌ Erro ao criar JWT: ${error.message}`);
        return null;
    }
}

// Função para testar acesso à planilha
async function testarAcessoPlanilha() {
    console.log('\n📊 TESTANDO ACESSO À PLANILHA');
    console.log('=============================');
    
    try {
        // URL pública da planilha (para teste básico)
        const publicUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_SPREADSHEET_ID}/edit`;
        console.log(`URL da planilha: ${publicUrl}`);
        
        // Testar se a planilha existe (sem autenticação)
        const testResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}`, {
            method: 'GET'
        });
        
        console.log(`Status sem autenticação: ${testResponse.status}`);
        
        if (testResponse.status === 403) {
            console.log('   ✅ Planilha existe mas requer autenticação (esperado)');
        } else if (testResponse.status === 404) {
            console.log('   ❌ Planilha não encontrada - verifique o ID');
        } else {
            console.log(`   ⚠️ Status inesperado: ${testResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro ao testar acesso: ${error.message}`);
    }
}

// Função para verificar estrutura esperada
async function verificarEstrutura() {
    console.log('\n📋 ESTRUTURA ESPERADA DA PLANILHA');
    console.log('==================================');
    console.log('A função get-pending-enrollments espera:');
    console.log('');
    console.log('Colunas (índices):');
    console.log('0: Data Cadastro');
    console.log('1: Nome');
    console.log('2: RG');
    console.log('3: CPF');
    console.log('4: Telefone');
    console.log('5: Email');
    console.log('6: Sexo');
    console.log('7: Estado Civil');
    console.log('8: Data Nascimento');
    console.log('9: Cidade Nascimento');
    console.log('10: UF Nascimento');
    console.log('11: Nacionalidade');
    console.log('12: Escolaridade');
    console.log('13: Profissão');
    console.log('14: Cargo Igreja');
    console.log('15: Endereço Rua');
    console.log('16: CEP');
    console.log('17: Número');
    console.log('18: Complemento');
    console.log('19: Bairro');
    console.log('20: Cidade');
    console.log('21: UF');
    console.log('22: STATUS ← IMPORTANTE!');
    console.log('');
    console.log('⚠️ CRÍTICO: A coluna 22 (23ª coluna) deve conter "Pendente"');
}

// Função principal
async function executarTeste() {
    await createJWT();
    await testarAcessoPlanilha();
    await verificarEstrutura();
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('=====================');
    console.log('Se as credenciais estão configuradas no Supabase mas ainda não funciona:');
    console.log('');
    console.log('1. 📊 Verifique os logs no Supabase Dashboard:');
    console.log('   - Edge Functions > get-pending-enrollments > Logs');
    console.log('');
    console.log('2. 📋 Confirme a estrutura da planilha:');
    console.log('   - Aba "dados pessoais" existe?');
    console.log('   - Coluna 23 tem o campo "status"?');
    console.log('   - Existem registros com status "Pendente"?');
    console.log('');
    console.log('3. 🔐 Verifique permissões:');
    console.log('   - Service account compartilhada na planilha?');
    console.log('   - Permissão de Editor ou Viewer?');
    console.log('');
    console.log('4. 🔄 Reinicie as Edge Functions:');
    console.log('   - Supabase Dashboard > Edge Functions > Restart');
    console.log('');
    console.log('5. ⏱️ Aguarde propagação:');
    console.log('   - Mudanças nas variáveis podem levar 1-2 minutos');
}

executarTeste();