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
    // Tentar primeiro no diretório raiz do projeto (onde as configurações são salvas)
    const configPath = path.join(process.cwd(), '..', 'config', 'settings.json');
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const settings = JSON.parse(configData);
      return settings.aiConfig || null;
    }
    
    // Fallback: tentar no diretório local-server/config
    const localConfigPath = path.join(process.cwd(), 'config', 'settings.json');
    
    if (fs.existsSync(localConfigPath)) {
      const configData = fs.readFileSync(localConfigPath, 'utf8');
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
        model: aiConfig.model || 'llama-3.1-70b-versatile',
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
    
    // Buscar dados completos do aluno se userId for um CPF válido
    let studentCompleteData = null;
    if (userId && userId.length >= 11) {
      try {
        console.log('🔍 [ai-chatbot] Buscando dados do aluno no Google Sheets...');
        const dataQueryResponse = await fetch('http://localhost:3003/functions/ai-data-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf: userId })
        });
        
        if (dataQueryResponse.ok) {
          const dataResult = await dataQueryResponse.json();
          if (dataResult.success) {
            studentCompleteData = dataResult.data;
            console.log('✅ [ai-chatbot] Dados do aluno carregados:', {
              nome: studentCompleteData.resumo.dadosBasicos?.nome,
              ciclo: studentCompleteData.resumo.situacaoAcademica.cicloAtual,
              totalPedidos: studentCompleteData.resumo.pedidosLivros.totalPedidos,
              pagamentosPendentes: studentCompleteData.resumo.situacaoFinanceira.pagamentosPendentes
            });
          }
        }
      } catch (error) {
        console.log('⚠️ [ai-chatbot] Erro ao buscar dados do aluno:', error.message);
      }
    }
    
    // Atualizar dados do estudante se fornecidos
    if (studentData) {
      conversationContext.studentData = studentData;
    }
    
    // Criar prompt do sistema com contexto humanizado
    const currentTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Araguaina' });
    
    // Preparar informações do aluno com dados consultados
    let studentInfo = '';
    if (studentCompleteData && studentCompleteData.resumo.dadosBasicos) {
      const dados = studentCompleteData.resumo.dadosBasicos;
      const situacao = studentCompleteData.resumo.situacaoAcademica;
      const livros = studentCompleteData.resumo.pedidosLivros;
      const financeiro = studentCompleteData.resumo.situacaoFinanceira;
      
      studentInfo = `
👤 DADOS COMPLETOS DO ALUNO (consultados do Google Sheets):
Olá, ${dados.nome}! 😊 Que alegria conversar contigo!
- 🏷️ Nome: ${dados.nome}
- 🆔 CPF: ${dados.cpf}
- 📞 Telefone: ${dados.telefone}
- 📧 Email: ${dados.email}
- ⛪ Congregação: ${dados.congregacao}
- 📊 Status: ${dados.status}

🎓 SITUAÇÃO ACADÊmica:
- 📚 Ciclo Atual: ${situacao.cicloAtual}
- 🏢 Núcleo: ${situacao.nucleoAtual}
- 📈 Total de Matrículas: ${situacao.totalMatriculas}
- ✅ Matrículas Ativas: ${situacao.matriculasAtivas}

📚 PEDIDOS DE LIVROS:
- 📅 Total de Pedidos: ${livros.totalPedidos}
- ⏳ Pendentes: ${livros.pedidosPendentes}
- ✅ Pagos: ${livros.pedidosPagos}${livros.ultimoPedido ? `
- 📚 Último Pedido: ${livros.ultimoPedido.livro} (${livros.ultimoPedido.status})` : ''}

📋 LISTA COMPLETA DOS PEDIDOS:
${studentCompleteData.completo.pedidos.map((pedido, index) => `${index + 1}. **${pedido.livro}**
   - Data: ${pedido.dataPedido}
   - Status: ${pedido.statusPedido}
   - Referência: ${pedido.externalReference}
   - Observação: ${pedido.observacao}`).join('\n')}

💰 SITUAÇÃO FINANCEIRA:
- 📈 Total de Transações: ${financeiro.totalTransacoes}
- ⏳ Pagamentos Pendentes: ${financeiro.pagamentosPendentes}
- ✅ Pagamentos Confirmados: ${financeiro.pagamentosConfirmados}
- 💵 Valor Total: R$ ${financeiro.valorTotal.toFixed(2)}

🙏 Oro para que Deus continue te abençoando nesta jornada!`;
    } else if (conversationContext.studentData) {
      studentInfo = `
👤 SOBRE VOCÊ:
Olá, ${conversationContext.studentData.nome || 'querido(a) estudante'}! 😊 Que alegria conversar contigo!
- CPF: ${conversationContext.studentData.cpf || 'Não informado'}
- Email: ${conversationContext.studentData.email || 'Não informado'}
- Telefone: ${conversationContext.studentData.telefone || 'Não informado'}
- Ciclo atual: ${conversationContext.studentData.ciclo || 'Não informado'}
- Status: ${conversationContext.studentData.status || 'Não informado'}
- 🙏 Oro para que Deus continue te abençoando nesta jornada!`;
    } else {
      studentInfo = 'Que bom te conhecer! Ainda não tenho seus dados, mas posso te ajudar com muito carinho do mesmo jeito. 😊💙';
    }
    
    const systemPrompt = `${aiConfig.systemPrompt}

🕰️ AGORA SÃO: ${currentTime} em Palmas, TO
${studentInfo}

📚 NOSSA ESCOLA:
- 1º Ciclo: Formação Básica - 16 disciplinas fundamentais
- 2º Ciclo: Formação Intermediária - 16 disciplinas de aprofundamento
- 3º Ciclo: Formação Avançada - 14 disciplinas ministeriais
- Total: 46 disciplinas de excelente formação teológica! 🎆

💬 NOSSA CONVERSA ATÉ AGORA:
${conversationContext.messages.slice(-4).map(m => `${m.role === 'user' ? '👤 Você' : '🤖 Eu'}: ${m.content}`).join('\n')}

❤️ COMO EU RESPONDO:
- Sempre com carinho, respeito e sabedoria cristã
- Uso as informações que tenho para te ajudar melhor
- Para questões da secretaria, te oriento com quem falar amorosamente
- Aplico conhecimento bíblico quando for edificante e oportuno
- Mantenho sempre um coração acolhedor e ministerial
- Trato cada pessoa como um filho(a) de Deus especial
- Respondo de forma prática mas sempre com amor e fé
- USO OS DADOS REAIS consultados do sistema para respostas precisas

Vamos lá! Como posso te abençoar hoje? 🙏💙`;

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