#!/bin/bash

# Script Universal de Configuração para VPS
# EETAD Sistema v2 - Funciona com root ou sudo

echo "🚀 Configurando VPS para EETAD Sistema v2..."

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

# Detectar se é root ou tem sudo
if [ "$EUID" -eq 0 ]; then
    SUDO_CMD=""
    print_info "Executando como root"
else
    if sudo -n true 2>/dev/null; then
        SUDO_CMD="sudo"
        print_info "Executando com sudo"
    else
        print_error "Este script precisa de privilégios de administrador."
        print_info "Execute como root ou com um usuário que tenha sudo."
        exit 1
    fi
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
$SUDO_CMD apt update && $SUDO_CMD apt upgrade -y

# Instalar dependências básicas
print_info "Instalando dependências..."
$SUDO_CMD apt install -y curl wget git unzip software-properties-common

# Instalar Node.js 18+
print_info "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO_CMD -E bash -
$SUDO_CMD apt install -y nodejs

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
print_status "Node.js instalado: $NODE_VERSION"

# Instalar PM2 globalmente
print_info "Instalando PM2..."
$SUDO_CMD npm install -g pm2

# Instalar Nginx
print_info "Instalando Nginx..."
$SUDO_CMD apt install -y nginx

# Instalar Certbot para SSL
print_info "Instalando Certbot..."
$SUDO_CMD apt install -y certbot python3-certbot-nginx

# Configurar firewall
print_info "Configurando firewall..."
$SUDO_CMD ufw allow 22/tcp
$SUDO_CMD ufw allow 80/tcp
$SUDO_CMD ufw allow 443/tcp
$SUDO_CMD ufw --force enable

# Criar diretório do projeto
print_info "Criando diretório do projeto..."
$SUDO_CMD mkdir -p /var/www
if [ "$EUID" -eq 0 ]; then
    chown -R $SUDO_USER:$SUDO_USER /var/www 2>/dev/null || chown -R 1000:1000 /var/www
else
    $SUDO_CMD chown -R $USER:$USER /var/www
fi

# Criar diretório de logs
print_info "Criando diretório de logs..."
$SUDO_CMD mkdir -p /var/log/eetad
if [ "$EUID" -eq 0 ]; then
    chown -R $SUDO_USER:$SUDO_USER /var/log/eetad 2>/dev/null || chown -R 1000:1000 /var/log/eetad
else
    $SUDO_CMD chown -R $USER:$USER /var/log/eetad
fi

# Configurar Nginx
print_info "Configurando Nginx..."
$SUDO_CMD systemctl enable nginx
$SUDO_CMD systemctl start nginx

# Configurar PM2 para auto-start
print_info "Configurando PM2..."
if [ "$EUID" -eq 0 ]; then
    print_warning "PM2 startup será configurado manualmente para root"
else
    pm2 startup systemd -u $USER --hp $HOME
fi

print_status "Configuração básica da VPS concluída!"
print_info "Próximos passos:"
echo "1. Clone o repositório: git clone https://github.com/Igorryan44/eetad-sistema-v2.git"
echo "2. Configure as variáveis de ambiente no arquivo .env"
echo "3. Execute: npm install && npm run build"
echo "4. Configure o Nginx com seu domínio"
echo "5. Configure SSL com Let's Encrypt"
echo "6. Inicie a aplicação com PM2"

print_warning "Lembre-se de configurar seu domínio no arquivo de configuração do Nginx!"
