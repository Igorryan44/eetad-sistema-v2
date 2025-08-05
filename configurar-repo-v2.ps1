# 🚀 Script para Configurar Repositório EETAD Sistema v2
# Execute após criar o repositório no GitHub

Write-Host "🚀 Configurando Repositório EETAD Sistema v2" -ForegroundColor Cyan
Write-Host "============================================="
Write-Host ""

# Solicitar nome de usuário
$username = Read-Host "Digite seu nome de usuário do GitHub"

Write-Host ""
Write-Host "🔧 Configurando remote para repositório v2..." -ForegroundColor Yellow

# Configurar remote
git remote add origin "https://github.com/$username/eetad-sistema-v2.git"

Write-Host "✅ Remote configurado: https://github.com/$username/eetad-sistema-v2.git" -ForegroundColor Green

# Verificar branch atual
$currentBranch = git branch --show-current
Write-Host "📋 Branch atual: $currentBranch" -ForegroundColor Yellow

# Renomear para main se necessário
if ($currentBranch -ne "main") {
    Write-Host "🔄 Renomeando branch para 'main'..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✅ Branch renomeada para 'main'" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Fazendo push para o repositório v2..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "🎉 REPOSITÓRIO V2 CONFIGURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "🔗 Acesse: https://github.com/$username/eetad-sistema-v2" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Funcionalidades da v2 incluídas:" -ForegroundColor Yellow
Write-Host "   - Campo Subnúcleo" -ForegroundColor White
Write-Host "   - Campo Status (Ativo, Inativo, Pendente, Concluído)" -ForegroundColor White
Write-Host "   - Remoção de dados fictícios" -ForegroundColor White
Write-Host "   - Estilos harmonizados" -ForegroundColor White
Write-Host "   - Configuração otimizada" -ForegroundColor White
Write-Host ""

Read-Host "Pressione ENTER para sair"