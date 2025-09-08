/**
 * 📋 Função: save-settings
 * Salva configurações do sistema (WhatsApp Evolution API e Informações da Secretaria)
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/', async (req, res) => {
  try {
    console.log('📋 [save-settings] Salvando configurações do sistema...');
    
    const { whatsappConfig, secretaryInfo, aiConfig } = req.body;
    
    // Validar dados recebidos
    if (!whatsappConfig && !secretaryInfo && !aiConfig) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma configuração fornecida'
      });
    }
    
    // Criar diretório de configurações se não existir
    const configDir = path.join(process.cwd(), '..', 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configPath = path.join(configDir, 'settings.json');
    
    // Ler configurações existentes ou criar novo objeto
    let existingSettings = {};
    if (fs.existsSync(configPath)) {
      try {
        const existingData = fs.readFileSync(configPath, 'utf8');
        existingSettings = JSON.parse(existingData);
      } catch (error) {
        console.log('📋 [save-settings] Erro ao ler configurações existentes, criando novas...');
        existingSettings = {};
      }
    }
    
    // Mesclar configurações
    const newSettings = {
      ...existingSettings,
      lastUpdated: new Date().toISOString(),
      whatsappConfig: whatsappConfig || existingSettings.whatsappConfig,
      secretaryInfo: secretaryInfo || existingSettings.secretaryInfo,
      aiConfig: aiConfig || existingSettings.aiConfig
    };
    
    // Salvar configurações
    fs.writeFileSync(configPath, JSON.stringify(newSettings, null, 2), 'utf8');
    
    console.log('📋 [save-settings] Configurações salvas com sucesso:', {
      whatsappConfigured: !!newSettings.whatsappConfig?.url,
      secretaryConfigured: !!newSettings.secretaryInfo?.name,
      aiConfigured: !!newSettings.aiConfig?.provider,
      lastUpdated: newSettings.lastUpdated
    });
    
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      timestamp: newSettings.lastUpdated
    });
    
  } catch (error) {
    console.error('📋 [save-settings] Erro ao salvar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para recuperar configurações
router.get('/', async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), '..', 'config', 'settings.json');
    
    if (!fs.existsSync(configPath)) {
      return res.json({
        success: true,
        settings: {
          whatsappConfig: null,
          secretaryInfo: null,
          aiConfig: null
        }
      });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const settings = JSON.parse(configData);
    
    // Não retornar dados sensíveis como API Key completa
    const sanitizedSettings = {
      ...settings,
      whatsappConfig: settings.whatsappConfig ? {
        ...settings.whatsappConfig,
        apiKey: settings.whatsappConfig.apiKey ? '***' + settings.whatsappConfig.apiKey.slice(-4) : ''
      } : null,
      aiConfig: settings.aiConfig ? {
        ...settings.aiConfig,
        apiKey: settings.aiConfig.apiKey ? '***' + settings.aiConfig.apiKey.slice(-4) : ''
      } : null
    };
    
    res.json({
      success: true,
      settings: sanitizedSettings
    });
    
  } catch (error) {
    console.error('📋 [save-settings] Erro ao recuperar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função save-settings operacional' });
});

export default router;