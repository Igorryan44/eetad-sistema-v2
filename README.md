# EETAD Sistema v2 🎓

## Sistema de Gestão Acadêmica da Escola de Educação Teológica das Assembleias de Deus

**Versão:** 2.0.1  
**Repositório:** https://github.com/simiao2025/eestad-sistema-v2  
**Status:** ✅ Produção - WhatsApp + IA Integrados

---

## 🚀 **Principais Funcionalidades**

### **🤖 Agente de IA Integrado**
- **Chatbot inteligente** com acesso aos dados dos alunos
- **Integração com Google Sheets** (banco "controle alunos")
- **Detecção automática de dispositivo**:
  - 📱 **Mobile**: Abre WhatsApp App
  - 💻 **Desktop**: Abre WhatsApp Web
- **Conversa direta** com o bot da Evolution API (556381122538)

### **📊 Gestão Completa**
- Sistema de matrículas digitalizado
- Dashboard administrativo em tempo real
- Gestão de usuários e secretários
- Controle de pedidos de livros
- Integração com MercadoPago/PIX

### **📱 Integração WhatsApp**
- **Evolution API** configurada e funcionando
- **Webhook** com rate limiting e validação
- **Respostas automáticas** via IA
- **Dados dos alunos** integrados nas conversas

---

## 🛠 **Stack Tecnológica**

**Frontend:**
- React 18 + TypeScript
- Vite (build otimizado)
- Tailwind CSS + shadcn/ui
- Radix UI (componentes acessíveis)

**Backend:**
- Express.js (local na porta 3003)
- Google Sheets API (banco de dados)
- Evolution API (WhatsApp)
- OpenAI GPT-4 (opcional)

**Deploy:**
- Frontend: Vercel/Netlify
- Webhook: Vercel Serverless Functions
- Backend: Local (Express.js)

---

## 📋 **Setup Rápido**

### **1. Clonar e Instalar**
```bash
git clone https://github.com/simiao2025/eestad-sistema-v2.git
cd eestad-sistema-v2
npm install
cd local-server && npm install && cd ..
```

### **2. Configurar Variáveis de Ambiente**
```bash
# Copiar o template
cp config/settings.template.json config/settings.json

# Editar com suas credenciais:
# - OpenAI API Key
# - Evolution API URL e Key
# - Google Sheets credentials
```

### **3. Executar em Desenvolvimento**
```bash
# Terminal 1 - Backend
cd local-server
npm start

# Terminal 2 - Frontend  
npm run dev
```

### **4. Build para Produção**
```bash
npm run build
# Upload da pasta 'dist' para Vercel/Netlify
```

---

## 🌐 **Deploy no Vercel**

### **Configuração Automática:**
1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### **Variáveis de Ambiente Necessárias:**
- `NEXT_PUBLIC_API_URL` - URL do seu backend
- `OPENAI_API_KEY` - Para funcionalidades de IA
- `EVOLUTION_API_URL` - URL da Evolution API
- `EVOLUTION_API_KEY` - Chave da Evolution API

---

## 📱 **Como Funciona o WhatsApp + IA**

### **Para o Usuário:**
1. **Clica no ícone do agente IA** no site
2. **Detecção automática**:
   - Mobile → Abre WhatsApp App
   - Desktop → Abre WhatsApp Web (nova aba)
3. **Conversa direta** com o bot inteligente
4. **IA acessa dados** do Google Sheets automaticamente

### **Tecnicamente:**
- **Evolution API** instância "eetad" (556381122538)
- **Webhook** processa mensagens com rate limiting
- **IA query** busca dados nas 4 abas do Google Sheets
- **Respostas personalizadas** com dados do aluno

---

## 🔧 **Estrutura do Projeto**

```
eestad-sistema-v2/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── AIChatbot.tsx        # Chatbot com detecção de dispositivo
│   │   ├── WhatsAppOpener.tsx   # Componente de abertura WhatsApp
│   │   └── ui/                  # Componentes UI (Radix)
│   └── services/                # Serviços API
├── local-server/                # Backend Express.js
│   ├── functions/
│   │   ├── ai-chatbot.js       # IA integrada
│   │   ├── ai-data-query.js    # Query Google Sheets
│   │   └── whatsapp-webhook.js # Webhook WhatsApp
│   └── index.js                # Servidor principal
├── api/                         # Serverless functions (Vercel)
├── config/                      # Configurações
│   ├── settings.json           # Configurações (não comitar)
│   └── settings.template.json  # Template seguro
└── docs/                       # Documentação
```

---

## 📞 **Suporte e Contato**

**Desenvolvedor:** Simião  
**Email:** simacjr@hotmail.com  
**WhatsApp:** (63) 9 8511-2006

**EETAD Palmas/TO**  
**Endereço:** ARSR 75  

---

## 🎯 **Roadmap**

- ✅ Sistema de matrículas
- ✅ Dashboard administrativo  
- ✅ Integração WhatsApp + Evolution API
- ✅ Agente IA com dados dos alunos
- ✅ Detecção automática de dispositivos
- ✅ Deploy otimizado no Vercel
- 🔄 Melhorias na UI/UX
- 🔄 Relatórios avançados
- 🔄 App mobile nativo

---

## 📄 **Licença**

Projeto desenvolvido para uso interno da EETAD - Palmas/TO.  
Todos os direitos reservados © 2025

---

**🚀 Sistema totalmente funcional e pronto para produção!**