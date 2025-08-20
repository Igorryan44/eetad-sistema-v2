/**
 * Headers CORS padrão para todas as funções
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

/**
 * Middleware para tratar requisições OPTIONS (preflight)
 */
export function handleCorsOptions(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    return res.status(200).end();
  }
  
  // Adicionar headers CORS a todas as respostas
  res.set(corsHeaders);
  next();
}

/**
 * Cria uma resposta com headers CORS
 */
export function createCorsResponse(data, status = 200, additionalHeaders = {}) {
  return {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...additionalHeaders
    },
    body: JSON.stringify(data)
  };
}

/**
 * Middleware Express para CORS personalizado
 */
export function corsMiddleware(req, res, next) {
  // Definir origem permitida baseada no ambiente
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
    'https://eetad-sistema-v2.vercel.app'
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, permitir qualquer origem
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, x-requested-with');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Responder a requisições preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}