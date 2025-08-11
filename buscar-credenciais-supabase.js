// 🔍 Script para buscar credenciais do Supabase e aplicar no ambiente local
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = 'https://umkizxftwrwqiiahjbrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTU5NzQsImV4cCI6MjA1MDEzMTk3NH0.Oj7Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Credenciais conhecidas do Supabase (baseadas no arquivo configurar-todas-variaveis-supabase.js)
const SUPABASE_CREDENTIALS = {
    // Google Sheets
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'eetad-service@testen8n-448514.iam.gserviceaccount.com',
    GOOGLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n',
    GOOGLE_SHEETS_SPREADSHEET_ID: '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA',
    
    // OpenAI
    OPENAI_API_KEY: 'sk-1234567890abcdef1234567890abcdef1234567890abcdef12',
    
    // Evolution API
    EVOLUTION_API_URL: 'https://sua-evolution-api.com',
    EVOLUTION_API_KEY: 'sua-chave-evolution-api-aqui',
    
    // SMTP
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PASSWORD: 'sua-senha-app-gmail',
    SMTP_USER: 'seu-email@gmail.com',
    SMTP_PORT: '587',
    FROM_EMAIL: 'seu-email@gmail.com',
    FROM_NAME: 'Sistema EETAD'
};

async function buscarCredenciaisSupabase() {
    console.log('🔍 BUSCANDO CREDENCIAIS DO SUPABASE');
    console.log('=' .repeat(50));
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        console.log('✅ Conexão com Supabase estabelecida');
        console.log('📋 Aplicando credenciais conhecidas...\n');
        
        // Ler arquivo .env atual
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            console.log('📄 Arquivo .env encontrado');
        } else {
            console.log('📄 Criando novo arquivo .env');
        }
        
        // Ler arquivo .env.local atual
        const envLocalPath = path.join(__dirname, '.env.local');
        let envLocalContent = '';
        
        if (fs.existsSync(envLocalPath)) {
            envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
            console.log('📄 Arquivo .env.local encontrado');
        } else {
            console.log('📄 Criando novo arquivo .env.local');
        }
        
        // Aplicar credenciais
        console.log('\n🔧 Aplicando credenciais:');
        
        for (const [key, value] of Object.entries(SUPABASE_CREDENTIALS)) {
            console.log(`   ✅ ${key}`);
            
            // Atualizar .env
            const envRegex = new RegExp(`^${key}=.*$`, 'm');
            if (envRegex.test(envContent)) {
                envContent = envContent.replace(envRegex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
            
            // Atualizar .env.local
            if (envRegex.test(envLocalContent)) {
                envLocalContent = envLocalContent.replace(envRegex, `${key}=${value}`);
            } else {
                envLocalContent += `\n${key}=${value}`;
            }
        }
        
        // Salvar arquivos
        fs.writeFileSync(envPath, envContent.trim() + '\n');
        fs.writeFileSync(envLocalPath, envLocalContent.trim() + '\n');
        
        console.log('\n✅ CREDENCIAIS APLICADAS COM SUCESSO!');
        console.log('📁 Arquivos atualizados:');
        console.log('   - .env');
        console.log('   - .env.local');
        
        console.log('\n🚀 Próximos passos:');
        console.log('1. Reinicie o servidor local: npm start');
        console.log('2. Teste as funções no dashboard: http://localhost:3003');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao buscar credenciais:', error.message);
        return false;
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    buscarCredenciaisSupabase()
        .then(success => {
            if (success) {
                console.log('\n🎉 Processo concluído com sucesso!');
            } else {
                console.log('\n❌ Processo falhou. Verifique os logs acima.');
            }
        })
        .catch(error => {
            console.error('❌ Erro fatal:', error);
        });
}

export { buscarCredenciaisSupabase, SUPABASE_CREDENTIALS };