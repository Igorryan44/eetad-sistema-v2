# 🚀 Script de Deploy para Produção - Sistema EETAD v2

Write-Host "🚀 DEPLOY PARA PRODUÇÃO - SISTEMA EETAD v2" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Verificar se está logado no Supabase
Write-Host "1️⃣ Verificando login no Supabase..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não está logado no Supabase" -ForegroundColor Red
    Write-Host "Execute: supabase login" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ Logado no Supabase" -ForegroundColor Green

# Verificar se está linkado ao projeto
Write-Host ""
Write-Host "2️⃣ Verificando link com o projeto..." -ForegroundColor Yellow
$linkStatus = supabase status 2>&1
if ($linkStatus -match "umkizxftwrwqiiahjbrr") {
    Write-Host "✅ Projeto já está linkado" -ForegroundColor Green
} else {
    Write-Host "🔗 Linkando com o projeto..." -ForegroundColor Yellow
    supabase link --project-ref umkizxftwrwqiiahjbrr
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao linkar projeto" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Projeto linkado com sucesso" -ForegroundColor Green
}

# Deploy das funções principais
Write-Host ""
Write-Host "3️⃣ Fazendo deploy das funções..." -ForegroundColor Yellow

$funcoes = @(
    "manage-secretary-users",
    "get-pending-enrollments", 
    "save-student-registration",
    "finalize-enrollment",
    "check-student-cpf",
    "save-student-personal-data"
)

foreach ($funcao in $funcoes) {
    Write-Host "📦 Deploy: $funcao" -ForegroundColor Cyan
    supabase functions deploy $funcao
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $funcao deployada com sucesso" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erro no deploy de $funcao" -ForegroundColor Yellow
    }
}

# Testar função principal
Write-Host ""
Write-Host "4️⃣ Testando função principal..." -ForegroundColor Yellow
$testResult = curl -X POST "https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/manage-secretary-users" `
    -H "Content-Type: application/json" `
    -d '{"action": "list"}' 2>&1

if ($testResult -match "success") {
    Write-Host "✅ Função manage-secretary-users funcionando" -ForegroundColor Green
} else {
    Write-Host "⚠️ Função pode precisar de configuração adicional" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configurar Google Sheets (se necessário)" -ForegroundColor White
Write-Host "2. Testar o sistema em: http://localhost:3000" -ForegroundColor White
Write-Host "3. Fazer deploy do frontend na Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "- Dashboard Supabase: https://supabase.com/dashboard/project/umkizxftwrwqiiahjbrr" -ForegroundColor White
Write-Host "- Logs das funções: https://supabase.com/dashboard/project/umkizxftwrwqiiahjbrr/functions" -ForegroundColor White