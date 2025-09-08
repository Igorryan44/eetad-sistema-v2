/**
 * 🔧 Função: update-env-config
 * Atualiza configurações no arquivo .env quando salvos via menu
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Função para atualizar uma linha específica no arquivo .env
function updateEnvFile(key, value) {
  try {
    const envPath = path.join(process.cwd(), '..', '.env');
    
    if (!fs.existsSync(envPath)) {
      console.error('❌ Arquivo .env não encontrado:', envPath);
      return false;
    }
    
    // Ler conteúdo atual do arquivo
    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    // Procurar a linha com a chave correspondente
    let lineUpdated = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Verificar se a linha contém a chave (ignorando comentários)
      if (line.startsWith(key + '=')) {
        lines[i] = `${key}=${value}`;
        lineUpdated = true;
        console.log(`✅ Atualizada variável ${key} no .env`);
        break;
      }
    }
    
    // Se a chave não foi encontrada, adicionar no final
    if (!lineUpdated) {
      lines.push(`${key}=${value}`);
      console.log(`✅ Adicionada nova variável ${key} no .env`);
    }
    
    // Escrever de volta no arquivo
    const newContent = lines.join('\n');
    fs.writeFileSync(envPath, newContent, 'utf8');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar .env:', error);
    return false;
  }
}

// Endpoint principal para atualizar configurações no .env
router.post('/', async (req, res) => {
  try {
    console.log('🔧 [update-env-config] Recebida solicitação de atualização...');
    
    const { aiConfig, whatsappConfig } = req.body;
    
    if (!aiConfig && !whatsappConfig) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma configuração fornecida para atualizar'
      });
    }
    
    const updates = [];
    
    // Atualizar configurações de IA se fornecidas
    if (aiConfig) {
      if (aiConfig.provider === 'openai' && aiConfig.apiKey) {
        const success = updateEnvFile('OPENAI_API_KEY', aiConfig.apiKey);
        if (success) {
          updates.push('OPENAI_API_KEY');
        }
      }
      
      if (aiConfig.provider === 'groq' && aiConfig.apiKey) {
        const success = updateEnvFile('GROQ_API_KEY', aiConfig.apiKey);
        if (success) {
          updates.push('GROQ_API_KEY');
        }
      }
      
      if (aiConfig.provider === 'anthropic' && aiConfig.apiKey) {
        const success = updateEnvFile('ANTHROPIC_API_KEY', aiConfig.apiKey);
        if (success) {
          updates.push('ANTHROPIC_API_KEY');
        }
      }
      
      if (aiConfig.provider === 'google' && aiConfig.apiKey) {
        const success = updateEnvFile('GOOGLE_GEMINI_API_KEY', aiConfig.apiKey);
        if (success) {
          updates.push('GOOGLE_GEMINI_API_KEY');
        }
      }
    }
    
    // Atualizar configurações do WhatsApp se fornecidas
    if (whatsappConfig) {
      if (whatsappConfig.url) {
        const success = updateEnvFile('EVOLUTION_API_URL', whatsappConfig.url);
        if (success) {
          updates.push('EVOLUTION_API_URL');
        }
      }
      
      if (whatsappConfig.apiKey) {
        const success = updateEnvFile('EVOLUTION_API_KEY', whatsappConfig.apiKey);
        if (success) {
          updates.push('EVOLUTION_API_KEY');
        }
      }
      
      if (whatsappConfig.instance) {
        const success = updateEnvFile('EVOLUTION_INSTANCE_NAME', whatsappConfig.instance);
        if (success) {
          updates.push('EVOLUTION_INSTANCE_NAME');
        }
      }
    }
    
    console.log('✅ [update-env-config] Configurações atualizadas:', updates);
    
    res.json({
      success: true,
      message: 'Configurações atualizadas no arquivo .env',
      updatedKeys: updates
    });
    
  } catch (error) {
    console.error('❌ [update-env-config] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: '✅ Função update-env-config operacional',
    description: 'Atualiza configurações no arquivo .env'
  });
});

export default router;