#!/bin/bash

# Script de Deploy Automático para VPS
# EETAD Sistema v2

echo "🚀 Iniciando deploy na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Execute este script na raiz do projeto EETAD"
    exit 1
fi

# Verificar se o Git está configurado
if ! git status &> /dev/null; then
    print_error "Este não é um repositório Git válido"
    exit 1
fi

# Verificar se há alterações não commitadas
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Há alterações não commitadas:"
    git status --short
    
    read -p "Deseja fazer commit das alterações? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        read -p "Digite a mensagem do commit: " commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Deploy automático - $(date '+%Y-%m-%d %H:%M')"
        fi
        git add .
        git commit -m "$commit_message"
        print_status "Commit realizado: $commit_message"
    fi
fi

# Fazer pull das alterações
print_info "Fazendo pull das alterações..."
git pull origin main

# Instalar dependências do frontend
print_info "Instalando dependências do frontend..."
npm install

# Instalar dependências do backend
print_info "Instalando dependências do backend..."
cd local-server
npm install
cd ..

# Build do frontend
print_info "Fazendo build do frontend..."
npm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    print_error "Build falhou - pasta 'dist' não foi criada"
    exit 1
fi

print_status "Build criado com sucesso"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 não está instalado. Execute: sudo npm install -g pm2"
    exit 1
fi

# Verificar se o arquivo de configuração do PM2 existe
if [ ! -f "ecosystem.config.js" ]; then
    print_warning "Arquivo ecosystem.config.js não encontrado. Criando..."
    
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'eetad-backend',
      script: './local-server/index.js',
      cwd: '/var/www/eetad-sistema-v2',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: '/var/log/eetad/backend-error.log',
      out_file: '/var/log/eetad/backend-out.log',
      log_file: '/var/log/eetad/backend-combined.log'
    }
  ]
};
EOF
    
    print_status "Arquivo ecosystem.config.js criado"
fi

# Parar aplicação se estiver rodando
print_info "Parando aplicação anterior..."
pm2 stop eetad-backend 2>/dev/null || true

# Iniciar aplicação
print_info "Iniciando aplicação..."
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Verificar status
print_info "Verificando status da aplicação..."
pm2 status

# Verificar se a aplicação está respondendo
print_info "Testando aplicação..."
sleep 5

if curl -f http://localhost:3003/health &> /dev/null; then
    print_status "Aplicação está rodando e respondendo!"
else
    print_warning "Aplicação pode não estar respondendo corretamente"
    print_info "Verifique os logs com: pm2 logs eetad-backend"
fi

# Verificar Nginx
print_info "Verificando Nginx..."
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx está rodando"
else
    print_warning "Nginx não está rodando. Execute: sudo systemctl start nginx"
fi

# Mostrar informações finais
print_status "Deploy concluído!"
echo
print_info "Informações úteis:"
echo "• Status da aplicação: pm2 status"
echo "• Logs da aplicação: pm2 logs eetad-backend"
echo "• Reiniciar aplicação: pm2 restart eetad-backend"
echo "• Status do Nginx: sudo systemctl status nginx"
echo "• Logs do Nginx: sudo tail -f /var/log/nginx/error.log"
echo
print_info "URLs para testar:"
echo "• Frontend: http://seu-dominio.com"
echo "• Backend: http://seu-dominio.com/api/"
echo "• Health Check: http://seu-dominio.com/health"
echo
print_warning "Lembre-se de configurar SSL com Let's Encrypt se ainda não fez!"
