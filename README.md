# 🎓 Sistema EETAD Palmas - Matrícula e Gestão Acadêmica

Sistema completo de matrícula e gestão acadêmica para a **Escola de Educação Teológica das Assembleias de Deus (EETAD)** - Núcleo Palmas, Tocantins.

## 📋 Sobre o Projeto

Sistema desenvolvido para gerenciar matrículas e pedidos de livros dos alunos da EETAD, integrado com:
- **Ministério**: Assembléia de Deus Ministério Missão - PRV
- **Pagamentos**: MercadoPago (PIX)
- **Notificações**: WhatsApp e Email
- **Banco de Dados**: Supabase

## 🌐 Repositório

**GitHub**: https://github.com/Igorryan44/eetad-sistema-matricula

## 📁 Estrutura do Projeto

### Frontend (React + Vite)
- **`src/components/`** - Componentes React (Header, Footer, Forms)
- **`src/pages/`** - Páginas principais do sistema
- **`src/integrations/`** - Integrações com Supabase
- **`index.html`** - Página principal
- **`package.json`** - Dependências do projeto React

### Backend/Webhooks
- **`webhooks/`** - Webhooks do WhatsApp (Deno)
- **`supabase/functions/`** - Edge Functions do Supabase
  - Processamento de pagamentos
  - Notificações automáticas
  - Validação de CPF
  - Chatbot IA

### Configuração e Deploy
- **Scripts PowerShell** - Automação de configuração
- **Documentação** - Guias de implantação e configuração
- **`vercel.json`** - Configuração para deploy na Vercel

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ instalado
- Conta no Supabase
- Conta no MercadoPago (para pagamentos)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Igorryan44/eetad-sistema-matricula.git

# 2. Navegue para o diretório
cd eetad-sistema-matricula

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
VITE_MERCADOPAGO_PUBLIC_KEY=sua_chave_publica_mercadopago
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Pagamentos**: MercadoPago API
- **Notificações**: WhatsApp Business API, EmailJS
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

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato através dos canais oficiais da EETAD Núcleo Palmas.
