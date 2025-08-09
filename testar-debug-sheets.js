import fetch from 'node-fetch';

async function testarDebugSheets() {
    console.log('🔍 TESTANDO DEBUG DAS ABAS DA PLANILHA');
    console.log('================================================================================');

    const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MDQ5NzQsImV4cCI6MjA0OTA4MDk3NH0.Ej5Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    try {
        console.log('📋 Chamando função debug-sheets...');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/debug-sheets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);
        console.log(`Status Text: ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('\n📊 RESULTADO DO DEBUG:');
            console.log('================================================================================');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log(`❌ Erro: ${errorText}`);
        }

    } catch (error) {
        console.log(`❌ Erro na requisição: ${error.message}`);
    }
}

testarDebugSheets().catch(console.error);