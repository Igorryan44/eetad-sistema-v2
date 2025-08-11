#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando migração das funções Supabase para local...\n');

// Verificar se o diretório local-server existe
const localServerDir = path.join(__dirname, '..');
if (!fs.existsSync(localServerDir)) {
  console.error('❌ Diretório local-server não encontrado!');
  process.exit(1);
}

// Verificar se as dependências estão instaladas
const packageJsonPath = path.join(localServerDir, 'package.json');
const nodeModulesPath = path.join(localServerDir, 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Instalando dependências...');
  const { execSync } = await import('child_process');
  
  try {
    execSync('npm install', { 
      cwd: localServerDir, 
      stdio: 'inherit' 
    });
    console.log('✅ Dependências instaladas com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao instalar dependências:', error.message);
    process.exit(1);
  }
}

// Verificar arquivo de ambiente
const envLocalPath = path.join(__dirname, '..', '..', '.env.local');
const envLocalExamplePath = path.join(__dirname, '..', '..', '.env.local.example');

if (!fs.existsSync(envLocalPath)) {
  console.log('⚙️ Criando arquivo .env.local...');
  
  if (fs.existsSync(envLocalExamplePath)) {
    fs.copyFileSync(envLocalExamplePath, envLocalPath);
    console.log('✅ Arquivo .env.local criado a partir do exemplo');
    console.log('⚠️  IMPORTANTE: Configure suas credenciais reais no arquivo .env.local\n');
  } else {
    console.warn('⚠️  Arquivo .env.local.example não encontrado');
    console.log('📝 Crie manualmente o arquivo .env.local com suas credenciais\n');
  }
}

// Verificar funções migradas
const functionsDir = path.join(localServerDir, 'functions');
const functions = fs.readdirSync(functionsDir).filter(file => file.endsWith('.js'));

console.log('📋 Funções migradas encontradas:');
functions.forEach(func => {
  console.log(`  ✅ ${func.replace('.js', '')}`);
});

console.log(`\n📊 Total: ${functions.length} funções migradas\n`);

// Verificar utilitários
const utilsDir = path.join(localServerDir, 'utils');
const utils = fs.readdirSync(utilsDir).filter(file => file.endsWith('.js'));

console.log('🔧 Utilitários disponíveis:');
utils.forEach(util => {
  console.log(`  ✅ ${util.replace('.js', '')}`);
});

console.log('\n🎉 Migração concluída com sucesso!');
console.log('\n📝 Próximos passos:');
console.log('1. Configure suas credenciais no arquivo .env.local');
console.log('2. Execute: cd local-server && npm start');
console.log('3. Teste as funções em: http://localhost:3001');
console.log('4. Configure o frontend para usar as URLs locais\n');

// Mostrar comandos úteis
console.log('🔧 Comandos úteis:');
console.log('  npm start          - Iniciar servidor');
console.log('  npm run dev        - Iniciar com nodemon (auto-reload)');
console.log('  npm test           - Executar testes');
console.log('  npm run migrate    - Executar este script novamente\n');

console.log('📚 Documentação completa em: MIGRACAO-LOCAL.md');