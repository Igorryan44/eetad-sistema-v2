import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecretaryUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserRequest {
  action: 'login' | 'create' | 'list' | 'delete' | 'setup-headers';
  username?: string;
  password?: string;
  userData?: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  };
  userId?: string;
}

// Função para criar JWT (igual às outras funções)
async function createJWT(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Converter a chave privada PEM para ArrayBuffer
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const keyData = await crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyData,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${unsignedToken}.${signatureB64}`;
}

// Função para obter access token
async function getAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const jwt = await createJWT(serviceAccountEmail, privateKey);
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    throw new Error('Falha na autenticação Google');
  }
  
  return tokenData.access_token;
}

// Hash simples para senha (mesmo algoritmo do frontend)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Validar formato da senha
function validatePassword(password: string): boolean {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isValidLength = password.length === 6;
  
  return hasLetter && hasNumber && isValidLength;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: UserRequest = await req.json();
    
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    
    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      throw new Error('Configuração do Google Sheets não encontrada');
    }

    // Limpar e formatar a chave privada
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
    
    // Definir a aba "usuarios" na planilha
    const sheetName = 'usuarios';
    
    switch (requestData.action) {
      case 'login':
        return await handleLogin(spreadsheetId, accessToken, requestData.username!, requestData.password!);
      
      case 'create':
        return await handleCreateUser(spreadsheetId, accessToken, requestData.userData!);
      
      case 'list':
        return await handleListUsers(spreadsheetId, accessToken);
      
      case 'delete':
        return await handleDeleteUser(spreadsheetId, accessToken, requestData.userId!);
      
      case 'setup-headers':
        return await handleSetupHeaders(spreadsheetId, accessToken);
      
      default:
        throw new Error('Ação não reconhecida');
    }

  } catch (error) {
    console.error('Erro na função manage-secretary-users:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

// Função para fazer login
async function handleLogin(spreadsheetId: string, accessToken: string, username: string, password: string): Promise<Response> {
  const range = 'usuarios!A:H';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const data = await response.json();
  
  if (!data.values || data.values.length <= 1) {
    return new Response(JSON.stringify({ success: false, error: 'Nenhum usuário encontrado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const headers = data.values[0];
  const rows = data.values.slice(1);
  
  // Procurar usuário
  for (const row of rows) {
    if (row[1] === username) { // Coluna B = username
      const storedHash = row[4]; // Coluna E = passwordHash
      const inputHash = hashPassword(password);
      
      if (storedHash === inputHash) {
        // Atualizar último login
        const rowIndex = rows.indexOf(row) + 2; // +2 porque: +1 para header, +1 para índice baseado em 1
        const updateRange = `usuarios!G${rowIndex}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=RAW`;
        
        await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [[new Date().toISOString()]]
          }),
        });

        const user: SecretaryUser = {
          id: row[0],
          username: row[1],
          email: row[2],
          fullName: row[3],
          passwordHash: row[4],
          createdAt: row[5],
          lastLogin: new Date().toISOString()
        };

        return new Response(JSON.stringify({ success: true, user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Credenciais inválidas' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Função para criar usuário
async function handleCreateUser(spreadsheetId: string, accessToken: string, userData: any): Promise<Response> {
  // Validações
  if (!validatePassword(userData.password)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Senha deve ter 6 caracteres com letras e números' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!/\S+@\S+\.\S+/.test(userData.email)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Email inválido' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verificar se usuário já existe
  const checkRange = 'usuarios!A:H';
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${checkRange}`;
  
  const checkResponse = await fetch(checkUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const checkData = await checkResponse.json();
  
  if (checkData.values && checkData.values.length > 1) {
    const rows = checkData.values.slice(1);
    for (const row of rows) {
      if (row[1] === userData.username || row[2] === userData.email) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Usuário ou email já existem' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // Criar novo usuário
  const newUser = [
    Date.now().toString(), // ID
    userData.username,     // Username
    userData.email,        // Email
    userData.fullName,     // Full Name
    hashPassword(userData.password), // Password Hash
    new Date().toISOString(), // Created At
    '', // Last Login (vazio inicialmente)
    'ATIVO' // Status
  ];

  const appendRange = 'usuarios!A:H';
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=RAW`;
  
  const appendResponse = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [newUser]
    }),
  });

  if (appendResponse.ok) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    throw new Error('Erro ao criar usuário na planilha');
  }
}

// Função para listar usuários
async function handleListUsers(spreadsheetId: string, accessToken: string): Promise<Response> {
  const range = 'usuarios!A:H';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const data = await response.json();
  
  if (!data.values || data.values.length <= 1) {
    return new Response(JSON.stringify({ success: true, users: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rows = data.values.slice(1);
  const users = rows.map((row: any[]) => ({
    id: row[0],
    username: row[1],
    email: row[2],
    fullName: row[3],
    createdAt: row[5],
    lastLogin: row[6] || null
  }));

  return new Response(JSON.stringify({ success: true, users }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Função para configurar cabeçalho da aba usuarios
async function handleSetupHeaders(spreadsheetId: string, accessToken: string): Promise<Response> {
  const range = 'usuarios!A1:H1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
  
  const headers = [
    'ID',
    'Username', 
    'Email',
    'Full Name',
    'Password Hash',
    'Created At',
    'Last Login',
    'Status'
  ];

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [headers]
    }),
  });

  if (response.ok) {
    // Agora vamos criar o usuário Admin padrão
    const adminUser = [
      'admin-default',
      'Admin',
      'simacjr@hotmail.com',
      'Administrador',
      '54c5993e', // Hash da senha 'admin1'
      new Date().toISOString(),
      '',
      'ATIVO'
    ];

    const appendRange = 'usuarios!A:H';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=RAW`;
    
    const appendResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [adminUser]
      }),
    });

    if (appendResponse.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Cabeçalho configurado e usuário Admin criado' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Cabeçalho configurado, mas erro ao criar usuário Admin' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    throw new Error('Erro ao configurar cabeçalho da planilha');
  }
}

// Função para deletar usuário
async function handleDeleteUser(spreadsheetId: string, accessToken: string, userId: string): Promise<Response> {
  // Não permitir deletar o usuário Admin padrão
  if (userId === 'admin-default') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Não é possível deletar o usuário Admin padrão' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Implementar lógica de deleção (marcar como inativo ou remover linha)
  // Por simplicidade, vamos marcar como inativo alterando o username
  const range = 'usuarios!A:H';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const data = await response.json();
  
  if (!data.values || data.values.length <= 1) {
    return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rows = data.values.slice(1);
  let userRowIndex = -1;
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      userRowIndex = i + 2; // +2 para header e índice baseado em 1
      break;
    }
  }

  if (userRowIndex === -1) {
    return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Marcar como deletado alterando o username
  const updateRange = `usuarios!B${userRowIndex}`;
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=RAW`;
  
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[`[DELETADO]${rows[userRowIndex-2][1]}`]]
    }),
  });

  if (updateResponse.ok) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    throw new Error('Erro ao deletar usuário');
  }
}

serve(handler);