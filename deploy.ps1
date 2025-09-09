# Script de Deploy Automatizado - EETAD Sistema v2
# Execute este script no PowerShell para fazer deploy automático

Write-Host "🚀 Iniciando Deploy do EETAD Sistema v2..." -ForegroundColor Green

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

# 1. Verificar se o Git está configurado
Write-Host "📋 Verificando configuração do Git..." -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️  Há alterações não commitadas:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Gray
        
        $commit = Read-Host "Deseja fazer commit das alterações? (s/n)"
        if ($commit -eq "s" -or $commit -eq "S") {
            $message = Read-Host "Digite a mensagem do commit"
            if (-not $message) {
                $message = "Deploy automático - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            }
            git add .
            git commit -m $message
            Write-Host "✅ Commit realizado: $message" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "❌ Erro ao verificar Git: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Fazer push para o repositório
Write-Host "📤 Fazendo push para o repositório..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "✅ Push realizado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao fazer push: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Build do projeto
Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build realizado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no build: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Verificar se o build foi criado
if (-not (Test-Path "dist")) {
    Write-Host "❌ Erro: Pasta 'dist' não foi criada" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build verificado - pasta 'dist' criada" -ForegroundColor Green

# 5. Instruções finais
Write-Host "`n🎉 Deploy preparado com sucesso!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://vercel.com" -ForegroundColor White
Write-Host "2. Conecte sua conta GitHub" -ForegroundColor White
Write-Host "3. Import Project > Selecione este repositório" -ForegroundColor White
Write-Host "4. Framework: Vite" -ForegroundColor White
Write-Host "5. Build Command: npm run build" -ForegroundColor White
Write-Host "6. Output Directory: dist" -ForegroundColor White
Write-Host "7. Configure as variáveis de ambiente (veja DEPLOY_GUIDE.md)" -ForegroundColor White
Write-Host "8. Deploy!" -ForegroundColor White

Write-Host "`n📖 Para instruções detalhadas, consulte: DEPLOY_GUIDE.md" -ForegroundColor Yellow
Write-Host "`nSeu sistema estara online em poucos minutos!" -ForegroundColor Green
