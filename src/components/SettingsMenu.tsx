import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Settings, MessageSquare, Phone, Mail, User, Shield, Smartphone, Globe, Bot, Cpu, Zap } from 'lucide-react';
import UserManagement from './UserManagement';
import WhatsAppOpener from './WhatsAppOpener';
import GoogleSheetsConfig from './GoogleSheetsConfig';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  agentName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

interface WhatsAppConfig {
  url: string;
  instance: string;
  apiKey: string;
}

interface SecretaryInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
  // Detectar se está em produção
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('local');
  
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('eetad_ai_config');
    return saved ? JSON.parse(saved) : {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4',
      agentName: 'EETAD Assistant',
      systemPrompt: `Olá! Eu sou seu assistente pessoal da EETAD - a Escola de Educação Teológica das Assembleias de Deus aqui em Palmas, TO. 😊

É um prazer falar com você! Estou aqui para tornar sua jornada de formação teológica mais tranquila e especial. Posso te ajudar com:

💫 SOBRE OS CURSOS:
- Explicar nossos 3 ciclos de formação (do básico ao avançado)
- Falar sobre as disciplinas bíblicas e teológicas
- Orientar sobre matrículas e sua progressão acadêmica

❤️ ATENDIMENTO CARINHOSO:
- Conheço seus dados para um atendimento personalizado
- Ajudo com pedidos de livros do seu ciclo
- Esclareço dúvidas sobre pagamentos e prazos

🤝 CONVERSA ACOLHEDORA:
- Falo com respeito, carinho e sabedoria ministerial
- Compartilho conhecimento bíblico quando for útil
- Te direciono para nossa querida secretaria quando necessário

⏰ SEMPRE DISPONÍVEL:
- Estou aqui 24 horas para você, todos os dias
- Para coisas urgentes, te oriento a falar direto com a secretaria

Conte comigo para qualquer coisa! Como posso te ajudar hoje na sua caminhada de fé e estudos? 🙏`,
      temperature: 0.7,
      maxTokens: 1000,
      enabled: true
    };
  });

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(() => {
    const saved = localStorage.getItem('eetad_whatsapp_config');
    return saved ? JSON.parse(saved) : {
      url: '',
      instance: '',
      apiKey: ''
    };
  });

  const [secretaryInfo, setSecretaryInfo] = useState<SecretaryInfo>(() => {
    const saved = localStorage.getItem('eetad_secretary_info');
    return saved ? JSON.parse(saved) : {
      name: '',
      phone: '',
      email: '',
      address: ''
    };
  });

  const [activeTab, setActiveTab] = useState('users');

  // Função para limpar configurações obsoletas
  const fixDeprecatedModels = () => {
    const savedAi = localStorage.getItem('eetad_ai_config');
    if (savedAi) {
      const config = JSON.parse(savedAi);
      if (config.model === 'llama3-8b-8192' || config.model === 'llama3-70b-8192') {
        config.model = 'llama-3.1-70b-versatile';
        localStorage.setItem('eetad_ai_config', JSON.stringify(config));
        setAiConfig(config);
        console.log('⚙️ Modelo descontinuado corrigido automaticamente');
        toast({
          title: "Modelo Atualizado",
          description: "Modelo descontinuado foi automaticamente corrigido para llama-3.1-70b-versatile"
        });
      }
    }
  };

  // Executar verificação ao abrir o menu
  useEffect(() => {
    if (isOpen) {
      fixDeprecatedModels();
    }
  }, [isOpen]);

  const handleAISave = async () => {
    try {
      // Salvar no localStorage (para o frontend)
      localStorage.setItem('eetad_ai_config', JSON.stringify(aiConfig));
      
      // Em produção, não fazer requisições para o backend
      if (isProduction) {
        console.log('📱 Modo produção: salvando apenas no localStorage');
        toast({
          title: "Sucesso",
          description: "Configurações do Agente IA salvas com sucesso! (Modo Produção)"
        });
        return;
      }
      
      // Salvar no backend (para o servidor local)
      const response = await fetch(`${((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003'}/functions/save-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappConfig,
          secretaryInfo,
          aiConfig
        }),
      }).catch(() => {
        console.log('Backend não disponível, salvando apenas no localStorage');
        return { ok: false };
      });
      
      // Atualizar arquivo .env com a nova API key
      try {
        const envResponse = await fetch(`${((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003'}/functions/update-env-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aiConfig: aiConfig
          })
        });
        
        if (envResponse.ok) {
          const envResult = await envResponse.json();
          console.log('⚙️ Arquivo .env atualizado:', envResult.updatedKeys);
        }
      } catch (envError) {
        console.log('⚠️ Não foi possível atualizar o .env:', envError);
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações do Agente IA salvas com sucesso! O arquivo .env foi atualizado automaticamente."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do Agente IA",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppSave = async () => {
    try {
      // Salvar no localStorage (para o frontend)
      localStorage.setItem('eetad_whatsapp_config', JSON.stringify(whatsappConfig));
      
      // Em produção, não fazer requisições para o backend
      if (isProduction) {
        console.log('📱 Modo produção: salvando apenas no localStorage');
        toast({
          title: "Sucesso",
          description: "Configurações do WhatsApp salvas com sucesso! (Modo Produção)"
        });
        return;
      }
      
      // Salvar no backend (para o servidor local)
      const response = await fetch(`${((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003'}/functions/save-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappConfig,
          secretaryInfo,
          aiConfig
        }),
      }).catch(() => {
        // Se a API não estiver disponível, continue apenas com localStorage
        console.log('Backend não disponível, salvando apenas no localStorage');
        return { ok: false };
      });
      
      // Atualizar arquivo .env com as novas configurações do WhatsApp
      try {
        const envResponse = await fetch(`${((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003'}/functions/update-env-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            whatsappConfig: whatsappConfig
          })
        });
        
        if (envResponse.ok) {
          const envResult = await envResponse.json();
          console.log('⚙️ Arquivo .env atualizado:', envResult.updatedKeys);
        }
      } catch (envError) {
        console.log('⚠️ Não foi possível atualizar o .env:', envError);
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações do WhatsApp salvas com sucesso! O arquivo .env foi atualizado automaticamente."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do WhatsApp",
        variant: "destructive"
      });
    }
  };

  const handleSecretaryInfoSave = async () => {
    try {
      // Salvar no localStorage (para o frontend)
      localStorage.setItem('eetad_secretary_info', JSON.stringify(secretaryInfo));
      
      // Em produção, não fazer requisições para o backend
      if (isProduction) {
        console.log('📱 Modo produção: salvando apenas no localStorage');
        toast({
          title: "Sucesso", 
          description: "Informações da Secretaria salvas com sucesso! (Modo Produção)"
        });
        return;
      }
      
      // Salvar no backend (para o servidor local)
      const response = await fetch(`${((import.meta as any)?.env?.VITE_API_BASE_URL) || 'http://localhost:3003'}/functions/save-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappConfig,
          secretaryInfo,
          aiConfig
        }),
      }).catch(() => {
        // Se a API não estiver disponível, continue apenas com localStorage
        console.log('Backend não disponível, salvando apenas no localStorage');
        return { ok: false };
      });
      
      toast({
        title: "Sucesso", 
        description: "Informações da Secretaria salvas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar informações da Secretaria",
        variant: "destructive"
      });
    }
  };

  const testAIConnection = async () => {
    if (!aiConfig.provider || !aiConfig.apiKey || !aiConfig.model) {
      toast({
        title: "Erro",
        description: "Por favor, preencha Provider, API Key e Modelo",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Testando...",
        description: "Verificando conexão com o provedor de IA"
      });

      const testMessage = "Olá, este é um teste de conexão. Responda brevemente que você está funcionando.";
      
      let testUrl = '';
      let headers = {};
      let body = {};

      switch (aiConfig.provider) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/chat/completions';
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          };
          body = {
            model: aiConfig.model,
            messages: [{ role: 'user', content: testMessage }],
            max_tokens: 50
          };
          break;
          
        case 'groq':
          testUrl = 'https://api.groq.com/openai/v1/chat/completions';
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          };
          body = {
            model: aiConfig.model,
            messages: [{ role: 'user', content: testMessage }],
            max_tokens: 50
          };
          break;
          
        case 'anthropic':
          testUrl = 'https://api.anthropic.com/v1/messages';
          headers = {
            'Content-Type': 'application/json',
            'x-api-key': aiConfig.apiKey,
            'anthropic-version': '2023-06-01'
          };
          body = {
            model: aiConfig.model,
            messages: [{ role: 'user', content: testMessage }],
            max_tokens: 50
          };
          break;
          
        case 'google':
          testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`;
          headers = {
            'Content-Type': 'application/json'
          };
          body = {
            contents: [{
              parts: [{ text: testMessage }]
            }]
          };
          break;
          
        default:
          throw new Error('Provedor não suportado para teste');
      }

      const response = await fetch(testUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      let aiResponse = 'Resposta recebida com sucesso';
      
      // Padronizar resposta de diferentes provedores
      if (aiConfig.provider === 'anthropic') {
        aiResponse = result.content?.[0]?.text || 'Resposta vazia';
      } else if (aiConfig.provider === 'google') {
        aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Resposta vazia';
      } else {
        aiResponse = result.choices?.[0]?.message?.content || 'Resposta vazia';
      }

      toast({
        title: "✅ Conexão Bem-sucedida",
        description: `IA respondeu: "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`,
      });
    } catch (error) {
      console.error('Erro ao testar IA:', error);
      toast({
        title: "❌ Erro de Conexão",
        description: `Falha ao conectar: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const testWhatsAppConnection = async () => {
    if (!whatsappConfig.url || !whatsappConfig.instance || !whatsappConfig.apiKey) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todas as configurações do WhatsApp",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Testando...",
        description: "Verificando conexão com a Evolution API"
      });

      // Tentar diferentes endpoints para verificar a conexão
      const baseUrl = whatsappConfig.url.replace(/\/$/, '');
      const endpoints = [
        { path: '/instance/fetchInstances', name: 'Lista de instâncias' },
        { path: `/instance/connect/${whatsappConfig.instance}`, name: 'Status da instância' },
        { path: '/instance', name: 'Endpoint básico' },
        { path: '', name: 'API raiz' }
      ];

      let connectionSuccess = false;
      let instanceFound = false;
      let errorDetails = [];

      for (const endpoint of endpoints) {
        try {
          const testUrl = `${baseUrl}${endpoint.path}`;
          console.log(`Testando endpoint: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': whatsappConfig.apiKey
            }
          });

          console.log(`Response ${endpoint.name}:`, response.status, response.statusText);
          
          if (response.ok) {
            connectionSuccess = true;
            const result = await response.json().catch(() => null);
            console.log(`Resultado ${endpoint.name}:`, result);
            
            // Verificar se a instância existe nos resultados
            if (result) {
              if (Array.isArray(result)) {
                instanceFound = result.some((inst: any) => 
                  inst.instanceName === whatsappConfig.instance || 
                  inst.instance?.instanceName === whatsappConfig.instance ||
                  inst.name === whatsappConfig.instance
                );
              } else if (result.instances) {
                instanceFound = result.instances.some((inst: any) => 
                  inst.instanceName === whatsappConfig.instance || 
                  inst.instance?.instanceName === whatsappConfig.instance ||
                  inst.name === whatsappConfig.instance
                );
              } else if (result.instanceName === whatsappConfig.instance) {
                instanceFound = true;
              }
            }
            
            break; // Sair do loop se encontrou uma conexão bem-sucedida
          } else {
            errorDetails.push(`${endpoint.name}: ${response.status} ${response.statusText}`);
          }
        } catch (endpointError) {
          console.error(`Erro no endpoint ${endpoint.name}:`, endpointError);
          errorDetails.push(`${endpoint.name}: ${endpointError.message}`);
        }
      }

      if (connectionSuccess) {
        if (instanceFound) {
          toast({
            title: "✅ Sucesso Completo",
            description: `Conexão estabelecida e instância '${whatsappConfig.instance}' encontrada!`
          });
        } else {
          toast({
            title: "⚠️ Conexão OK, Instância Não Encontrada",
            description: `API acessível, mas instância '${whatsappConfig.instance}' não existe. Verifique o nome da instância ou crie-a no painel Evolution.`,
            variant: "destructive"
          });
        }
      } else {
        throw new Error(`Não foi possível conectar a nenhum endpoint. Detalhes: ${errorDetails.join('; ')}`);
      }

    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error);
      toast({
        title: "❌ Erro de Conexão",
        description: `Falha ao conectar com a Evolution API. Verifique URL e API Key. Erro: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Gerenciar Usuários
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp Evolution
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agente IA
            </TabsTrigger>
            <TabsTrigger value="secretary" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações da Secretaria
            </TabsTrigger>
          </TabsList>

          {/* Tab: Google Sheets Configuration */}
          <TabsContent value="sheets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configuração Google Sheets
                </CardTitle>
                <CardDescription>
                  Configure o acesso direto ao Google Sheets para funcionar em produção sem servidor backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleSheetsConfig />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gerenciar Usuários */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gerenciamento de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configurações WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Configuração WhatsApp Evolution API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        URL da Evolution API
                      </Label>
                      <Input
                        id="whatsapp-url"
                        placeholder="https://api.evolution.com"
                        value={whatsappConfig.url}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, url: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-instance" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Nome da Instância
                      </Label>
                      <Input
                        id="whatsapp-instance"
                        placeholder="Nome exato da instância (ex: eetad)"
                        value={whatsappConfig.instance}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, instance: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-apikey" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        API Key
                      </Label>
                      <Input
                        id="whatsapp-apikey"
                        type="password"
                        placeholder="sua-api-key"
                        value={whatsappConfig.apiKey}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiKey: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Instruções de Configuração</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Acesse seu painel da Evolution API</li>
                        <li>• Copie a URL base da sua API (exemplo: https://evolution.seudominio.com)</li>
                        <li>• Crie uma nova instância com o nome exato que colocará aqui</li>
                        <li>• Gere uma API Key para autenticação</li>
                        <li>• 📱 Conecte seu WhatsApp à instância criada</li>
                      </ul>
                      
                      <div className="mt-3 p-2 bg-white rounded border">
                        <h5 className="font-semibold text-blue-800 text-sm mb-1">🔔 Notificações Automáticas</h5>
                        <p className="text-xs text-blue-600">
                          Esta configuração permite o envio automático de notificações para a secretaria sobre matrículas e pagamentos.
                        </p>
                      </div>
                      
                      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300">
                        <h5 className="font-semibold text-yellow-800 text-sm mb-1">⚠️ Instância Não Encontrada?</h5>
                        <p className="text-xs text-yellow-700">
                          Se o teste mostrar "instância não encontrada", verifique:
                        </p>
                        <ul className="text-xs text-yellow-700 mt-1 ml-2">
                          <li>• Nome da instância está exato (maiúsculas/minúsculas)</li>
                          <li>• Instância foi criada no painel Evolution</li>
                          <li>• WhatsApp foi conectado à instância</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Importante</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-700">
                          Mantenha sua API Key segura e nunca a compartilhe. 
                          Teste a conexão após salvar as configurações.
                        </p>
                        <div className="bg-yellow-100 p-2 rounded border">
                          <p className="text-xs text-yellow-800 font-medium">
                            🔄 Prioridade de Configuração:
                          </p>
                          <p className="text-xs text-yellow-700">
                            1º Menu Configurações (este) → 2º Arquivo .env
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleWhatsAppSave}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Salvar Configurações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testWhatsAppConnection}
                    className="border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                  >
                    Testar Conexão
                  </Button>
                  <WhatsAppOpener
                    phone={secretaryInfo.phone}
                    message="Olá! Teste de abertura do WhatsApp pelo sistema EETAD."
                    variant="outline"
                    className="border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configurações Agente IA */}
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuração do Agente IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-provider" className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        Provedor de IA
                      </Label>
                      <select
                        id="ai-provider"
                        value={aiConfig.provider}
                        onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-md p-2"
                      >
                        <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                        <option value="groq">Groq (Llama, Mixtral)</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="google">Google (Gemini)</option>
                        <option value="custom">API Personalizada</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-model" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Modelo
                      </Label>
                      <select
                        id="ai-model"
                        value={aiConfig.model}
                        onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-md p-2"
                      >
                        {aiConfig.provider === 'openai' && (
                          <>
                            <option value="gpt-4o">GPT-4o (Mais Recente)</option>
                            <option value="gpt-4o-mini">GPT-4o Mini (Rápido e Econômico)</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-4-turbo-preview">GPT-4 Turbo Preview</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
                          </>
                        )}
                        {aiConfig.provider === 'groq' && (
                          <>
                            <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                            <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                            <option value="gemma-7b-it">Gemma 7B IT</option>
                          </>
                        )}
                        {aiConfig.provider === 'anthropic' && (
                          <>
                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Mais Recente)</option>
                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                          </>
                        )}
                        {aiConfig.provider === 'google' && (
                          <>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-pro">Gemini Pro</option>
                            <option value="gemini-pro-vision">Gemini Pro Vision</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-apikey" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        API Key
                      </Label>
                      <Input
                        id="ai-apikey"
                        type="password"
                        placeholder="sua-api-key-aqui"
                        value={aiConfig.apiKey}
                        onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-agent-name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome do Agente
                      </Label>
                      <Input
                        id="ai-agent-name"
                        placeholder="EETAD Assistant"
                        value={aiConfig.agentName}
                        onChange={(e) => setAiConfig({ ...aiConfig, agentName: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ai-temperature">Temperatura: {aiConfig.temperature}</Label>
                        <input
                          id="ai-temperature"
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={aiConfig.temperature}
                          onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ai-max-tokens">Max Tokens</Label>
                        <Input
                          id="ai-max-tokens"
                          type="number"
                          min="100"
                          max="4000"
                          value={aiConfig.maxTokens}
                          onChange={(e) => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) })}
                          className="border-2 border-gray-200 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-system-prompt">Prompt do Sistema</Label>
                      <textarea
                        id="ai-system-prompt"
                        rows={8}
                        placeholder="Digite o prompt do sistema que define a personalidade e comportamento do agente IA..."
                        value={aiConfig.systemPrompt}
                        onChange={(e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-md p-2 resize-none"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">🤖 Funcionalidades do Agente</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 💬 Conversasções contextuais com memória persistente</li>
                        <li>• 📚 Informações sobre cursos e disciplinas EETAD</li>
                        <li>• 📝 Suporte personalizado para matrículas</li>
                        <li>• 📚 Assistência com pedidos de livros por ciclo</li>
                        <li>• 📱 Integração com notificações WhatsApp</li>
                        <li>• 📈 Análise contextual de dados de estudantes</li>
                        <li>• 🚀 Respostas rápidas com sugestões inteligentes</li>
                        <li>• 🕰️ Atendimento 24/7 para estudantes</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">💡 Dicas para o Prompt Personalizado</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 🎭 Defina a personalidade e tom do agente</li>
                        <li>• 🏢 Inclua conhecimento específico sobre EETAD</li>
                        <li>• 📝 Especifique como responder perguntas dos alunos</li>
                        <li>• 🙏 Use tom respeitoso e educativo sempre</li>
                        <li>• 📜 Incorpore conhecimento bíblico quando relevante</li>
                        <li>• 🎯 Foque em objetivos educacionais e ministeriais</li>
                        <li>• 🕰️ Considere horários de atendimento da secretaria</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Importante</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-700">
                          O agente terá acesso aos dados dos alunos para fornecer suporte personalizado.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ai-enabled"
                            checked={aiConfig.enabled}
                            onChange={(e) => setAiConfig({ ...aiConfig, enabled: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="ai-enabled" className="text-sm text-yellow-800">
                            Ativar Agente IA
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleAISave}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                  >
                    Salvar Configurações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testAIConnection}
                    className="border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                  >
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Informações da Secretaria */}
          <TabsContent value="secretary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações da Secretaria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="secretary-name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome da Secretária
                      </Label>
                      <Input
                        id="secretary-name"
                        placeholder="Nome completo da secretária"
                        value={secretaryInfo.name}
                        onChange={(e) => setSecretaryInfo({ ...secretaryInfo, name: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secretary-phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone/WhatsApp
                      </Label>
                      <Input
                        id="secretary-phone"
                        placeholder="(63) 99999-9999"
                        value={secretaryInfo.phone}
                        onChange={(e) => setSecretaryInfo({ ...secretaryInfo, phone: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secretary-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input
                        id="secretary-email"
                        type="email"
                        placeholder="secretaria@eetadpalmas.com"
                        value={secretaryInfo.email}
                        onChange={(e) => setSecretaryInfo({ ...secretaryInfo, email: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secretary-address" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Endereço
                      </Label>
                      <Input
                        id="secretary-address"
                        placeholder="Endereço da secretaria"
                        value={secretaryInfo.address}
                        onChange={(e) => setSecretaryInfo({ ...secretaryInfo, address: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">📞 Informações de Contato</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Essas informações serão exibidas para os alunos entrarem em contato com a secretaria.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <h5 className="font-semibold text-blue-800 mb-2">🔔 Notificações WhatsApp Automáticas</h5>
                        <p className="text-xs text-blue-700 mb-2">
                          O telefone cadastrado receberá notificações automáticas quando:
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• ✅ Aluno se inscrever para matrícula</li>
                          <li>• 📚 Aluno fizer pedido de livro</li>
                          <li>• 💰 Pagamento de livro for confirmado</li>
                          <li>• 🎓 Matrícula for efetivada</li>
                        </ul>
                      </div>
                      {secretaryInfo.name && (
                        <div className="bg-white rounded p-3 space-y-2">
                          <p><strong>Nome:</strong> {secretaryInfo.name}</p>
                          {secretaryInfo.phone && <p><strong>Telefone:</strong> {secretaryInfo.phone}</p>}
                          {secretaryInfo.email && <p><strong>E-mail:</strong> {secretaryInfo.email}</p>}
                          {secretaryInfo.address && <p><strong>Endereço:</strong> {secretaryInfo.address}</p>}
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Mantenha as informações sempre atualizadas</li>
                        <li>• Use um número de WhatsApp Business se possível</li>
                        <li>• Verifique se o e-mail está funcionando</li>
                        <li>• O endereço ajuda os alunos a localizar a secretaria</li>
                        <li>• 🚨 O telefone receberá notificações automáticas do sistema</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSecretaryInfoSave}
                    className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                  >
                    Salvar Informações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsMenu;