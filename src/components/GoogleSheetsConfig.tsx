import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { googleSheetsDirectService } from '@/services/googleSheetsDirectService';
import { Settings, Key, Database, Eye, EyeOff, Loader2 } from 'lucide-react';

interface GoogleSheetsConfigProps {
  onConfigured?: () => void;
}

const GoogleSheetsConfig = ({ onConfigured }: GoogleSheetsConfigProps) => {
  const [apiKey, setApiKey] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Check if already configured
    const configured = googleSheetsDirectService.isConfigured();
    setIsConfigured(configured);

    // Load existing values
    const existingApiKey = localStorage.getItem('google_sheets_api_key');
    const existingSpreadsheetId = localStorage.getItem('google_sheets_spreadsheet_id');
    
    if (existingApiKey) setApiKey(existingApiKey);
    if (existingSpreadsheetId) setSpreadsheetId(existingSpreadsheetId);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "API Key é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (!spreadsheetId.trim()) {
      toast({
        title: "Erro", 
        description: "ID da Planilha é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Update the service
    googleSheetsDirectService.updateConfig(apiKey.trim(), spreadsheetId.trim());
    setIsConfigured(true);

    toast({
      title: "✅ Configuração Salva",
      description: "Google Sheets configurado com sucesso!"
    });

    if (onConfigured) {
      onConfigured();
    }
  };

  const handleTest = async () => {
    if (!isConfigured) {
      toast({
        title: "Erro",
        description: "Configure primeiro as credenciais",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      // Test with a sample CPF
      const result = await googleSheetsDirectService.searchStudentByCPF('12345678901');
      
      toast({
        title: "✅ Teste Bem-sucedido",
        description: "Conexão com Google Sheets estabelecida!"
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "❌ Teste Falhou",
        description: "Verifique as credenciais e permissões da planilha",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('google_sheets_api_key');
    localStorage.removeItem('google_sheets_spreadsheet_id');
    setApiKey('');
    setSpreadsheetId('');
    setIsConfigured(false);

    toast({
      title: "🗑️ Configuração Limpa",
      description: "Todas as configurações foram removidas"
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configuração Google Sheets
        </CardTitle>
        <CardDescription>
          Configure o acesso direto ao Google Sheets para funcionar em produção
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isConfigured && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Google Sheets configurado com sucesso!</p>
            <p className="text-green-600 text-sm mt-1">O sistema pode acessar a planilha diretamente.</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Google Sheets API Key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              Obtenha em: Google Cloud Console → APIs & Services → Credentials
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spreadsheet-id" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              ID da Planilha Google Sheets
            </Label>
            <Input
              id="spreadsheet-id"
              placeholder="1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
            <p className="text-xs text-gray-600">
              Encontre na URL: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Instruções de Configuração</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Acesse o <strong>Google Cloud Console</strong></li>
            <li>2. Habilite a <strong>Google Sheets API</strong></li>
            <li>3. Crie uma <strong>API Key</strong> (não Service Account)</li>
            <li>4. Torne sua planilha <strong>pública</strong> (Anyone with the link can view)</li>
            <li>5. Copie o <strong>ID da planilha</strong> da URL</li>
            <li>6. Cole as informações acima e teste a conexão</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            💾 Salvar Configuração
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={!isConfigured || isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Testar Conexão
          </Button>
          <Button variant="destructive" onClick={handleClear} disabled={!isConfigured}>
            🗑️ Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConfig;