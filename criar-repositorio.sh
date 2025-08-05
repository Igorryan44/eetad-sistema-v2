#!/bin/bash

# 🚀 Script para Criar Repositório no GitHub
# Autor: simacjr@hotmail.com

echo "🚀 Assistente de Criação de Repositório GitHub"
echo "==========================================="
echo ""

# Configurações
REPO_NAME="eetad-sistema-matricula"
REPO_DESC="Sistema de Matrícula EETAD - Núcleo Palmas"
REPO_VISIBILITY="public"

echo "📋 Configurações do Repositório:"
echo "Nome: $REPO_NAME"
echo "Descrição: $REPO_DESC"
echo "Visibilidade: $REPO_VISIBILITY"
echo ""

echo "🔧 Opções de Criação:"
echo "1) Criar via GitHub Web (Recomendado)"
echo "2) Criar via GitHub CLI (Requer gh instalado)"
echo "3) Criar via curl (API GitHub)"
echo ""

read -p "Escolha uma opção (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Instruções para Criar via GitHub Web:"
        echo "1. Acesse: https://github.com/new"
        echo "2. Preencha os campos:"
        echo "   - Repository name: $REPO_NAME"
        echo "   - Description: $REPO_DESC"
        echo "   - Visibilidade: $REPO_VISIBILITY"
        echo "   - NÃO marque 'Initialize this repository with a README'"
        echo "3. Clique em 'Create repository'"
        echo "4. Siga as instruções na tela para push do código existente:"
        echo ""
        echo "   git remote add origin https://github.com/SEU_USUARIO/$REPO_NAME.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
        echo ""
        echo "Substitua 'SEU_USUARIO' pelo seu nome de usuário GitHub."
        ;;
    2)
        echo ""
        echo "⚙️ Criando via GitHub CLI..."
        if ! command -v gh &> /dev/null; then
            echo "❌ GitHub CLI (gh) não está instalado."
            echo "Instale-o primeiro: https://cli.github.com/"
            exit 1
        fi
        
        echo "Executando: gh auth login (se necessário)"
        gh auth status || gh auth login
        
        echo "Criando repositório: $REPO_NAME"
        gh repo create "$REPO_NAME" --description "$REPO_DESC" --$REPO_VISIBILITY
        
        echo "Configurando remote e fazendo push:"
        git remote add origin "https://github.com/$(gh api user | jq -r .login)/$REPO_NAME.git"
        git branch -M main
        git push -u origin main
        ;;
    3)
        echo ""
        echo "🔑 Criando via API GitHub (curl)..."
        echo "Você precisará de um token de acesso pessoal do GitHub."
        echo "Obtenha um em: https://github.com/settings/tokens"
        echo ""
        read -p "Digite seu token de acesso pessoal: " token
        read -p "Digite seu nome de usuário GitHub: " username
        
        echo "Criando repositório via API..."
        curl -X POST \
          -H "Authorization: token $token" \
          -H "Accept: application/vnd.github.v3+json" \
          https://api.github.com/user/repos \
          -d '{"name":"'"$REPO_NAME"'","description":"'"$REPO_DESC"'","private":false}'
        
        echo "Configurando remote e fazendo push:"
        git remote add origin "https://github.com/$username/$REPO_NAME.git"
        git branch -M main
        git push -u origin main
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "✅ Processo concluído!"
echo "Verifique seu repositório em: https://github.com/SEU_USUARIO/$REPO_NAME"
echo "Substitua 'SEU_USUARIO' pelo seu nome de usuário GitHub."
echo ""
echo "🎉 Seu código está agora no GitHub!"