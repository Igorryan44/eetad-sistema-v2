// Script para testar a função get-pending-enrollments
console.log('🔍 Testando função get-pending-enrollments...');

async function testPendingEnrollments() {
    try {
        console.log('📡 Fazendo requisição para get-pending-enrollments...');
        
        // Teste normal
        const response = await fetch('http://127.0.0.1:54321/functions/v1/get-pending-enrollments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
            },
            body: JSON.stringify({})
        });

        console.log('📊 Status da resposta:', response.status);
        
        if (!response.ok) {
            console.error('❌ Erro na requisição:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Detalhes do erro:', errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Resposta recebida:', JSON.stringify(data, null, 2));
        
        if (Array.isArray(data)) {
            console.log(`📋 Total de matrículas pendentes: ${data.length}`);
            data.forEach((student, index) => {
                console.log(`👤 Aluno ${index + 1}: ${student.nome} (CPF: ${student.cpf})`);
            });
        } else if (data.pendingEnrollments) {
            console.log(`📋 Total de matrículas pendentes: ${data.pendingEnrollments.length}`);
            data.pendingEnrollments.forEach((student, index) => {
                console.log(`👤 Aluno ${index + 1}: ${student.nome} (CPF: ${student.cpf})`);
            });
        }

        // Teste com debug
        console.log('\n🐛 Fazendo requisição com debug...');
        const debugResponse = await fetch('http://127.0.0.1:54321/functions/v1/get-pending-enrollments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
            },
            body: JSON.stringify({ debug: true })
        });

        if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('🐛 Resposta debug:', JSON.stringify(debugData, null, 2));
        } else {
            console.error('❌ Erro na requisição debug:', debugResponse.status);
        }

    } catch (error) {
        console.error('❌ Erro ao testar função:', error);
    }
}

// Executar teste
testPendingEnrollments();