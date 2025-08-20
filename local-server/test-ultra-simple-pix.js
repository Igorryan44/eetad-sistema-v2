import { createStaticPix } from 'pix-utils';

// Configurações do PIX
const CHAVE_PIX = 'simacjr@gmail.com';
const BENEFICIARIO = 'EETAD';
const CIDADE = 'SAO PAULO';

console.log('🧪 Testando PIX ultra-simples...');

// PIX ultra-simples: APENAS chave PIX
const pixObject = createStaticPix({
  merchantName: BENEFICIARIO,
  merchantCity: CIDADE,
  pixKey: CHAVE_PIX
  // SEM infoAdicional
  // SEM transactionAmount
});

// Converter para string BR Code
const pixUltraSimples = pixObject.toBRCode();

console.log('\n📋 PIX Ultra-Simples:');
console.log('✅ Código gerado:', pixUltraSimples);
console.log('📏 Tamanho:', pixUltraSimples.length, 'caracteres');
console.log('🔍 Contém chave:', pixUltraSimples.includes(CHAVE_PIX));
console.log('🔍 Contém beneficiário:', pixUltraSimples.includes(BENEFICIARIO));
console.log('🔍 Contém cidade:', pixUltraSimples.includes(CIDADE));

// Comparação com o código problemático
const codigoProblematico = '00020126800014br.gov.bcb.pix0121simacjr@gmail.com0273Atos dos Apóstolos Simião Alves da Costa Junior  082025 ID:0820255120W1F2520400005303986540545.005802BR5905EETAD6009SAO PAULO622105030820255120W1F2F38F';

console.log('\n📊 Comparação:');
console.log('❌ Código problemático:', codigoProblematico.length, 'caracteres');
console.log('✅ Código ultra-simples:', pixUltraSimples.length, 'caracteres');
console.log('📉 Redução:', codigoProblematico.length - pixUltraSimples.length, 'caracteres');
console.log('📈 Redução percentual:', Math.round((1 - pixUltraSimples.length / codigoProblematico.length) * 100) + '%');

console.log('\n🎯 Resultado: PIX ultra-simples com apenas', pixUltraSimples.length, 'caracteres!');