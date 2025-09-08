import { createStaticPix, hasError } from 'pix-utils';
import QRCode from 'qrcode';

console.log('🧪 Teste PIX Ultra-Simples - Versão Real\n');

const CHAVE_PIX = 'simacjr@gmail.com';
const VALOR_PIX = 45.00;

// Teste 1: PIX ultra-simples
console.log('📋 Teste 1: PIX Ultra-Simples (configuração minimalista)');
try {
  const pixObject = createStaticPix({
    merchantName: 'EETAD',
    merchantCity: 'SAO PAULO', 
    pixKey: CHAVE_PIX,
    transactionAmount: VALOR_PIX
  });
  
  if (hasError(pixObject)) {
    console.error('❌ Erro:', pixObject.error);
  } else {
    const pixCode = pixObject.toBRCode();
    console.log('✅ PIX gerado com sucesso');
    console.log('   Código:', pixCode);
    console.log('   Tamanho:', pixCode.length, 'caracteres');
    
    // Testar geração de QR Code
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 256
      });
      console.log('✅ QR Code gerado com sucesso');
      console.log('   Base64 length:', qrCodeDataUrl.length);
    } catch (qrError) {
      console.error('❌ Erro no QR Code:', qrError.message);
    }
  }
} catch (error) {
  console.error('❌ Erro geral:', error.message);
}

// Teste 2: PIX sem valor (mais simples ainda)
console.log('\n📋 Teste 2: PIX Dinâmico (sem valor fixo)');
try {
  const pixObject = createStaticPix({
    merchantName: 'EETAD',
    merchantCity: 'SAO PAULO',
    pixKey: CHAVE_PIX
    // Sem transactionAmount
  });
  
  if (hasError(pixObject)) {
    console.error('❌ Erro:', pixObject.error);
  } else {
    const pixCode = pixObject.toBRCode();
    console.log('✅ PIX dinâmico gerado com sucesso');
    console.log('   Código:', pixCode);
    console.log('   Tamanho:', pixCode.length, 'caracteres');
    console.log('   É mais simples que o com valor:', pixCode.length < 120 ? '✅' : '❌');
  }
} catch (error) {
  console.error('❌ Erro geral:', error.message);
}

// Teste 3: Validação manual EMV
console.log('\n📋 Teste 3: Análise manual do EMV');

function parseEMV(pixCode) {
  console.log('🔍 Analisando estrutura EMV real...');
  console.log('Código completo:', pixCode);
  console.log('');
  
  let pos = 0;
  const fields = {};
  
  while (pos < pixCode.length - 4) { // -4 para CRC
    const id = pixCode.substr(pos, 2);
    pos += 2;
    
    const length = parseInt(pixCode.substr(pos, 2), 10);
    pos += 2;
    
    const value = pixCode.substr(pos, length);
    pos += length;
    
    fields[id] = { length, value };
    
    console.log(`Campo ${id}: length=${length}, value="${value}"`);
    
    if (pos >= pixCode.length - 4) break;
  }
  
  const crc = pixCode.slice(-4);
  console.log(`CRC: ${crc}`);
  
  return fields;
}

// Gerar PIX para análise
const testPix = createStaticPix({
  merchantName: 'EETAD',
  merchantCity: 'SAO PAULO',
  pixKey: CHAVE_PIX,
  transactionAmount: VALOR_PIX
});

if (!hasError(testPix)) {
  const testCode = testPix.toBRCode();
  parseEMV(testCode);
}

console.log('\n🎯 Conclusão: Testando PIX mais simples possível!');