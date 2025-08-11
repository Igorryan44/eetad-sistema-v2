import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

/**
 * Gera um JWT para autenticação com a API do Google
 */
export async function getGoogleJwt(serviceAccountEmail, privateKey) {
  if (!serviceAccountEmail || !privateKey) {
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
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  } catch (error) {
    console.error('Erro ao gerar JWT:', error);
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
 * Faz uma requisição autenticada para a API do Google Sheets
 */
export async function makeAuthenticatedRequest(url, options = {}) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
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
 * Lê dados de uma planilha do Google Sheets
 */
export async function readSheetData(spreadsheetId, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  try {
    const response = await makeAuthenticatedRequest(url);
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error(`Erro ao ler dados da planilha (${range}):`, error);
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