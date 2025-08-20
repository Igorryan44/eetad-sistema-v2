# 🎓 Sistema EETAD Palmas v2

## 📊 Status do Sistema

### **✅ SISTEMA 100% LOCAL E FUNCIONAL:**
- ✅ **Frontend:** React + Vite com interface completa
- ✅ **Backend:** Express.js rodando em localhost:3003
- ✅ **Autenticação:** Sistema completo com sessões de 8 horas
- ✅ **Google Sheets:** Integração direta via local server
- ✅ **Todas as funcionalidades:** Matrículas, usuários, relatórios
- ✅ **Zero dependências externas:** Sistema independente

**🚀 VERSÃO 2.0 - SISTEMA APRIMORADO**

Sistema completo de matrícula e gestão acadêmica para a **Escola de Educação Teológica das Assembleias de Deus (EETAD)** - Núcleo Palmas, Tocantins.

## 📋 Sobre o Projeto v2

Sistema desenvolvido para gerenciar matrículas e pedidos de livros dos alunos da EETAD, integrado com:
- **Ministério**: Assembléia de Deus Ministério Missão - PRV
- **Pagamentos**: MercadoPago (PIX)
- **Notificações**: WhatsApp e Email
- **Armazenamento**: Google Sheets

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação Local
- Login seguro gerenciado localmente
- Sessões de 8 horas com localStorage
- Controle de acesso por perfil
- Fallback automático para dados locais

### 📊 Dashboard Administrativo
- Visão geral de matrículas via Google Sheets
- Estatísticas em tempo real
- Interface responsiva e moderna
- Relatórios dinâmicos

### 📝 Gestão de Matrículas
- Formulário completo integrado ao Google Sheets
- Validação de dados em tempo real
- Processamento local de dados
- Status de matrícula atualizado automaticamente
- Integração opcional com MercadoPago

### 👥 Gerenciamento de Usuários
- Cadastro de secretárias via servidor local
- Sistema de permissões local
- Dados persistidos localmente
- Interface intuitiva para gestão

## ✨ Novidades da Versão 2.0

### 🎯 Novas Funcionalidades
- **Campo "Subnúcleo"** - Gestão detalhada por subnúcleos
- **Campo "Status"** - Controle de status dos alunos:
  - ✅ Ativo
  - ❌ Inativo  
  - ⏳ Pendente
  - 🎓 Concluído

### 🧹 Melhorias e Otimizações
- **Remoção completa** de dados fictícios e mock data
- **Harmonização** de estilos em todos os formulários
- **Interface aprimorada** com melhor UX/UI
- **Configuração otimizada** do Vite para melhor performance
- **Sistema 100% pronto** para produção com dados reais

### 🔧 Melhorias Técnicas
- **Código limpo** e organizado
- **Componentes otimizados** para melhor performance
- **Estrutura aprimorada** de arquivos e pastas
- **Documentação atualizada** e completa

## 🌐 Repositório v2

**GitHub**: https://github.com/Igorryan44/eetad-sistema-v2

## 🔄 Diferenças entre v1 e v2

| Funcionalidade | v1 (Original) | v2 (Aprimorada) |
|---|---|---|
| **Campo Subnúcleo** | ❌ Não possui | ✅ Implementado |
| **Campo Status** | ❌ Não possui | ✅ 4 opções disponíveis |
| **Dados Fictícios** | ⚠️ Presentes | ✅ Removidos completamente |
| **Estilos de Formulários** | ⚠️ Inconsistentes | ✅ Harmonizados |
| **Performance** | ⚠️ Básica | ✅ Otimizada |
| **Produção** | ⚠️ Requer limpeza | ✅ 100% pronto |
| **Repositório** | `eetad-sistema-matricula` | `eetad-sistema-v2` |

### 🎯 Por que escolher a v2?
- **✅ Mais funcionalidades** - Campos Subnúcleo e Status
- **✅ Melhor qualidade** - Código limpo e otimizado  
- **✅ Pronto para produção** - Sem dados fictícios
- **✅ Interface aprimorada** - UX/UI melhorada
- **✅ Performance superior** - Configurações otimizadas

## 📁 Estrutura do Projeto

### Frontend (React + Vite)
- **`src/components/`** - Componentes React (Header, Footer, Forms)
- **`src/pages/`** - Páginas principais do sistema
- **`src/integrations/`** - Integrações externas
- **`index.html`** - Página principal
- **`package.json`** - Dependências do projeto React

### Backend/Webhooks
- **`webhooks/`** - Webhooks do WhatsApp (Deno)
- **`local-server/functions/`** - Funções locais do servidor
  - Processamento de pagamentos
  - Notificações automáticas
  - Validação de CPF
  - Chatbot IA

### Configuração e Deploy
- **Scripts PowerShell** - Automação de configuração
- **Documentação** - Guias de implantação e configuração
- **`vercel.json`** - Configuração para deploy na Vercel

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- npm
- Conta no Google Cloud (para Google Sheets)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/eetad-sistema-v2.git
cd eetad-sistema-v2
```

### 2. Instale as dependências
```bash
npm install
cd local-server
npm install
cd ..
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na pasta `local-server` com:

```env
# Google Sheets (obrigatório)
GOOGLE_SHEETS_CLIENT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=sua-planilha-id

# MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=seu-token-mercadopago

# OpenAI (opcional)
OPENAI_API_KEY=sua-chave-openai
```

### 4. Inicie o sistema

**Terminal 1 - Backend (Local Server):**
```bash
cd local-server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Acesse o sistema
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3003
- **Sistema 100% local e independente**

## 📱 Como Usar

### Login
1. Acesse http://localhost:5173
2. Use as credenciais padrão ou crie uma nova conta
3. Autenticação gerenciada localmente com sessões de 8 horas

### Dashboard
- **Matrículas Pendentes:** Visualize e gerencie via Google Sheets
- **Relatórios:** Estatísticas em tempo real
- **Usuários:** Gerenciamento completo de secretárias
- **Chatbot:** IA integrada para suporte

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Express.js, Node.js (100% Local)
- **Armazenamento**: Google Sheets API
- **Pagamentos**: MercadoPago API (opcional)
- **Notificações**: WhatsApp Business API, EmailJS (opcional)
- **Deploy**: Vercel, Netlify

## 📦 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificação de código
```

## 🚀 Deploy

### Opção 1: Vercel (Recomendado)
1. Conecte sua conta GitHub à Vercel
2. Importe o repositório
3. Configure as variáveis de ambiente
4. Deploy automático

### Opção 2: Netlify
1. Faça o build: `npm run build`
2. Arraste a pasta `dist/` para o Netlify
3. Configure as variáveis de ambiente

### Opção 3: Manual
Consulte os guias de deploy:
- `DEPLOY-QUICK-GUIDE.md`
- `VERCEL-DEPLOY-GUIDE.md`

## 🏢 Informações Institucionais

### EETAD - Escola de Educação Teológica
- **Site**: https://eetad.com.br
- **Endereço**: Rua Pr. Bernhard Johnson, 500 - Tijuco das Telhas, Campinas/SP

### Ministério PRV
- **Site**: https://admissaoprv.com.br
- **Endereço**: ASR-SE 75, Alameda 2, Lote 53 - Plano Diretor Sul, Palmas/TO

## 🔧 Configuração do Google Sheets

### Setup Obrigatório
1. **Crie um projeto no Google Cloud Console**
2. **Ative a Google Sheets API**
3. **Crie credenciais de Service Account**
4. **Baixe o arquivo JSON das credenciais**
5. **Compartilhe sua planilha com o email do service account**
6. **Configure as variáveis de ambiente no arquivo .env**

### Estrutura da Planilha
O sistema espera as seguintes abas:
- `matriculas` - Dados das matrículas efetivadas
- `usuarios` - Dados dos usuários/secretárias
- `pendentes` - Matrículas aguardando processamento

## 🎯 Vantagens do Sistema Local

### ✅ **Independência Total**
- Zero dependência de serviços externos
- Funciona offline após configuração inicial
- Controle total sobre os dados

### ⚡ **Performance Superior**
- Resposta instantânea (sem latência de rede)
- Processamento local mais rápido
- Interface mais responsiva

### 💰 **Economia de Custos**
- Sem custos de hosting de backend
- Sem limites de requisições
- Apenas Google Sheets como dependência

### 🔧 **Facilidade de Desenvolvimento**
- Debug mais simples
- Desenvolvimento mais rápido
- Modificações instantâneas

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato através dos canais oficiais da EETAD Núcleo Palmas.
