import { createStaticPix, hasError } from 'pix-utils';

// Configurações de teste
const CHAVE_PIX = 'simacjr@gmail.com';
const VALOR_PIX = 45.00;
const BENEFICIARIO = 'EETAD';
const CIDADE = 'SAO PAULO';

function testPixGeneration() {
  console.log('🧪 Testando geração de PIX...\n');
  
  // Teste 1: PIX básico
  console.log('📋 Teste 1: PIX básico');
  try {
    const basicPix = createStaticPix({
      merchantName: BENEFICIARIO,
      merchantCity: CIDADE,
      pixKey: CHAVE_PIX,
      transactionAmount: VALOR_PIX
    });
    
    if (hasError(basicPix)) {
      console.error('❌ Erro no PIX básico:', basicPix);
    } else {
      const code = basicPix.toBRCode();
      console.log('✅ PIX básico gerado com sucesso');
      console.log('   Código:', code);
      console.log('   Tamanho:', code.length);
      console.log('   Contém chave:', code.includes(CHAVE_PIX));
    }
  } catch (error) {
    console.error('❌ Erro no teste básico:', error.message);
  }
  
  console.log('\n📋 Teste 2: PIX com identificador');
  try {
    const pixWithId = createStaticPix({
      merchantName: BENEFICIARIO,
      merchantCity: CIDADE,
      pixKey: CHAVE_PIX,
      infoAdicional: '082025512037K25',
      transactionAmount: VALOR_PIX
    });
    
    if (hasError(pixWithId)) {
      console.error('❌ Erro no PIX com ID:', pixWithId);
    } else {
      const code = pixWithId.toBRCode();
      console.log('✅ PIX com ID gerado com sucesso');
      console.log('   Código:', code);
      console.log('   Tamanho:', code.length);
      console.log('   Contém chave:', code.includes(CHAVE_PIX));
      console.log('   Contém ID:', code.includes('082025512037K25'));
    }
  } catch (error) {
    console.error('❌ Erro no teste com ID:', error.message);
  }
  
  console.log('\n📋 Teste 3: Validação da chave PIX');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(CHAVE_PIX)) {
    console.log('✅ Chave PIX é um email válido:', CHAVE_PIX);
  } else {
    console.log('❌ Chave PIX não é um email válido:', CHAVE_PIX);
  }
  
  console.log('\n📋 Teste 4: Validação dos parâmetros');
  console.log('   Beneficiário:', BENEFICIARIO, '(tamanho:', BENEFICIARIO.length, ')');
  console.log('   Cidade:', CIDADE, '(tamanho:', CIDADE.length, ')');
  console.log('   Valor:', VALOR_PIX);
  console.log('   Chave PIX:', CHAVE_PIX, '(tamanho:', CHAVE_PIX.length, ')');
}

// Executar teste
testPixGeneration();