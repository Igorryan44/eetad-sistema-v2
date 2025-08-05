# 🚀 Script para Criar Repositório no GitHub (PowerShell)
# Autor: simacjr@hotmail.com

Write-Host "🚀 Assistente de Criação de Repositório GitHub" -ForegroundColor Cyan
Write-Host "==========================================="
Write-Host ""

# Configurações
$REPO_NAME = "eetad-sistema-matricula"
$REPO_DESC = "Sistema de Matrícula EETAD - Núcleo Palmas"
$REPO_VISIBILITY = "public"

Write-Host "📋 Configurações do Repositório:" -ForegroundColor Yellow
Write-Host "Nome: $REPO_NAME"
Write-Host "Descrição: $REPO_DESC"
Write-Host "Visibilidade: $REPO_VISIBILITY"
Write-Host ""

Write-Host "🔧 Opções de Criação:" -ForegroundColor Yellow
Write-Host "1) Criar via GitHub Web (Recomendado)"
Write-Host "2) Criar via GitHub CLI (Requer gh instalado)"
Write-Host "3) Criar via API GitHub (Requer curl)"
Write-Host ""

$choice = Read-Host "Escolha uma opção (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Instruções para Criar via GitHub Web:" -ForegroundColor Green
        Write-Host "1. Acesse: https://github.com/new"
        Write-Host "2. Preencha os campos:"
        Write-Host "   - Repository name: $REPO_NAME"
        Write-Host "   - Description: $REPO_DESC"
        Write-Host "   - Visibilidade: $REPO_VISIBILITY"
        Write-Host "   - NÃO marque 'Initialize this repository with a README'"
        Write-Host "3. Clique em 'Create repository'"
        Write-Host "4. Siga as instruções na tela para push do código existente:"
        Write-Host ""
        Write-Host "   git remote add origin https://github.com/SEU_USUARIO/$REPO_NAME.git" -ForegroundColor Magenta
        Write-Host "   git branch -M main" -ForegroundColor Magenta
        Write-Host "   git push -u origin main" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "Substitua 'SEU_USUARIO' pelo seu nome de usuário GitHub."
        
        # Abrir navegador automaticamente
        $openBrowser = Read-Host "Deseja abrir o navegador na página de criação? (s/n)"
        if ($openBrowser -eq "s") {
            Start-Process "https://github.com/new"
        }
    }
    "2" {
        Write-Host ""
        Write-Host "⚙️ Criando via GitHub CLI..." -ForegroundColor Green
        
        # Verificar se o GitHub CLI está instalado
        $ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
        if (-not $ghInstalled) {
            Write-Host "❌ GitHub CLI (gh) não está instalado." -ForegroundColor Red
            Write-Host "Instale-o primeiro: https://cli.github.com/"
            exit 1
        }
        
        Write-Host "Executando: gh auth login (se necessário)"
        gh auth status
        if ($LASTEXITCODE -ne 0) {
            gh auth login
        }
        
        Write-Host "Criando repositório: $REPO_NAME"
        gh repo create "$REPO_NAME" --description "$REPO_DESC" --$REPO_VISIBILITY
        
        Write-Host "Configurando remote e fazendo push:"
        $username = gh api user | ConvertFrom-Json | Select-Object -ExpandProperty login
        git remote add origin "https://github.com/$username/$REPO_NAME.git"
        git branch -M main
        git push -u origin main
    }
    "3" {
        Write-Host ""
        Write-Host "🔑 Criando via API GitHub..." -ForegroundColor Green
        Write-Host "Você precisará de um token de acesso pessoal do GitHub."
        Write-Host "Obtenha um em: https://github.com/settings/tokens"
        Write-Host ""
        
        $token = Read-Host "Digite seu token de acesso pessoal"
        $username = Read-Host "Digite seu nome de usuário GitHub"
        
        Write-Host "Criando repositório via API..."
        $body = @{
            name = $REPO_NAME
            description = $REPO_DESC
            private = $false
        } | ConvertTo-Json
        
        $headers = @{
            Authorization = "token $token"
            Accept = "application/vnd.github.v3+json"
        }
        
        Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Body $body -Headers $headers -ContentType "application/json"
        
        Write-Host "Configurando remote e fazendo push:"
        git remote add origin "https://github.com/$username/$REPO_NAME.git"
        git branch -M main
        git push -u origin main
    }
    default {
        Write-Host "❌ Opção inválida!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "Verifique seu repositório em: https://github.com/SEU_USUARIO/$REPO_NAME"
Write-Host "Substitua 'SEU_USUARIO' pelo seu nome de usuário GitHub."
Write-Host ""
Write-Host "🎉 Seu código está agora no GitHub!" -ForegroundColor Cyan

# Manter a janela aberta
Read-Host "Pressione ENTER para sair"