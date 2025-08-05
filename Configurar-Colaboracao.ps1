# 🤝 Script de Configuração para Colaboração em Repositório
# Autor: simacjr@hotmail.com

Write-Host "🤝 Assistente de Colaboração em Repositório GitHub" -ForegroundColor Cyan
Write-Host "=================================================="
Write-Host ""

# Verificar status atual do Git
Write-Host "📋 Status Atual do Git:" -ForegroundColor Yellow
git remote -v
git status --porcelain
Write-Host ""

Write-Host "🔧 Tipos de Colaboração:" -ForegroundColor Yellow
Write-Host "1) Fork + Pull Request (Recomendado para contribuições)"
Write-Host "2) Colaborador Direto (Requer permissão do dono)"
Write-Host "3) Transferir Propriedade (Move o repositório)"
Write-Host "4) Apenas visualizar configuração atual"
Write-Host ""

$choice = Read-Host "Escolha uma opção (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🍴 Configurando para Fork + Pull Request..." -ForegroundColor Green
        
        $repoOriginal = Read-Host "URL do repositório original (ex: https://github.com/usuario/repo.git)"
        $seuUsuario = Read-Host "Seu usuário GitHub"
        
        # Extrair nome do repositório da URL
        $repoNome = ($repoOriginal -split "/")[-1] -replace "\.git$", ""
        $seuFork = "https://github.com/$seuUsuario/$repoNome.git"
        
        Write-Host ""
        Write-Host "📝 Instruções:" -ForegroundColor Cyan
        Write-Host "1. Primeiro, faça fork do repositório original no GitHub:"
        Write-Host "   - Acesse: $($repoOriginal -replace '\.git$', '')"
        Write-Host "   - Clique em 'Fork'"
        Write-Host ""
        
        $forkFeito = Read-Host "Você já fez o fork? (s/n)"
        
        if ($forkFeito -eq "s") {
            Write-Host "Configurando remotes..."
            
            # Remover remote atual se existir
            try {
                git remote remove origin 2>$null
                Write-Host "✅ Remote 'origin' removido"
            } catch {
                Write-Host "ℹ️ Nenhum remote 'origin' para remover"
            }
            
            # Adicionar seu fork como origin
            git remote add origin $seuFork
            Write-Host "✅ Adicionado seu fork como 'origin'"
            
            # Adicionar repositório original como upstream
            git remote add upstream $repoOriginal
            Write-Host "✅ Adicionado repositório original como 'upstream'"
            
            # Push para seu fork
            Write-Host "Fazendo push para seu fork..."
            git push -u origin main
            
            Write-Host ""
            Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
            Write-Host "Próximos passos:"
            Write-Host "1. Acesse: $($seuFork -replace '\.git$', '')"
            Write-Host "2. Clique em 'Compare & pull request'"
            Write-Host "3. Adicione descrição e crie o pull request"
        } else {
            Write-Host "❌ Faça o fork primeiro e execute o script novamente." -ForegroundColor Red
        }
    }
    "2" {
        Write-Host ""
        Write-Host "👥 Configurando para Colaboração Direta..." -ForegroundColor Green
        
        $repoColaboracao = Read-Host "URL do repositório de colaboração (ex: https://github.com/usuario/repo.git)"
        
        Write-Host ""
        Write-Host "⚠️ ATENÇÃO:" -ForegroundColor Yellow
        Write-Host "Você precisa ter permissão de colaborador neste repositório."
        Write-Host "Se não tiver, o push falhará com erro 403."
        Write-Host ""
        
        $confirmar = Read-Host "Tem certeza que tem permissão de colaborador? (s/n)"
        
        if ($confirmar -eq "s") {
            # Remover remote atual
            try {
                git remote remove origin 2>$null
                Write-Host "✅ Remote 'origin' removido"
            } catch {
                Write-Host "ℹ️ Nenhum remote 'origin' para remover"
            }
            
            # Adicionar repositório de colaboração
            git remote add origin $repoColaboracao
            Write-Host "✅ Adicionado repositório de colaboração como 'origin'"
            
            # Push direto
            Write-Host "Fazendo push direto..."
            try {
                git push -u origin main
                Write-Host ""
                Write-Host "🎉 Código enviado com sucesso!" -ForegroundColor Green
            } catch {
                Write-Host ""
                Write-Host "❌ Erro no push. Possíveis causas:" -ForegroundColor Red
                Write-Host "- Você não tem permissão de colaborador"
                Write-Host "- Repositório não existe"
                Write-Host "- Problemas de autenticação"
                Write-Host ""
                Write-Host "💡 Sugestão: Tente a opção 1 (Fork + Pull Request)"
            }
        } else {
            Write-Host "❌ Operação cancelada. Use a opção 1 para fork." -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "🔄 Transferir Propriedade do Repositório..." -ForegroundColor Green
        
        $usuarioDestino = Read-Host "Usuário de destino"
        $nomeRepo = Read-Host "Nome do repositório atual"
        
        Write-Host ""
        Write-Host "📝 Instruções para Transferência:" -ForegroundColor Cyan
        Write-Host "1. Acesse: https://github.com/SEU_USUARIO/$nomeRepo/settings"
        Write-Host "2. Role até 'Danger Zone'"
        Write-Host "3. Clique em 'Transfer ownership'"
        Write-Host "4. Digite: $usuarioDestino"
        Write-Host "5. Confirme a transferência"
        Write-Host ""
        Write-Host "⚠️ ATENÇÃO: Esta ação é irreversível!" -ForegroundColor Yellow
        
        $abrirBrowser = Read-Host "Deseja abrir o navegador na página de configurações? (s/n)"
        if ($abrirBrowser -eq "s") {
            Start-Process "https://github.com/settings/repositories"
        }
    }
    "4" {
        Write-Host ""
        Write-Host "📊 Configuração Atual:" -ForegroundColor Green
        Write-Host ""
        Write-Host "Remotes configurados:"
        git remote -v
        Write-Host ""
        Write-Host "Status do repositório:"
        git status
        Write-Host ""
        Write-Host "Últimos commits:"
        git log --oneline -5
    }
    default {
        Write-Host "❌ Opção inválida!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📚 Documentação disponível:" -ForegroundColor Cyan
Write-Host "- COLABORACAO-REPOSITORIO.md - Guia completo"
Write-Host "- GITHUB-SETUP.md - Configuração básica do GitHub"
Write-Host ""

# Manter a janela aberta
Read-Host "Pressione ENTER para sair"