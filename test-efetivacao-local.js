// Teste simples para verificar a efetivação de matrícula

async function testEfetivacao() {
  console.log('🎯 TESTE: Efetivação de Matrícula\n');
  
  try {
    // Dados de teste que simulam o que o dashboard envia
    const testData = {
      cpf: '12345678901',
      ciclo: 'Ciclo 1',
      subnucleo: 'Subnúcleo A',
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Matriculado',
      observacao: 'Teste de efetivação',
      rowIndex: 2 // Linha de teste
    };
    
    console.log('📝 Dados de teste:', testData);
    console.log('\n🔄 Testando servidor local...');
    
    // Testar servidor local (porta 3003)
    const localUrl = 'http://localhost:3003/functions/finalize-enrollment';
    
    try {
      const localResponse = await fetch(localUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      console.log('📊 Status da resposta local:', localResponse.status);
      
      if (localResponse.ok) {
        const result = await localResponse.json();
        console.log('✅ Servidor local funcionou:', result);
      } else {
        const errorText = await localResponse.text();
        console.log('❌ Erro no servidor local:', errorText);
      }
    } catch (error) {
      console.log('❌ Erro de conexão com servidor local:', error.message);
    }
    
    console.log('\n🌐 Testando Supabase...');
    
    // Testar Supabase (como o dashboard faz)
    const supabaseUrl = 'https://umkizxftwrwqiiahbjrr.supabase.co/functions/v1/finalize-enrollment';
    
    try {
      const supabaseResponse = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify(testData)
      });
      
      console.log('📊 Status da resposta Supabase:', supabaseResponse.status);
      
      if (supabaseResponse.ok) {
        const result = await supabaseResponse.json();
        console.log('✅ Supabase funcionou:', result);
      } else {
        const errorText = await supabaseResponse.text();
        console.log('❌ Erro no Supabase:', errorText);
      }
    } catch (error) {
      console.log('❌ Erro de conexão com Supabase:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testEfetivacao();