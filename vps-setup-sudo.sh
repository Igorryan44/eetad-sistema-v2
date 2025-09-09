#!/bin/bash

# Script de Configuração para VPS com Usuário Sudo
# EETAD Sistema v2

echo "🚀 Configurando VPS para EETAD Sistema v2 (usuário sudo)..."

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

# Verificar se tem sudo
if ! sudo -n true 2>/dev/null; then
    print_error "Este script precisa de privilégios sudo."
    print_info "Execute: sudo ./vps-setup-sudo.sh"
    exit 1
fi

# Detectar distribuição
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Não foi possível detectar a distribuição do sistema."
    exit 1
fi

print_info "Sistema detectado: $OS $VER"

# Atualizar sistema
print_info "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
print_info "Instalando dependências..."
sudo apt install -y curl wget git unzip software-properties-common

# Instalar Node.js 18+
print_info "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
print_status "Node.js instalado: $NODE_VERSION"

# Instalar PM2 globalmente
print_info "Instalando PM2..."
sudo npm install -g pm2

# Instalar Nginx
print_info "Instalando Nginx..."
sudo apt install -y nginx

# Instalar Certbot para SSL
print_info "Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Configurar firewall
print_info "Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Criar diretório do projeto
print_info "Criando diretório do projeto..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

# Criar diretório de logs
print_info "Criando diretório de logs..."
sudo mkdir -p /var/log/eetad
sudo chown -R $USER:$USER /var/log/eetad

# Configurar Nginx
print_info "Configurando Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Configurar PM2 para auto-start
print_info "Configurando PM2..."
pm2 startup systemd -u $USER --hp $HOME

print_status "Configuração básica da VPS concluída!"
print_info "Próximos passos:"
echo "1. Clone o repositório: git clone https://github.com/Igorryan44/eetad-sistema-v2.git"
echo "2. Configure as variáveis de ambiente no arquivo .env"
echo "3. Execute: npm install && npm run build"
echo "4. Configure o Nginx com seu domínio"
echo "5. Configure SSL com Let's Encrypt"
echo "6. Inicie a aplicação com PM2"

print_warning "Lembre-se de configurar seu domínio no arquivo de configuração do Nginx!"
