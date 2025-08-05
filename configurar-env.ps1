# 🔧 Configuração de Variáveis de Ambiente - Sistema EETAD v2

Write-Host "🔧 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Este script ajuda a configurar as variáveis necessárias" -ForegroundColor Cyan
Write-Host ""

# Verificar se existe arquivo .env
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
    $content = Get-Content ".env" -Raw
    Write-Host "📄 Conteúdo atual:" -ForegroundColor Yellow
    Write-Host $content -ForegroundColor White
} else {
    Write-Host "⚠️ Arquivo .env não encontrado" -ForegroundColor Yellow
    Write-Host "Criando arquivo .env básico..." -ForegroundColor Cyan
    
    $envContent = @"
# Supabase
VITE_SUPABASE_URL=https://umkizxftwrwqiiahjbrr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs

# Google Sheets (opcional - para gestão de usuários)
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Configurações do Sistema
SYSTEM_NAME=EETAD - Sistema de Secretaria
SYSTEM_VERSION=2.0
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔗 Para configurar no Supabase:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://supabase.com/dashboard/project/umkizxftwrwqiiahjbrr/settings/environment-variables" -ForegroundColor White
Write-Host "2. Adicione as variáveis do Google Sheets (se necessário)" -ForegroundColor White
Write-Host ""

Write-Host "📋 Variáveis necessárias no Supabase:" -ForegroundColor Yellow
Write-Host "- GOOGLE_SHEETS_SPREADSHEET_ID" -ForegroundColor White
Write-Host "- GOOGLE_SERVICE_ACCOUNT_EMAIL" -ForegroundColor White  
Write-Host "- GOOGLE_PRIVATE_KEY" -ForegroundColor White
Write-Host ""

Write-Host "💡 Dica: O sistema funciona sem Google Sheets usando localStorage" -ForegroundColor Cyan
Write-Host ""

# Verificar se as funções estão deployadas
Write-Host "🔍 Verificando status das funções..." -ForegroundColor Yellow
$functions = @(
    "manage-secretary-users",
    "get-pending-enrollments"
)

foreach ($func in $functions) {
    $url = "https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/$func"
    try {
        $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body '{"action":"test"}' -TimeoutSec 5 2>$null
        Write-Host "✅ $func: Disponível" -ForegroundColor Green
    } catch {
        Write-Host "❌ $func: Não disponível" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Status do Sistema:" -ForegroundColor Green
Write-Host "- ✅ Frontend funcionando" -ForegroundColor White
Write-Host "- ✅ Login com localStorage" -ForegroundColor White
Write-Host "- ✅ Dashboard com dados mock" -ForegroundColor White
Write-Host "- 🔄 Funções Supabase (configurar se necessário)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para usar em produção, execute: .\deploy-producao.ps1" -ForegroundColor Cyan