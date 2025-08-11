import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSheetStructure() {
  console.log('🔍 Testando estrutura da planilha...');
  
  try {
    // Teste 1: Verificar se conseguimos acessar a API do Google Sheets diretamente
    console.log('\n1️⃣ Testando acesso direto ao Google Sheets...');
    
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA?key=AIzaSyBvOWSce-dQlAI5wSEBzo8CUzaGLiJXOI0');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Planilha acessível');
      console.log('📋 Abas encontradas:', data.sheets?.map(sheet => sheet.properties.title) || 'Nenhuma');
    } else {
      console.log('❌ Erro ao acessar planilha:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Erro no teste direto:', error.message);
  }
  
  try {
    // Teste 2: Verificar função get-enrollments
    console.log('\n2️⃣ Testando função get-enrollments...');
    
    const { data, error } = await supabase.functions.invoke('get-enrollments', {
      headers: {
         Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
       }
    });
    
    if (error) {
      console.log('❌ Erro na função:', error);
    } else {
      console.log('✅ Função executada com sucesso');
      console.log('📊 Dados retornados:', data);
      console.log('📈 Quantidade de matrículas:', Array.isArray(data) ? data.length : 'Formato inválido');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste da função:', error.message);
  }
}

testSheetStructure();