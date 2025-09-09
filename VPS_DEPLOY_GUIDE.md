# 🖥️ Deploy em VPS - EETAD Sistema v2

## 📋 **Pré-requisitos da VPS**

- ✅ Ubuntu 20.04+ ou CentOS 8+
- ✅ Node.js 18+ instalado
- ✅ Nginx instalado
- ✅ PM2 instalado
- ✅ Git instalado
- ✅ Domínio configurado (opcional)

---

## 🚀 **Passo 1: Preparar a VPS**

### **Conectar na VPS:**
```bash
ssh root@seu-ip-vps
# ou
ssh usuario@seu-ip-vps
```

### **Atualizar sistema:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### **Instalar dependências:**
```bash
# Ubuntu/Debian
sudo apt install -y nginx nodejs npm git curl wget

# CentOS/RHEL
sudo yum install -y nginx nodejs npm git curl wget
```

### **Instalar PM2 globalmente:**
```bash
sudo npm install -g pm2
```

---

## 🔧 **Passo 2: Configurar o Projeto**

### **Clonar o repositório:**
```bash
cd /var/www
sudo git clone https://github.com/Igorryan44/eetad-sistema-v2.git
sudo chown -R $USER:$USER /var/www/eetad-sistema-v2
cd /var/www/eetad-sistema-v2
```

### **Instalar dependências:**
```bash
# Frontend
npm install

# Backend
cd local-server
npm install
cd ..
```

### **Configurar variáveis de ambiente:**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

**Conteúdo do .env para VPS:**
```env
# Configuração da VPS
VITE_API_BASE_URL=http://seu-dominio.com:3003
NODE_ENV=production

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA
GOOGLE_SERVICE_ACCOUNT_EMAIL=puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----"

# WhatsApp/Evolution API
EVOLUTION_API_URL=https://evolutionapi.eetadnucleopalmas.shop
EVOLUTION_API_KEY=2388E58BAB87-4844-9BC7-23B7182D09C8
EVOLUTION_INSTANCE_NAME=eetad
SECRETARY_WHATSAPP_NUMBER=5563985112006

# OpenAI (opcional)
OPENAI_API_KEY=SUA_CHAVE_OPENAI

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-349178540939718-050307-092eeef435f701b0453368303a33c530-82713024
CHAVE_PIX_ESTATICA=simacjr@gmail.com
```

---

## 🏗️ **Passo 3: Build e Configuração**

### **Build do frontend:**
```bash
npm run build
```

### **Criar arquivo de configuração do PM2:**
```bash
nano ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**
```javascript
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
```

### **Criar diretório de logs:**
```bash
sudo mkdir -p /var/log/eetad
sudo chown -R $USER:$USER /var/log/eetad
```

---

## 🌐 **Passo 4: Configurar Nginx**

### **Criar configuração do site:**
```bash
sudo nano /etc/nginx/sites-available/eetad-sistema
```

**Conteúdo da configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Certificado SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend (React)
    location / {
        root /var/www/eetad-sistema-v2/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache estático
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Webhook WhatsApp
    location /webhook/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3003/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Logs
    access_log /var/log/nginx/eetad-access.log;
    error_log /var/log/nginx/eetad-error.log;
}
```

### **Ativar o site:**
```bash
sudo ln -s /etc/nginx/sites-available/eetad-sistema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 **Passo 5: Configurar SSL (Let's Encrypt)**

### **Instalar Certbot:**
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### **Obter certificado SSL:**
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### **Configurar renovação automática:**
```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 **Passo 6: Iniciar Aplicação**

### **Iniciar com PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Configurar PM2 para iniciar automaticamente:**
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## 🔧 **Passo 7: Configurar Firewall**

### **Ubuntu (UFW):**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **CentOS (Firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 📊 **Passo 8: Monitoramento**

### **Comandos úteis:**
```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs eetad-backend

# Reiniciar aplicação
pm2 restart eetad-backend

# Status do Nginx
sudo systemctl status nginx

# Logs do Nginx
sudo tail -f /var/log/nginx/eetad-access.log
sudo tail -f /var/log/nginx/eetad-error.log
```

---

## 🔄 **Passo 9: Deploy Automático (Opcional)**

### **Criar script de deploy:**
```bash
nano deploy-vps.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash
echo "🚀 Iniciando deploy na VPS..."

cd /var/www/eetad-sistema-v2

# Pull das alterações
git pull origin main

# Instalar dependências
npm install
cd local-server && npm install && cd ..

# Build do frontend
npm run build

# Reiniciar aplicação
pm2 restart eetad-backend

echo "✅ Deploy concluído!"
```

### **Tornar executável:**
```bash
chmod +x deploy-vps.sh
```

### **Executar deploy:**
```bash
./deploy-vps.sh
```

---

## 🛠️ **Troubleshooting**

### **Problema: Aplicação não inicia**
```bash
# Verificar logs
pm2 logs eetad-backend

# Verificar se a porta está em uso
sudo netstat -tlnp | grep :3003

# Verificar variáveis de ambiente
pm2 env 0
```

### **Problema: Nginx não carrega**
```bash
# Testar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### **Problema: SSL não funciona**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --dry-run
```

---

## 📱 **URLs Finais**

- **Frontend:** `https://seu-dominio.com`
- **Backend API:** `https://seu-dominio.com/api/`
- **Health Check:** `https://seu-dominio.com/health`
- **WhatsApp Webhook:** `https://seu-dominio.com/webhook/whatsapp`

---

## ✅ **Checklist Final**

- [ ] VPS configurada com Node.js, Nginx, PM2
- [ ] Projeto clonado e dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend buildado
- [ ] Nginx configurado com proxy reverso
- [ ] SSL configurado (Let's Encrypt)
- [ ] PM2 configurado para auto-start
- [ ] Firewall configurado
- [ ] Deploy testado e funcionando

---

**🎉 Seu sistema estará rodando na VPS com alta disponibilidade!**
