# 📋 Configuração da Aba "usuarios" na Planilha

## 🎯 Objetivo
Criar uma aba "usuarios" na planilha "controle alunos" para armazenar informações de cadastro de usuários da secretaria.

## 📊 Estrutura da Aba "usuarios"

### Colunas necessárias (A até H):

| Coluna | Campo | Descrição | Exemplo |
|--------|-------|-----------|---------|
| A | ID | Identificador único | 1 |
| B | Username | Nome de usuário | Admin |
| C | Email | Email do usuário | admin@eetad.com |
| D | Full Name | Nome completo | Administrador |
| E | Password Hash | Senha criptografada | a1b2c3d4 |
| F | Created At | Data de criação | 2024-01-15T10:30:00.000Z |
| G | Last Login | Último login | 2024-01-15T14:20:00.000Z |
| H | Status | Status do usuário | ATIVO |

### 📝 Cabeçalho da Planilha (Linha 1):
```
ID | Username | Email | Full Name | Password Hash | Created At | Last Login | Status
```

## 👤 Usuário Padrão
Para criar o usuário padrão manualmente na planilha:

| Campo | Valor |
|-------|-------|
| ID | 1 |
| Username | Admin |
| Email | admin@eetad.com |
| Full Name | Administrador |
| Password Hash | a1b2c3d4 |
| Created At | 2024-01-15T10:00:00.000Z |
| Last Login | (deixar vazio) |
| Status | ATIVO |

> **Nota**: O hash `a1b2c3d4` corresponde à senha `admin1`

## 🔧 Passos para Configuração

### 1. Abrir a Planilha
- Acesse a planilha "controle alunos" no Google Sheets

### 2. Criar Nova Aba
- Clique no botão "+" no canto inferior esquerdo
- Nomeie a aba como "usuarios"

### 3. Configurar Cabeçalhos
- Na linha 1, adicione os cabeçalhos conforme a tabela acima
- Formate os cabeçalhos em negrito

### 4. Adicionar Usuário Padrão
- Na linha 2, adicione os dados do usuário padrão conforme a tabela acima

### 5. Configurar Formatação
- Coluna A (ID): Formato numérico
- Colunas F e G (datas): Formato de data/hora ISO
- Demais colunas: Formato texto

## 🚀 Ativação do Sistema

### Opção 1: Sistema Híbrido (Atual)
O sistema atual funciona com fallback para localStorage:
- Se a função Supabase estiver disponível, usa Google Sheets
- Se não estiver, usa localStorage temporariamente

### Opção 2: Apenas Google Sheets
Para usar apenas Google Sheets:
1. Configure a aba conforme instruções acima
2. Deploy da função `manage-secretary-users` no Supabase
3. Configure as variáveis de ambiente do Google Sheets

## 🔍 Verificação

### Testar Login
1. Acesse `/secretaria`
2. Use as credenciais:
   - **Usuário**: Admin
   - **Senha**: admin1

### Logs do Console
O sistema mostra logs detalhados:
- ✅ Login bem-sucedido
- ⚠️ Fallback para localStorage (se Supabase não disponível)
- 🔐 Tentativas de login

## 📋 Checklist de Configuração

- [ ] Aba "usuarios" criada na planilha
- [ ] Cabeçalhos configurados (colunas A-H)
- [ ] Usuário padrão adicionado
- [ ] Formatação aplicada
- [ ] Teste de login realizado
- [ ] Sistema funcionando (localStorage ou Google Sheets)

## 🔧 Próximos Passos

1. **Configurar Google Sheets**: Deploy da função Supabase
2. **Migração de Dados**: Mover dados do localStorage para Google Sheets
3. **Gestão de Usuários**: Interface para criar/editar usuários
4. **Backup**: Sistema de backup dos dados de usuários

## 📞 Suporte

Se houver problemas:
1. Verifique os logs do console do navegador
2. Confirme se a aba "usuarios" está configurada corretamente
3. Teste com as credenciais padrão: Admin/admin1