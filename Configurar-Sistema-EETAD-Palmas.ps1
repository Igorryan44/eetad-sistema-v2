# Script para Colaboracao com Sistema-eetad-Palmas
# Repositorio: https://github.com/simiao2025/Sistema-eetad-Palmas.git

$REPO_DESTINO = "https://github.com/simiao2025/Sistema-eetad-Palmas.git"
$NOME_REPO = "Sistema-eetad-Palmas"

Write-Host "Configurador de Colaboracao - Sistema EETAD Palmas" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host ""
Write-Host "Repositorio de destino: $REPO_DESTINO"
Write-Host "Proprietario: simiao2025"
Write-Host ""
Write-Host "Escolha como deseja colaborar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Colaborador Direto (se voce foi adicionado como colaborador)"
Write-Host "2. Fork + Pull Request (recomendado para contribuicoes)"
Write-Host "3. Verificar Acesso (testar permissoes)"
Write-Host "4. Ver Configuracao Atual"
Write-Host ""

$choice = Read-Host "Escolha uma opcao (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Configurando como Colaborador Direto..." -ForegroundColor Green
        
        Write-Host "VERIFICACAO IMPORTANTE:" -ForegroundColor Yellow
        Write-Host "Voce precisa ter sido adicionado como colaborador pelo usuario 'simiao2025'"
        Write-Host "Se nao tiver permissao, o push falhara com erro 403."
        Write-Host ""
        
        $confirmar = Read-Host "Tem certeza que tem permissao de colaborador? (s/n)"
        
        if ($confirmar -eq "s") {
            Write-Host "Configurando remote..."
            
            # Backup do remote atual
            $currentRemote = git remote get-url origin 2>$null
            if ($currentRemote) {
                Write-Host "Backup do remote atual: $currentRemote"
            }
            
            # Remover e reconfigurar remote
            try {
                git remote remove origin 2>$null
                Write-Host "Remote 'origin' removido"
            } catch {
                Write-Host "Nenhum remote 'origin' para remover"
            }
            
            # Adicionar novo remote
            git remote add origin $REPO_DESTINO
            Write-Host "Adicionado: $REPO_DESTINO"
            
            # Verificar se ha commits para enviar
            $hasCommits = git log --oneline 2>$null
            if ($hasCommits) {
                Write-Host ""
                Write-Host "Fazendo push para o repositorio..."
                try {
                    git push -u origin main
                    Write-Host ""
                    Write-Host "Sucesso! Codigo enviado para Sistema-eetad-Palmas" -ForegroundColor Green
                    Write-Host "Acesse: https://github.com/simiao2025/Sistema-eetad-Palmas"
                } catch {
                    Write-Host ""
                    Write-Host "Erro no push!" -ForegroundColor Red
                    Write-Host "Possiveis causas:"
                    Write-Host "- Voce nao tem permissao de colaborador"
                    Write-Host "- Problemas de autenticacao"
                    Write-Host "- Conflitos no repositorio"
                    Write-Host ""
                    Write-Host "Sugestao: Tente a opcao 2 (Fork + Pull Request)"
                    
                    # Restaurar remote anterior se existir
                    if ($currentRemote) {
                        git remote remove origin 2>$null
                        git remote add origin $currentRemote
                        Write-Host "Remote anterior restaurado"
                    }
                }
            } else {
                Write-Host "Nenhum commit encontrado para enviar"
            }
        } else {
            Write-Host "Operacao cancelada." -ForegroundColor Red
        }
    }
    "2" {
        Write-Host ""
        Write-Host "Configurando Fork + Pull Request..." -ForegroundColor Green
        
        $seuUsuario = Read-Host "Digite seu usuario GitHub"
        $seuFork = "https://github.com/$seuUsuario/$NOME_REPO.git"
        
        Write-Host ""
        Write-Host "Instrucoes para Fork:" -ForegroundColor Cyan
        Write-Host "1. Acesse: https://github.com/simiao2025/Sistema-eetad-Palmas"
        Write-Host "2. Clique no botao 'Fork' (canto superior direito)"
        Write-Host "3. Isso criara uma copia em: https://github.com/$seuUsuario/$NOME_REPO"
        Write-Host ""
        
        $abrirBrowser = Read-Host "Deseja abrir o repositorio no navegador para fazer fork? (s/n)"
        if ($abrirBrowser -eq "s") {
            Start-Process "https://github.com/simiao2025/Sistema-eetad-Palmas"
        }
        
        Write-Host ""
        $forkFeito = Read-Host "Voce ja fez o fork? (s/n)"
        
        if ($forkFeito -eq "s") {
            Write-Host "Configurando remotes para fork..."
            
            # Remover remote atual
            try {
                git remote remove origin 2>$null
                git remote remove upstream 2>$null
                Write-Host "Remotes anteriores removidos"
            } catch {
                Write-Host "Nenhum remote anterior para remover"
            }
            
            # Configurar fork
            git remote add origin $seuFork
            git remote add upstream $REPO_DESTINO
            Write-Host "Fork configurado como 'origin'"
            Write-Host "Repositorio original configurado como 'upstream'"
            
            # Push para fork
            Write-Host ""
            Write-Host "Enviando codigo para seu fork..."
            try {
                git push -u origin main
                Write-Host ""
                Write-Host "Codigo enviado para seu fork!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Proximos passos para Pull Request:"
                Write-Host "1. Acesse: https://github.com/$seuUsuario/$NOME_REPO"
                Write-Host "2. Clique em 'Compare & pull request'"
                Write-Host "3. Adicione titulo e descricao das mudancas"
                Write-Host "4. Clique em 'Create pull request'"
                Write-Host ""
                
                $abrirFork = Read-Host "Deseja abrir seu fork no navegador? (s/n)"
                if ($abrirFork -eq "s") {
                    Start-Process "https://github.com/$seuUsuario/$NOME_REPO"
                }
            } catch {
                Write-Host ""
                Write-Host "Erro ao enviar para o fork!" -ForegroundColor Red
                Write-Host "Verifique se o fork foi criado corretamente."
            }
        } else {
            Write-Host "Faca o fork primeiro e execute o script novamente." -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "Verificando Acesso..." -ForegroundColor Green
        
        Write-Host "Testando acesso ao repositorio..."
        try {
            # Tentar fazer um dry-run push
            git ls-remote $REPO_DESTINO HEAD 2>$null
            Write-Host "Repositorio acessivel para leitura"
            
            # Configurar temporariamente para testar push
            $tempRemote = "temp-test-" + (Get-Random)
            git remote add $tempRemote $REPO_DESTINO 2>$null
            
            try {
                git push --dry-run $tempRemote main 2>$null
                Write-Host "Voce tem permissao de escrita (colaborador)" -ForegroundColor Green
                Write-Host "Pode usar a opcao 1 (Colaborador Direto)"
            } catch {
                Write-Host "Sem permissao de escrita" -ForegroundColor Yellow
                Write-Host "Use a opcao 2 (Fork + Pull Request)"
            } finally {
                git remote remove $tempRemote 2>$null
            }
        } catch {
            Write-Host "Erro ao acessar repositorio" -ForegroundColor Red
            Write-Host "Verifique se a URL esta correta e se voce tem acesso a internet"
        }
    }
    "4" {
        Write-Host ""
        Write-Host "Configuracao Atual:" -ForegroundColor Green
        Write-Host ""
        Write-Host "Remotes:"
        git remote -v
        Write-Host ""
        Write-Host "Branch atual:"
        git branch --show-current
        Write-Host ""
        Write-Host "Status:"
        git status --short
        Write-Host ""
        Write-Host "Ultimos commits:"
        git log --oneline -5
    }
    default {
        Write-Host "Opcao invalida!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Documentacao:" -ForegroundColor Cyan
Write-Host "- COLABORACAO-REPOSITORIO.md - Guia completo"
Write-Host "- Configurar-Colaboracao.ps1 - Script generico"
Write-Host ""
Write-Host "Repositorio de destino: Sistema-eetad-Palmas"
Write-Host "Proprietario: simiao2025"

# Manter janela aberta
Read-Host "Pressione ENTER para sair"