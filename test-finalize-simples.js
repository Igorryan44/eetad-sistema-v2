// Teste simples para verificar a função finalize-enrollment
const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testFinalizeEnrollment() {
    console.log('🧪 TESTE SIMPLES - Verificando função finalize-enrollment\n');
    
    try {
        // 1. Buscar alunos pendentes
        console.log('1️⃣ Buscando alunos pendentes...');
        const pendingResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-pending-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const pendingData = await pendingResponse.json();
        console.log('📊 Resposta pendentes:', JSON.stringify(pendingData, null, 2));
        
        if (!pendingData.pendingEnrollments?.length) {
            console.log('❌ Nenhum aluno pendente encontrado');
            return;
        }
        
        const student = pendingData.pendingEnrollments[0];
        console.log(`👤 Aluno selecionado: ${student.nome} - CPF: ${student.cpf}`);
        
        // 2. Verificar matrículas antes
        console.log('\n2️⃣ Verificando matrículas antes...');
        const beforeResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const beforeData = await beforeResponse.json();
        console.log('📊 Matrículas antes:', JSON.stringify(beforeData, null, 2));
        
        // 3. Efetivar matrícula
        console.log('\n3️⃣ Efetivando matrícula...');
        const finalizeData = {
            cpf: student.cpf,
            rowIndex: student.rowIndex,
            ciclo: 'Ciclo 2025',
            subnucleo: 'Subnúcleo Teste',
            data: new Date().toLocaleDateString('pt-BR'),
            status: 'Efetivado',
            observacao: `Matrícula efetivada via teste simples - ${new Date().toLocaleString('pt-BR')}`
        };
        
        console.log('📝 Dados da efetivação:', JSON.stringify(finalizeData, null, 2));
        
        const finalizeResponse = await fetch(`${SUPABASE_URL}/functions/v1/finalize-enrollment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalizeData)
        });
        
        const finalizeResult = await finalizeResponse.json();
        console.log('✅ Resposta da efetivação:', JSON.stringify(finalizeResult, null, 2));
        
        // 4. Aguardar e verificar novamente
        console.log('\n4️⃣ Aguardando 3 segundos e verificando...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const afterResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const afterData = await afterResponse.json();
        console.log('📊 Matrículas depois:', JSON.stringify(afterData, null, 2));
        
        // 5. Verificar se o aluno foi removido dos pendentes
        console.log('\n5️⃣ Verificando alunos pendentes novamente...');
        const finalPendingResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-pending-enrollments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const finalPendingData = await finalPendingResponse.json();
        console.log('📊 Pendentes finais:', JSON.stringify(finalPendingData, null, 2));
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testFinalizeEnrollment();