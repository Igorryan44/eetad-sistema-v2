import fetch from 'node-fetch';

async function debugDetalhado() {
    console.log('🔍 DEBUG DETALHADO: Verificando função get-pending-enrollments');
    console.log('================================================================================');

    const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MDQ5NzQsImV4cCI6MjA0OTA4MDk3NH0.Ej5Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    try {
        console.log('📋 1. Testando função get-pending-enrollments...');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-pending-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        console.log(`Status: ${response.status}`);
        console.log(`Status Text: ${response.statusText}`);
        
        const responseText = await response.text();
        console.log(`Resposta bruta: ${responseText}`);
        
        try {
            const data = JSON.parse(responseText);
            console.log(`✅ JSON válido recebido:`);
            console.log(JSON.stringify(data, null, 2));
            
            if (Array.isArray(data)) {
                console.log(`📊 Total de alunos pendentes: ${data.length}`);
                
                if (data.length > 0) {
                    console.log('👥 Alunos encontrados:');
                    data.forEach((aluno, index) => {
                        console.log(`   ${index + 1}. ${aluno.nome} (CPF: ${aluno.cpf})`);
                    });
                } else {
                    console.log('⚠️ Nenhum aluno pendente encontrado');
                }
            } else {
                console.log('⚠️ Resposta não é um array');
            }
            
        } catch (parseError) {
            console.log(`❌ Erro ao fazer parse do JSON: ${parseError.message}`);
            console.log(`Resposta recebida: ${responseText}`);
        }

    } catch (error) {
        console.log(`❌ Erro na requisição: ${error.message}`);
    }

    console.log('\n🔍 2. Testando função get-enrollments para comparação...');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        console.log(`Status: ${response.status}`);
        
        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            console.log(`✅ Total de matrículas: ${data.length}`);
            
            if (data.length > 0) {
                console.log('📚 Primeiras 3 matrículas:');
                data.slice(0, 3).forEach((matricula, index) => {
                    console.log(`   ${index + 1}. ${matricula.nome} (CPF: ${matricula.cpf})`);
                });
            }
            
        } catch (parseError) {
            console.log(`❌ Erro ao fazer parse: ${parseError.message}`);
        }

    } catch (error) {
        console.log(`❌ Erro na requisição get-enrollments: ${error.message}`);
    }

    console.log('\n📋 3. Dados esperados dos alunos:');
    console.log('   Aluno 1: Simião Alves da Costa Junior (CPF: 61767735120)');
    console.log('   Aluno 2: Bruno Alexandre Barros dos Santos (CPF: 003.807.533-40)');
    
    console.log('\n🎯 4. Próximos passos:');
    console.log('   - Se get-enrollments retorna dados, as credenciais estão OK');
    console.log('   - Se get-pending-enrollments retorna 0, pode ser problema de lógica');
    console.log('   - Verificar se os CPFs dos alunos já estão na aba "matriculas"');
}

debugDetalhado().catch(console.error);