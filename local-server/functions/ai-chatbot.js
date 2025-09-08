/**
 * 🤖 Função: ai-chatbot
 * Chatbot inteligente com contexto e memória de conversas
 */

import { Router } from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const router = Router();

// Cache de conversas em memória (em produção, usar banco de dados)
const conversationCache = new Map();

// Função para ler configurações do AI
function getAIConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const settings = JSON.parse(configData);
      return settings.aiConfig || null;
    }
  } catch (error) {
    console.log('🤖 [ai-chatbot] Erro ao ler configurações de IA:', error.message);
  }
  return null;
}

// Função para salvar contexto de conversa
function saveConversationContext(userId, context) {
  const conversationsDir = path.join(process.cwd(), 'config', 'conversations');
  
  if (!fs.existsSync(conversationsDir)) {
    fs.mkdirSync(conversationsDir, { recursive: true });
  }
  
  const contextPath = path.join(conversationsDir, `${userId}.json`);
  
  try {
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf8');
  } catch (error) {
    console.error('🤖 [ai-chatbot] Erro ao salvar contexto:', error);
  }
}

// Função para carregar contexto de conversa
function loadConversationContext(userId) {
  const contextPath = path.join(process.cwd(), 'config', 'conversations', `${userId}.json`);
  
  try {
    if (fs.existsSync(contextPath)) {
      const contextData = fs.readFileSync(contextPath, 'utf8');
      return JSON.parse(contextData);
    }
  } catch (error) {
    console.error('🤖 [ai-chatbot] Erro ao carregar contexto:', error);
  }
  
  // Retornar contexto padrão se não existir
  return {
    userId: userId,
    messages: [],
    studentData: null,
    lastInteraction: null,
    sessionStart: new Date().toISOString(),
    preferences: {}
  };
}

// Função para chamar diferentes provedores de IA
async function callAIProvider(aiConfig, messages) {
  let apiUrl = '';
  let headers = {};
  let body = {};

  switch (aiConfig.provider) {
    case 'openai':
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      };
      body = {
        model: aiConfig.model || 'gpt-4',
        messages: messages,
        temperature: aiConfig.temperature || 0.7,
        max_tokens: aiConfig.maxTokens || 1000
      };
      break;
      
    case 'groq':
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      };
      body = {
        model: aiConfig.model || 'llama3-8b-8192',
        messages: messages,
        temperature: aiConfig.temperature || 0.7,
        max_tokens: aiConfig.maxTokens || 1000
      };
      break;
      
    case 'anthropic':
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': aiConfig.apiKey,
        'anthropic-version': '2023-06-01'
      };
      
      // Converter formato para Anthropic
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      body = {
        model: aiConfig.model || 'claude-3-sonnet-20240229',
        system: systemMessage?.content || '',
        messages: userMessages,
        max_tokens: aiConfig.maxTokens || 1000
      };
      break;
      
    default:
      throw new Error(`Provedor ${aiConfig.provider} não suportado`);
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Erro ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  
  // Padronizar resposta de diferentes provedores
  if (aiConfig.provider === 'anthropic') {
    return result.content?.[0]?.text || 'Resposta vazia';
  } else {
    return result.choices?.[0]?.message?.content || 'Resposta vazia';
  }
}

// Endpoint principal do chatbot
router.post('/', async (req, res) => {
  try {
    console.log('🤖 [ai-chatbot] Nova conversa iniciada...');
    
    const { message, userId, studentData, context } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Mensagem e userId são obrigatórios'
      });
    }
    
    // Ler configurações do AI
    const aiConfig = getAIConfig();
    
    if (!aiConfig || !aiConfig.enabled) {
      return res.json({
        success: false,
        error: 'Agente IA não configurado ou desabilitado',
        response: 'Desculpe, o assistente IA não está disponível no momento. Entre em contato com a secretaria para ajuda.'
      });
    }
    
    if (!aiConfig.apiKey || !aiConfig.provider) {
      return res.json({
        success: false,
        error: 'Configuração de IA incompleta',
        response: 'Assistente IA temporariamente indisponível. Tente novamente mais tarde.'
      });
    }
    
    // Carregar contexto de conversa existente
    let conversationContext = loadConversationContext(userId);
    
    // Atualizar dados do estudante se fornecidos
    if (studentData) {
      conversationContext.studentData = studentData;
    }
    
    // Criar prompt do sistema com contexto
    const systemPrompt = `${aiConfig.systemPrompt}

CONTEXTO DO ESTUDANTE:
${conversationContext.studentData ? `
- Nome: ${conversationContext.studentData.nome || 'Não informado'}
- CPF: ${conversationContext.studentData.cpf || 'Não informado'}
- Email: ${conversationContext.studentData.email || 'Não informado'}
- Telefone: ${conversationContext.studentData.telefone || 'Não informado'}
- Ciclo: ${conversationContext.studentData.ciclo || 'Não informado'}
- Status: ${conversationContext.studentData.status || 'Não informado'}
` : 'Dados do estudante não disponíveis.'}

HISTÓRICO DA CONVERSA:
${conversationContext.messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')}

INSTRUÇÕES:
- Responda de forma natural e conversacional
- Use as informações do contexto quando relevante
- Seja prestativo e educativo
- Mantenha o tom respeitoso e profissional
- Se não souber algo, seja honesto e sugira contatar a secretaria`;

    // Preparar mensagens para a IA
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];
    
    console.log('🤖 [ai-chatbot] Enviando para IA:', {
      provider: aiConfig.provider,
      model: aiConfig.model,
      messageLength: message.length,
      hasStudentData: !!conversationContext.studentData,
      conversationLength: conversationContext.messages.length
    });
    
    // Chamar IA
    const aiResponse = await callAIProvider(aiConfig, messages);
    
    // Atualizar contexto de conversa
    conversationContext.messages.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    );
    
    // Manter apenas últimas 50 mensagens para evitar contexto muito grande
    if (conversationContext.messages.length > 50) {
      conversationContext.messages = conversationContext.messages.slice(-50);
    }
    
    conversationContext.lastInteraction = new Date().toISOString();
    
    // Salvar contexto atualizado
    saveConversationContext(userId, conversationContext);
    
    console.log('🤖 [ai-chatbot] Resposta gerada com sucesso:', {
      responseLength: aiResponse.length,
      userId: userId
    });
    
    res.json({
      success: true,
      response: aiResponse,
      agentName: aiConfig.agentName || 'EETAD Assistant',
      conversationId: userId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🤖 [ai-chatbot] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: 'Desculpe, ocorreu um erro interno. Tente novamente ou entre em contato com a secretaria.'
    });
  }
});

// Endpoint para limpar contexto de conversa
router.delete('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const contextPath = path.join(process.cwd(), 'config', 'conversations', `${userId}.json`);
    
    if (fs.existsSync(contextPath)) {
      fs.unlinkSync(contextPath);
    }
    
    res.json({
      success: true,
      message: 'Contexto de conversa limpo com sucesso'
    });
    
  } catch (error) {
    console.error('🤖 [ai-chatbot] Erro ao limpar contexto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obter histórico de conversa
router.get('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const context = loadConversationContext(userId);
    
    res.json({
      success: true,
      context: {
        ...context,
        messagesCount: context.messages.length,
        messages: context.messages.slice(-20) // Últimas 20 mensagens
      }
    });
    
  } catch (error) {
    console.error('🤖 [ai-chatbot] Erro ao obter contexto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  const aiConfig = getAIConfig();
  
  res.json({ 
    status: '✅ Função ai-chatbot operacional',
    configured: !!aiConfig?.provider,
    enabled: aiConfig?.enabled || false,
    provider: aiConfig?.provider || 'Não configurado'
  });
});

export default router;