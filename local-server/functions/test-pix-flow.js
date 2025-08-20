import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

router.post('/', async (req, res) => {
  try {
    console.log('🧪 Testando fluxo completo de PIX estático:', req.body);

    const studentData = req.body;
    
    // Validar dados obrigatórios
    if (!studentData.nome || !studentData.cpf) {
      return res.status(400).json({
        success: false,
        error: 'Nome e CPF são obrigatórios'
      });
    }

    // Gerar QR Code PIX estático para o aluno
    let pixResult = null;
    try {
      console.log(`📱 Gerando PIX para: ${studentData.nome}, CPF: ${studentData.cpf}`);
      
      const pixResponse = await fetch('http://localhost:3003/functions/generate-static-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: studentData.nome,
          cpf: studentData.cpf,
          valor: studentData.valor || 45.00 // Valor padrão dos livros
        })
      });
      
      if (pixResponse.ok) {
        pixResult = await pixResponse.json();
        console.log(`✅ QR Code PIX gerado com sucesso para ${studentData.nome}`);
        console.log(`📊 Código PIX: ${pixResult.pix_code.substring(0, 50)}...`);
        console.log(`🔑 Chave PIX: ${pixResult.chave_pix}`);
        console.log(`💰 Valor: R$ ${pixResult.valor}`);
      } else {
        const errorText = await pixResponse.text();
        throw new Error(`Erro na API PIX: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao gerar QR Code PIX: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: `Erro ao gerar PIX: ${error.message}`
      });
    }

    // Simular salvamento dos dados (sem Google Sheets)
    const currentTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    const simulatedData = {
      nome: studentData.nome,
      cpf: studentData.cpf,
      email: studentData.email,
      telefone: studentData.telefone,
      endereco: studentData.endereco,
      cidade: studentData.cidade,
      estado: studentData.estado,
      cep: studentData.cep,
      data_nascimento: studentData.data_nascimento,
      estado_civil: studentData.estado_civil,
      profissao: studentData.profissao,
      igreja: studentData.igreja,
      pastor: studentData.pastor,
      como_conheceu: studentData.como_conheceu,
      observacoes: studentData.observacoes,
      data_cadastro: currentTimestamp,
      status: 'Pendente',
      qr_code_pix: pixResult.qr_code_base64,
      pix_code: pixResult.pix_code,
      chave_pix: pixResult.chave_pix,
      valor_pix: pixResult.valor
    };

    console.log('✅ Dados simulados preparados com sucesso');
    console.log('📋 Resumo do cadastro:');
    console.log(`   👤 Nome: ${simulatedData.nome}`);
    console.log(`   🆔 CPF: ${simulatedData.cpf}`);
    console.log(`   📧 Email: ${simulatedData.email}`);
    console.log(`   💰 PIX: R$ ${simulatedData.valor_pix}`);
    console.log(`   🔑 Chave: ${simulatedData.chave_pix}`);
    console.log(`   📱 QR Code: ${simulatedData.qr_code_pix ? 'Gerado' : 'Não gerado'}`);

    res.json({
      success: true,
      message: 'Fluxo de PIX estático testado com sucesso',
      data: simulatedData,
      timestamp: currentTimestamp
    });

  } catch (error) {
    console.error('❌ Erro no teste do fluxo PIX:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'test-pix-flow',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;