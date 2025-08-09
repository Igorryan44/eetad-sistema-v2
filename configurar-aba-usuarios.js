const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTU5NzQsImV4cCI6MjA1MDEzMTk3NH0.Oj7Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function configurarAbaUsuarios() {
  try {
    console.log('🔧 Configurando aba usuarios...');
    
    // Primeiro, vamos tentar criar o cabeçalho
    const { data, error } = await supabase.functions.invoke('manage-secretary-users', {
      body: {
        action: 'setup-headers'
      }
    });

    if (error) {
      console.error('❌ Erro ao configurar cabeçalho:', error);
      
      // Vamos tentar criar o usuário Admin diretamente
      console.log('🔄 Tentando criar usuário Admin...');
      
      const { data: createData, error: createError } = await supabase.functions.invoke('manage-secretary-users', {
        body: {
          action: 'create',
          userData: {
            username: 'Admin',
            email: 'simacjr@hotmail.com',
            fullName: 'Administrador',
            password: 'admin1'
          }
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        return;
      }

      console.log('✅ Usuário Admin criado:', createData);
    } else {
      console.log('✅ Cabeçalho configurado:', data);
    }

    // Agora vamos testar o login
    console.log('🔐 Testando login do Admin...');
    
    const { data: loginData, error: loginError } = await supabase.functions.invoke('manage-secretary-users', {
      body: {
        action: 'login',
        username: 'Admin',
        password: 'admin1'
      }
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
    } else {
      console.log('✅ Login realizado com sucesso:', loginData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

configurarAbaUsuarios();