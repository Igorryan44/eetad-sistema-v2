import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import { appendSheetData, writeSheetData, readSheetDataWithRetry } from '../utils/google-auth.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('📝 Salvando dados pessoais do aluno:', req.body);

    const studentData = req.body;
    const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    const DADOS_PESSOAIS_SHEET = 'dados pessoais';

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas');
    }

    // Preparar dados para inserção
    const currentTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    // Gerar QR Code PIX estático para o aluno
    let qrCodePix = '';
    try {
      if (studentData.nome && studentData.cpf) {
        const pixResponse = await fetch('http://localhost:3003/functions/generate-static-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: studentData.nome,
            cpf: studentData.cpf,
            valor: 45.00 // Valor padrão dos livros
          })
        });
        
        if (pixResponse.ok) {
          const pixData = await pixResponse.json();
          qrCodePix = pixData.qr_code_base64 || '';
          console.log(`✅ QR Code PIX gerado para ${studentData.nome}`);
        } else {
          console.log(`⚠️ Erro ao gerar QR Code PIX para ${studentData.nome}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro ao gerar QR Code PIX: ${error.message}`);
    }

    const rowData = [
      studentData.origem_academica || '', // A
      studentData.escola_anterior || '', // B
      studentData.modalidade_anterior || '', // C
      studentData.congregacao || '', // D
      studentData.nome || '', // E
      studentData.rg || '', // F
      studentData.cpf || '', // G
      studentData.telefone || '', // H
      studentData.email || '', // I
      studentData.sexo || '', // J
      studentData.estado_civil || '', // K
      studentData.data_nascimento || '', // L
      studentData.uf_nascimento || '', // M
      studentData.escolaridade || '', // N
      studentData.profissao || '', // O
      studentData.nacionalidade || '', // P
      studentData.cargo_igreja || '', // Q
      studentData.endereco_rua || '', // R
      studentData.cep || '', // S
      studentData.numero || '', // T
      studentData.bairro || '', // U
      studentData.cidade || '', // V
      studentData.uf || '', // W
      currentTimestamp, // X - data_cadastro
      'Pendente', // Y - Status inicial
      qrCodePix // Z - QR Code PIX estático
    ];

    // Descobrir a próxima linha vazia usando lógica mais precisa
    const currentData = await readSheetDataWithRetry(GOOGLE_SHEETS_SPREADSHEET_ID, `${DADOS_PESSOAIS_SHEET}!A:Z`);
    
    // Contar apenas linhas com dados válidos (nome OU cpf preenchidos)
    let validDataRows = 0;
    for (let i = 1; i < currentData.length; i++) { // Começar da linha 2 (índice 1)
      const row = currentData[i];
      const hasName = row[4] && row[4].trim() !== ''; // Coluna E - nome
      const hasCpf = row[6] && row[6].trim() !== '';   // Coluna G - cpf
      if (hasName || hasCpf) {
        validDataRows++;
      }
    }
    
    // A próxima linha disponível é: validDataRows + 2 (linha 1 é cabeçalho, então linha 2 é a primeira de dados)
    const nextRow = Math.min(validDataRows + 2, 1013);
    const specificRange = `${DADOS_PESSOAIS_SHEET}!A${nextRow}:Z${nextRow}`;
    
    console.log(`📍 Salvando na linha ${nextRow} com range: ${specificRange}`);
    await writeSheetData(GOOGLE_SHEETS_SPREADSHEET_ID, specificRange, [rowData]);

    console.log('✅ Dados pessoais salvos com sucesso');

    res.json({
      success: true,
      message: 'Dados pessoais salvos com sucesso',
      timestamp: currentTimestamp
    });

  } catch (error) {
    console.error('❌ Erro ao salvar dados pessoais:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'save-student-personal-data',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;