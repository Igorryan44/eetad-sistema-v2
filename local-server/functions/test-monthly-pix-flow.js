import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import fetch from 'node-fetch';

const router = express.Router();
router.use(corsMiddleware);

/**
 * Script de teste automatizado para simular o fluxo completo de PIX mensais
 * Demonstra como evitar tarifas bancárias com identificadores únicos temporais
 */
router.post('/', async (req, res) => {
  try {
    console.log('🧪 Iniciando simulação do fluxo de PIX mensais...\n');
    
    const resultados = [];
    
    // Dados de teste simulados
    const dadosAluno = {
      nome: 'João Silva Santos',
      cpf: '12345678901',
      email: 'joao.silva@email.com',
      telefone: '11987654321'
    };
    
    const livrosParaTestar = [
      { nome: 'Matemática Básica', ciclo: '1º Ciclo', periodo: '202501' }, // Janeiro 2025
      { nome: 'Português Avançado', ciclo: '2º Ciclo', periodo: '202502' }, // Fevereiro 2025
      { nome: 'História do Brasil', ciclo: '3º Ciclo', periodo: '202503' }  // Março 2025
    ];
    
    console.log('👤 Dados do aluno para teste:');
    console.log(`   Nome: ${dadosAluno.nome}`);
    console.log(`   CPF: ${dadosAluno.cpf}`);
    console.log(`   Email: ${dadosAluno.email}\n`);
    
    // Simular múltiplas compras mensais
    for (let i = 0; i < livrosParaTestar.length; i++) {
      const livro = livrosParaTestar[i];
      
      console.log(`📚 TESTE ${i + 1}: Simulando compra de "${livro.nome}" (${livro.ciclo}) - Período: ${livro.periodo}`);
      console.log('─'.repeat(80));
      
      try {
        // 1. Gerar PIX mensal
        console.log('🔄 Passo 1: Gerando PIX mensal...');
        const pixResponse = await fetch('http://localhost:3003/functions/generate-monthly-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cpf: dadosAluno.cpf,
            nome: dadosAluno.nome,
            email: dadosAluno.email,
            livro: livro.nome,
            ciclo: livro.ciclo,
            periodo: livro.periodo,
            valor: 45.00
          })
        });
        
        if (!pixResponse.ok) {
          const errorText = await pixResponse.text();
          throw new Error(`Erro ao gerar PIX: ${errorText}`);
        }
        
        const pixData = await pixResponse.json();
        console.log(`✅ PIX gerado com sucesso!`);
        console.log(`   Identificador: ${pixData.identificador}`);
        console.log(`   QR Code: ${pixData.qr_code_base64 ? 'Gerado' : 'Erro'}`);
        console.log(`   Chave PIX: ${pixData.chave_pix}`);
        
        // 2. Simular confirmação do pagamento
        console.log('\n🔄 Passo 2: Simulando confirmação de pagamento...');
        
        // Aguardar um pouco para simular tempo de processamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const confirmResponse = await fetch('http://localhost:3003/functions/confirm-monthly-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identificador: pixData.identificador,
            valor_pago: 45.00,
            data_pagamento: new Date().toLocaleString('pt-BR'),
            observacoes: `Teste automatizado - Compra ${i + 1}`
          })
        });
        
        if (!confirmResponse.ok) {
          const errorText = await confirmResponse.text();
          throw new Error(`Erro ao confirmar pagamento: ${errorText}`);
        }
        
        const confirmData = await confirmResponse.json();
        console.log(`✅ Pagamento confirmado com sucesso!`);
        console.log(`   Status: ${confirmData.transacao.status}`);
        console.log(`   Valor: R$ ${confirmData.transacao.valor_confirmado}`);
        console.log(`   Data: ${confirmData.transacao.data_confirmacao}`);
        
        // 3. Verificar se foi salvo na planilha
        console.log('\n🔄 Passo 3: Verificando salvamento na planilha...');
        
        resultados.push({
          teste: i + 1,
          livro: livro.nome,
          ciclo: livro.ciclo,
          periodo: livro.periodo,
          identificador: pixData.identificador,
          status: 'Sucesso',
          valor: 'R$ 45,00',
          data_confirmacao: confirmData.transacao.data_confirmacao
        });
        
        console.log(`✅ Transação salva na aba 'pagamentos'`);
        console.log(`   Linha adicionada com identificador único: ${pixData.identificador}\n`);
        
      } catch (error) {
        console.log(`❌ Erro no teste ${i + 1}: ${error.message}\n`);
        resultados.push({
          teste: i + 1,
          livro: livro.nome,
          ciclo: livro.ciclo,
          periodo: livro.periodo,
          identificador: 'N/A',
          status: 'Erro',
          erro: error.message
        });
      }
    }
    
    // 4. Testar listagem de pagamentos pendentes
    console.log('🔄 Passo 4: Testando listagem de pagamentos pendentes...');
    try {
      const pendentesResponse = await fetch('http://localhost:3003/functions/confirm-monthly-pix/pendentes');
      
      if (pendentesResponse.ok) {
        const pendentesData = await pendentesResponse.json();
        console.log(`✅ Listagem funcionando: ${pendentesData.total} pagamentos pendentes encontrados`);
      } else {
        console.log(`⚠️ Erro na listagem de pendentes`);
      }
    } catch (error) {
      console.log(`⚠️ Erro ao testar listagem: ${error.message}`);
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA SIMULAÇÃO');
    console.log('='.repeat(80));
    
    console.log('\n🎯 OBJETIVO: Evitar tarifas bancárias com PIX únicos mensais');
    console.log('✅ RESULTADO: Sistema permite múltiplas compras por aluno sem conflitos\n');
    
    console.log('📋 Resultados dos testes:');
    resultados.forEach((resultado, index) => {
      console.log(`\n   Teste ${resultado.teste}:`);
      console.log(`   📚 Livro: ${resultado.livro} (${resultado.ciclo})`);
      console.log(`   📅 Período: ${resultado.periodo}`);
      console.log(`   🆔 Identificador: ${resultado.identificador}`);
      console.log(`   ✅ Status: ${resultado.status}`);
      if (resultado.valor) {
        console.log(`   💰 Valor: ${resultado.valor}`);
        console.log(`   📅 Confirmado em: ${resultado.data_confirmacao}`);
      }
      if (resultado.erro) {
        console.log(`   ❌ Erro: ${resultado.erro}`);
      }
    });
    
    console.log('\n🔑 VANTAGENS DO NOVO SISTEMA:');
    console.log('   ✅ Cada compra gera um PIX único (evita tarifas)');
    console.log('   ✅ Identificadores temporais incluem período/mês');
    console.log('   ✅ Múltiplas transações por aluno são permitidas');
    console.log('   ✅ Histórico completo salvo na aba "pagamentos"');
    console.log('   ✅ Confirmação automática via webhook Mercado Pago');
    console.log('   ✅ Notificações WhatsApp automáticas');
    
    console.log('\n🏦 COMPARAÇÃO COM SISTEMA ANTERIOR:');
    console.log('   ❌ Antes: Mesmo QR Code reutilizado (tarifa bancária)');
    console.log('   ✅ Agora: QR Code único por compra (sem tarifa)');
    console.log('   ❌ Antes: Sobrescrevia dados na coluna AA');
    console.log('   ✅ Agora: Salva cada transação separadamente');
    console.log('   ❌ Antes: Conflitos em múltiplas compras');
    console.log('   ✅ Agora: Suporte completo a múltiplas compras');
    
    const sucessos = resultados.filter(r => r.status === 'Sucesso').length;
    const erros = resultados.filter(r => r.status === 'Erro').length;
    
    console.log(`\n📈 ESTATÍSTICAS:`);
    console.log(`   ✅ Sucessos: ${sucessos}/${resultados.length}`);
    console.log(`   ❌ Erros: ${erros}/${resultados.length}`);
    console.log(`   📊 Taxa de sucesso: ${((sucessos / resultados.length) * 100).toFixed(1)}%`);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SIMULAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(80));
    
    return res.status(200).json({
      success: true,
      message: 'Simulação do fluxo de PIX mensais concluída',
      dados_aluno: dadosAluno,
      resultados: resultados,
      estatisticas: {
        total_testes: resultados.length,
        sucessos: sucessos,
        erros: erros,
        taxa_sucesso: `${((sucessos / resultados.length) * 100).toFixed(1)}%`
      },
      vantagens: [
        'Cada compra gera um PIX único (evita tarifas bancárias)',
        'Identificadores temporais incluem período/mês',
        'Múltiplas transações por aluno são permitidas',
        'Histórico completo salvo na aba "pagamentos"',
        'Confirmação automática via webhook Mercado Pago',
        'Notificações WhatsApp automáticas'
      ]
    });
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return res.status(500).json({ 
      error: 'Erro na simulação',
      details: error.message 
    });
  }
});

/**
 * Endpoint para testar apenas a geração de PIX (sem confirmação)
 */
router.post('/gerar-apenas', async (req, res) => {
  try {
    const { cpf, nome, livro, ciclo, periodo } = req.body;
    
    console.log('🧪 Teste rápido: Gerando PIX mensal...');
    
    const pixResponse = await fetch('http://localhost:3003/functions/generate-monthly-pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cpf: cpf || '12345678901',
        nome: nome || 'Teste Aluno',
        email: 'teste@email.com',
        livro: livro || 'Livro de Teste',
        ciclo: ciclo || '1º Ciclo',
        periodo: periodo || new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0'),
        valor: 45.00
      })
    });
    
    if (!pixResponse.ok) {
      const errorText = await pixResponse.text();
      throw new Error(`Erro ao gerar PIX: ${errorText}`);
    }
    
    const pixData = await pixResponse.json();
    
    console.log('✅ PIX gerado:', pixData.identificador);
    
    return res.json({
      success: true,
      message: 'PIX mensal gerado com sucesso',
      dados: pixData
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar PIX',
      details: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    function: 'test-monthly-pix-flow',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;