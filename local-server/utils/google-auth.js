import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Cache para armazenar dados das planilhas
const sheetCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 segundos entre requisições (54 req/min)

// Função para aguardar o intervalo mínimo entre requisições
function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Aguardando ${waitTime}ms para respeitar rate limit`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  return Promise.resolve();
}

/**
 * Gera um JWT para autenticação com a API do Google
 */
export async function getGoogleJwt(serviceAccountEmail, privateKey) {
  // Converter quebras de linha escapadas para quebras de linha reais
  const processedPrivateKey = privateKey?.replace(/\\n/g, '\n');
  

  
  if (!serviceAccountEmail || !processedPrivateKey) {
    console.error('❌ Credenciais do Google não configuradas');
    throw new Error('Credenciais do Google não configuradas');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  try {
    // Tentar diferentes abordagens para a chave privada
    console.log('🔧 Tentando gerar JWT com chave processada...');
    
    // Primeira tentativa: usar a chave diretamente
    try {
      return jwt.sign(payload, processedPrivateKey, { algorithm: 'RS256' });
    } catch (directError) {
      console.log('❌ Falha com chave direta:', directError.message);
    }
    
    // Segunda tentativa: usar crypto.createPrivateKey
    try {
      const crypto = await import('crypto');
      const keyObject = crypto.createPrivateKey(processedPrivateKey);
      return jwt.sign(payload, keyObject, { algorithm: 'RS256' });
    } catch (cryptoError) {
      console.log('❌ Falha com crypto.createPrivateKey:', cryptoError.message);
    }
    
    // Terceira tentativa: usar Buffer
    try {
      const keyBuffer = Buffer.from(processedPrivateKey, 'utf8');
      return jwt.sign(payload, keyBuffer, { algorithm: 'RS256' });
    } catch (bufferError) {
      console.log('❌ Falha com Buffer:', bufferError.message);
    }
    
    throw new Error('Todas as tentativas de geração de JWT falharam');
  } catch (error) {
    console.error('Erro ao gerar JWT:', error);
    console.error('Detalhes do erro:', error.message);
    throw new Error('Falha ao gerar token de autenticação');
  }
}

/**
 * Obtém um access token do Google usando JWT
 */
export async function getGoogleAccessToken(serviceAccountEmail, privateKey) {
  try {
    const jwtToken = await getGoogleJwt(serviceAccountEmail, privateKey);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do Google OAuth:', errorText);
      throw new Error(`Falha na autenticação: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erro ao obter access token:', error);
    throw error;
  }
}

/**
 * Limpa o cache de dados das planilhas
 */
export function clearSheetCache() {
  sheetCache.clear();
  console.log('🧹 Cache das planilhas limpo');
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats() {
  const stats = {
    size: sheetCache.size,
    keys: Array.from(sheetCache.keys()),
    lastRequestTime: new Date(lastRequestTime).toISOString()
  };
  console.log('📊 Estatísticas do cache:', stats);
  return stats;
}

/**
 * Função com retry e backoff exponencial para requisições críticas
 */
export async function readSheetDataWithRetry(spreadsheetId, range, maxRetries = 3, forceRefresh = false) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await readSheetData(spreadsheetId, range, forceRefresh);
    } catch (error) {
      lastError = error;
      
      // Se é erro de quota, aguardar mais tempo
      if (error.message.includes('RATE_LIMIT_EXCEEDED') || error.message.includes('Quota exceeded')) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 segundos
        console.log(`⏱️ Erro de quota na tentativa ${attempt}/${maxRetries}. Aguardando ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      
      // Para outros erros, não fazer retry
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Faz uma requisição autenticada para a API do Google Sheets
 */
export async function makeAuthenticatedRequest(url, options = {}) {
  console.log('🌍 DEBUG - process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'PRESENTE' : 'AUSENTE');
  console.log('🌍 DEBUG - process.env.GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'PRESENTE' : 'AUSENTE');
  
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    console.error('❌ Credenciais do Google não configuradas em makeAuthenticatedRequest');
    throw new Error('Credenciais do Google não configuradas');
  }

  try {
    const accessToken = await getGoogleAccessToken(serviceAccountEmail, privateKey);
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...options, ...defaultOptions });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na requisição para ${url}:`, errorText);
      throw new Error(`Requisição falhou: ${response.status} - ${errorText}`);
    }

    return response;
  } catch (error) {
    console.error('Erro na requisição autenticada:', error);
    throw error;
  }
}

/**
 * Lê dados de uma planilha do Google Sheets com cache e rate limiting
 */
export async function readSheetData(spreadsheetId, range, forceRefresh = false) {
  const cacheKey = `${spreadsheetId}:${range}`;
  const now = Date.now();
  
  // Verificar cache primeiro
  if (!forceRefresh && sheetCache.has(cacheKey)) {
    const cached = sheetCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Usando dados do cache para ${range}`);
      return cached.data;
    }
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  try {
    // Aguardar rate limit
    await waitForRateLimit();
    lastRequestTime = Date.now();
    
    console.log(`🔄 Fazendo requisição para ${range}`);
    const response = await makeAuthenticatedRequest(url);
    const data = await response.json();
    const values = data.values || [];
    
    // Armazenar no cache
    sheetCache.set(cacheKey, {
      data: values,
      timestamp: now
    });
    
    console.log(`✅ Dados de ${range} carregados e armazenados no cache`);
    return values;
  } catch (error) {
    console.error(`Erro ao ler dados da planilha (${range}):`, error);
    
    // Se houver erro e temos dados em cache, retornar cache mesmo que expirado
    if (sheetCache.has(cacheKey)) {
      console.log(`📋 Retornando dados do cache expirado devido ao erro`);
      return sheetCache.get(cacheKey).data;
    }
    
    throw error;
  }
}

/**
 * Escreve dados em uma planilha do Google Sheets
 */
export async function writeSheetData(spreadsheetId, range, values, valueInputOption = 'RAW') {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=${valueInputOption}`;
  
  try {
    const response = await makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify({
        values: values
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao escrever dados na planilha (${range}):`, error);
    throw error;
  }
}

/**
 * Adiciona dados ao final de uma planilha
 */
export async function appendSheetData(spreadsheetId, range, values, valueInputOption = 'RAW') {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=${valueInputOption}`;
  
  try {
    const response = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        values: values
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao adicionar dados na planilha (${range}):`, error);
    throw error;
  }
}

/**
 * Valida se as credenciais do Google estão configuradas corretamente
 */
export async function validateGoogleCredentials() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Converter quebras de linha escapadas para quebras de linha reais
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const validation = {
    hasEmail: !!serviceAccountEmail,
    hasPrivateKey: !!privateKey,
    hasSpreadsheetId: !!spreadsheetId,
    isValid: false,
    error: null
  };

  if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
    validation.error = 'Credenciais incompletas';
    return validation;
  }

  try {
    // Testa a autenticação fazendo uma requisição simples
    await getGoogleAccessToken(serviceAccountEmail, privateKey);
    validation.isValid = true;
  } catch (error) {
    validation.error = error.message;
  }

  return validation;
}