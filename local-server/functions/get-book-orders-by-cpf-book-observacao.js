/**
 * 📚 Função: get-book-orders-by-cpf-book-observacao
 * Busca pedidos duplicados na planilha Google Sheets
 */

import { Router } from 'express';
import { readSheetData } from '../utils/google-auth.js';

const router = Router();



router.post('/', async (req, res) => {
  try {
    console.log('📚 [get-book-orders-by-cpf-book-observacao] Iniciando busca por duplicados...');
    
    const { cpf, livro, observacao } = req.body;
    
    if (!cpf || !livro || !observacao) {
      console.error('📚 [get-book-orders-by-cpf-book-observacao] Dados incompletos:', { cpf, livro, observacao });
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('📚 [get-book-orders-by-cpf-book-observacao] GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      return res.status(500).json({ error: 'Configuração incompleta da função' });
    }

    // Carregar dados da aba "pedidos"
    const rows = await readSheetData(spreadsheetId, 'pedidos');
    
    if (rows.length === 0) {
      console.log('📚 [get-book-orders-by-cpf-book-observacao] Nenhum dado encontrado na planilha');
      return res.json([]);
    }

    // Mapear índices dos cabeçalhos
    const headerRow = rows[0].map(h => h.trim().toLowerCase());
    const idxCPF = headerRow.findIndex(h => h.includes('cpf'));
    const idxLivro = headerRow.findIndex(h => h.includes('livro'));
    const idxObs = headerRow.findIndex(h => h.includes('observacao') || h.includes('observação'));

    if (idxCPF === -1 || idxLivro === -1 || idxObs === -1) {
      console.error('📚 [get-book-orders-by-cpf-book-observacao] Cabeçalhos não encontrados:', headerRow);
      return res.status(500).json({ error: 'Cabeçalhos não encontrados na planilha!' });
    }

    // Procurar duplicados
    const duplicated = rows.slice(1).filter(r => (
      (r[idxCPF] || '').replace(/\D/g, '') === cpf.replace(/\D/g, '') &&
      (r[idxLivro] || '').trim().toLowerCase() === livro.trim().toLowerCase() &&
      (r[idxObs] || '').trim().toLowerCase() === observacao.trim().toLowerCase()
    ));

    console.log(`📚 [get-book-orders-by-cpf-book-observacao] Encontrados ${duplicated.length} pedidos duplicados para CPF: ${cpf}, Livro: ${livro}, Observação: ${observacao}`);

    res.json(duplicated);
    
  } catch (error) {
    console.error('📚 [get-book-orders-by-cpf-book-observacao] Erro:', error);
    res.status(500).json({ error: `Erro: ${error.message}` });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Função get-book-orders-by-cpf-book-observacao operacional' });
});

export default router;