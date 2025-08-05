# 🤝 Colaboração em Repositório de Outro Usuário

## 📋 Cenários Possíveis

### 1. **Você tem Acesso de Colaborador**
Se o dono do repositório te adicionou como colaborador:

```bash
# Remover remote atual (se existir)
git remote remove origin

# Adicionar o repositório do outro usuário
git remote add origin https://github.com/USUARIO_DONO/NOME_REPOSITORIO.git

# Fazer push
git push -u origin main
```

### 2. **Fork + Pull Request (Recomendado)**
Esta é a forma mais comum de contribuir:

#### Passo 1: Fazer Fork
1. Acesse o repositório do outro usuário no GitHub
2. Clique em "Fork" no canto superior direito
3. Isso criará uma cópia no seu perfil

#### Passo 2: Configurar Remote
```bash
# Remover remote atual
git remote remove origin

# Adicionar seu fork como origin
git remote add origin https://github.com/SEU_USUARIO/NOME_REPOSITORIO.git

# Adicionar o repositório original como upstream
git remote add upstream https://github.com/USUARIO_DONO/NOME_REPOSITORIO.git

# Fazer push para seu fork
git push -u origin main
```

#### Passo 3: Criar Pull Request
1. Vá para seu fork no GitHub
2. Clique em "Compare & pull request"
3. Adicione descrição das mudanças
4. Clique em "Create pull request"

### 3. **Transferir Propriedade do Repositório**
Se você quer transferir o repositório para outro usuário:

1. **Via GitHub Web:**
   - Vá para Settings do repositório
   - Role até "Danger Zone"
   - Clique em "Transfer ownership"
   - Digite o nome do usuário destinatário

2. **Via GitHub CLI:**
   ```bash
   gh repo transfer NOME_REPOSITORIO USUARIO_DESTINO
   ```

## 🔧 Scripts Automatizados

### Script para Fork + Colaboração
```powershell
# Configurar para colaboração via fork
$REPO_ORIGINAL = "https://github.com/USUARIO_DONO/NOME_REPOSITORIO.git"
$SEU_FORK = "https://github.com/SEU_USUARIO/NOME_REPOSITORIO.git"

# Remover remote atual
git remote remove origin

# Configurar remotes
git remote add origin $SEU_FORK
git remote add upstream $REPO_ORIGINAL

# Push para seu fork
git push -u origin main

Write-Host "✅ Configurado para colaboração via fork!"
Write-Host "Agora você pode criar um Pull Request no GitHub"
```

### Script para Colaborador Direto
```powershell
# Configurar para colaboração direta
$REPO_COLABORACAO = "https://github.com/USUARIO_DONO/NOME_REPOSITORIO.git"

# Remover remote atual
git remote remove origin

# Adicionar repositório de colaboração
git remote add origin $REPO_COLABORACAO

# Push direto (requer permissão)
git push -u origin main

Write-Host "✅ Código enviado para repositório de colaboração!"
```

## 📝 Informações Necessárias

Para te ajudar melhor, preciso saber:

1. **Qual é o repositório de destino?**
   - URL completa: `https://github.com/USUARIO/REPOSITORIO`

2. **Qual é a sua relação com o repositório?**
   - [ ] Sou colaborador (tenho acesso direto)
   - [ ] Quero fazer fork e pull request
   - [ ] Quero transferir a propriedade
   - [ ] Outro cenário

3. **Qual é o seu usuário GitHub?**
   - Para configurar corretamente os remotes

## ⚠️ Considerações Importantes

- **Fork + PR** é mais seguro e permite revisão
- **Colaboração direta** requer permissões específicas
- **Transferência** move completamente o repositório
- Sempre faça backup antes de mudanças importantes

## 🆘 Solução de Problemas

### Erro de Permissão (403)
```bash
# Verificar se você tem acesso
git remote -v
git push --dry-run
```

### Conflitos de Merge
```bash
# Sincronizar com repositório original
git fetch upstream
git merge upstream/main
```

### Verificar Status
```bash
# Ver configuração atual
git remote -v
git status
git log --oneline -5
```

---

**💡 Dica:** Se você não tem certeza sobre as permissões, sempre comece com um fork. É mais seguro e permite colaboração organizada!