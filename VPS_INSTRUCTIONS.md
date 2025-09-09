# 🖥️ Instruções para Deploy na VPS

## 📋 **Passos para Executar na VPS**

### **1. Conectar na VPS:**
```bash
ssh root@seu-ip-vps
# ou
ssh usuario@seu-ip-vps
```

### **2. Executar Setup Inicial:**
```bash
# Tornar o script executável
chmod +x vps-setup.sh

# Executar configuração inicial
./vps-setup.sh
```

### **3. Clonar o Projeto:**
```bash
cd /var/www
git clone https://github.com/Igorryan44/eetad-sistema-v2.git
cd eetad-sistema-v2
```

### **4. Configurar Variáveis de Ambiente:**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

### **5. Executar Deploy:**
```bash
# Tornar o script executável
chmod +x deploy-vps.sh

# Executar deploy
./deploy-vps.sh
```

### **6. Configurar Nginx:**
```bash
# Copiar configuração
sudo cp nginx-config.conf /etc/nginx/sites-available/eetad-sistema

# Editar com seu domínio
sudo nano /etc/nginx/sites-available/eetad-sistema

# Ativar site
sudo ln -s /etc/nginx/sites-available/eetad-sistema /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### **7. Configurar SSL:**
```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 **Comandos Úteis**

### **Gerenciar Aplicação:**
```bash
# Status
pm2 status

# Logs
pm2 logs eetad-backend

# Reiniciar
pm2 restart eetad-backend

# Parar
pm2 stop eetad-backend

# Iniciar
pm2 start eetad-backend
```

### **Gerenciar Nginx:**
```bash
# Status
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx

# Recarregar configuração
sudo systemctl reload nginx

# Logs
sudo tail -f /var/log/nginx/error.log
```

### **Deploy Rápido:**
```bash
# Atualizar código
git pull origin main

# Rebuild e restart
./deploy-vps.sh
```

---

## 🚨 **Troubleshooting**

### **Aplicação não inicia:**
```bash
# Verificar logs
pm2 logs eetad-backend

# Verificar se porta está em uso
sudo netstat -tlnp | grep :3003

# Verificar variáveis de ambiente
pm2 env 0
```

### **Nginx não carrega:**
```bash
# Testar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Verificar se site está ativo
sudo ls -la /etc/nginx/sites-enabled/
```

### **SSL não funciona:**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --dry-run

# Verificar se Nginx está usando SSL
sudo nginx -T | grep ssl
```

---

## 📊 **Monitoramento**

### **Verificar Status Geral:**
```bash
# Status da aplicação
pm2 status

# Status do Nginx
sudo systemctl status nginx

# Status do sistema
htop
# ou
top

# Espaço em disco
df -h

# Memória
free -h
```

### **Logs Importantes:**
```bash
# Logs da aplicação
pm2 logs eetad-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/eetad-access.log
sudo tail -f /var/log/nginx/eetad-error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

---

## 🔄 **Deploy Automático com Webhook**

### **Configurar Webhook do GitHub:**
1. Vá em Settings > Webhooks no seu repositório
2. Adicione URL: `https://seu-dominio.com/webhook/deploy`
3. Configure para enviar apenas push events

### **Criar endpoint de deploy:**
```bash
# Criar arquivo webhook
nano /var/www/eetad-sistema-v2/webhook-deploy.js
```

**Conteúdo do webhook:**
```javascript
const { exec } = require('child_process');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/deploy', (req, res) => {
  console.log('Deploy webhook triggered');
  
  exec('cd /var/www/eetad-sistema-v2 && ./deploy-vps.sh', (error, stdout, stderr) => {
    if (error) {
      console.error('Deploy error:', error);
      return res.status(500).json({ error: 'Deploy failed' });
    }
    
    console.log('Deploy successful:', stdout);
    res.json({ message: 'Deploy successful' });
  });
});

app.listen(3004, () => {
  console.log('Deploy webhook listening on port 3004');
});
```

---

## ✅ **Checklist Final**

- [ ] VPS configurada com Node.js, Nginx, PM2
- [ ] Projeto clonado e configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação rodando com PM2
- [ ] Nginx configurado e funcionando
- [ ] SSL configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Deploy testado e funcionando
- [ ] Monitoramento configurado

---

**🎉 Seu sistema estará rodando na VPS com alta disponibilidade!**
