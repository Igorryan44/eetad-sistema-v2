import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { clearSheetCache } from '../utils/google-auth.js';

const router = express.Router();

// Aplicar CORS
router.use(corsMiddleware);

// Rota para limpar cache
router.post('/', (req, res) => {
  try {
    console.log('🧹 Limpando cache das planilhas...');
    clearSheetCache();
    console.log('✅ Cache limpo com sucesso');
    
    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para verificar status
router.get('/health', (req, res) => {
  res.json({
    function: 'clear-cache',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;