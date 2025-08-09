import fetch from 'node-fetch';

async function testarComDebug() {
    console.log('🔍 TESTANDO FUNÇÃO COM DEBUG ATIVADO');
    console.log('================================================================================');

    const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MDQ5NzQsImV4cCI6MjA0OTA4MDk3NH0.Ej5Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    try {
        console.log('📋 Chamando função get-pending-enrollments com debug=true...');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-pending-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ debug: true })
        });

        console.log(`Status: ${response.status}`);
        console.log(`Status Text: ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('\n📊 RESULTADO COM DEBUG:');
            console.log('================================================================================');
            
            // Mostrar resposta completa para debug
            console.log('🔍 RESPOSTA COMPLETA:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.debug) {
              console.log('\n🔍 INFORMAÇÕES DE DEBUG:');
              console.log('- Credenciais configuradas:', data.debug.credentialsConfigured);
              console.log('- Total de linhas "dados pessoais":', data.debug.totalDadosPessoaisRows);
              console.log('- Total de linhas "matriculas":', data.debug.totalMatriculasRows);
              console.log('- CPFs matriculados:', data.debug.enrolledCPFs?.length || 0);
              console.log('- Headers "dados pessoais":', data.debug.dadosPessoaisHeaders);
              console.log('- Primeiras 3 linhas "dados pessoais":');
              data.debug.firstThreeDadosPessoaisRows?.forEach((row, index) => {
                console.log(`  Linha ${index + 1}:`, row);
              });
              console.log('- Variáveis de ambiente:', data.debug.allEnvVars);
            } else {
              console.log('\n⚠️ Nenhuma informação de debug encontrada na resposta');
            }
            
            console.log('\n📋 MATRÍCULAS PENDENTES ENCONTRADAS:', data.pendingEnrollments?.length || 0);
            if (data.pendingEnrollments?.length > 0) {
              data.pendingEnrollments.forEach((enrollment, index) => {
                console.log(`${index + 1}. ${enrollment.nome} - CPF: ${enrollment.cpf}`);
              });
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ Erro: ${errorText}`);
        }

    } catch (error) {
        console.log(`❌ Erro na requisição: ${error.message}`);
    }
}

testarComDebug().catch(console.error);