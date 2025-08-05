# 🎓 Sistema EETAD v2 - Matrícula e Gestão Acadêmica

**🚀 VERSÃO 2.0 - SISTEMA APRIMORADO**

Sistema completo de matrícula e gestão acadêmica para a **Escola de Educação Teológica das Assembleias de Deus (EETAD)** - Núcleo Palmas, Tocantins.

## 📋 Sobre o Projeto v2

Sistema desenvolvido para gerenciar matrículas e pedidos de livros dos alunos da EETAD, integrado com:
- **Ministério**: Assembléia de Deus Ministério Missão - PRV
- **Pagamentos**: MercadoPago (PIX)
- **Notificações**: WhatsApp e Email
- **Banco de Dados**: Supabase

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
# 1. Clone o repositório v2
git clone https://github.com/Igorryan44/eetad-sistema-v2.git

# 2. Navegue para o diretório
cd eetad-sistema-v2

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
