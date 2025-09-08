import { createStaticPix, hasError } from 'pix-utils';

console.log('🔍 Análise Detalhada do PIX - Investigando Incompatibilidade com Bancos\n');

const CHAVE_PIX = 'simacjr@gmail.com';
const VALOR_PIX = 45.00;

/**
 * Validação detalhada do código PIX seguindo especificações do Banco Central
 */
function detailedPixValidation(pixCode) {
  console.log('📋 Analisando código PIX:', pixCode);
  console.log('📏 Tamanho:', pixCode.length, 'caracteres\n');
  
  const issues = [];
  
  // 1. Validar Payload Format Indicator
  if (!pixCode.startsWith('00020126')) {
    issues.push('❌ Payload Format Indicator inválido (deve começar com 00020126)');
  } else {
    console.log('✅ Payload Format Indicator: OK');
  }
  
  // 2. Validar Merchant Account Information
  const merchantAccountMatch = pixCode.match(/26(\d{2})/);
  if (merchantAccountMatch) {
    const merchantLength = parseInt(merchantAccountMatch[1]);
    const merchantStart = pixCode.indexOf('26' + merchantAccountMatch[1]);
    const merchantInfo = pixCode.substr(merchantStart + 4, merchantLength);
    
    if (!merchantInfo.includes('br.gov.bcb.pix')) {
      issues.push('❌ Merchant Account Information não contém br.gov.bcb.pix');
    } else {
      console.log('✅ Merchant Account Information: OK');
    }
    
    if (!merchantInfo.includes(CHAVE_PIX)) {
      issues.push('❌ Chave PIX não encontrada no Merchant Account Information');
    } else {
      console.log('✅ Chave PIX presente: OK');
    }
  } else {
    issues.push('❌ Merchant Account Information não encontrado');
  }
  
  // 3. Validar Merchant Category Code
  if (!pixCode.includes('52040000')) {
    issues.push('❌ Merchant Category Code inválido (esperado: 52040000)');
  } else {
    console.log('✅ Merchant Category Code: OK');
  }
  
  // 4. Validar Transaction Currency
  if (!pixCode.includes('5303986')) {
    issues.push('❌ Transaction Currency inválido (esperado: 5303986 para BRL)');
  } else {
    console.log('✅ Transaction Currency: OK');
  }
  
  // 5. Validar Transaction Amount
  const amountMatch = pixCode.match(/54(\d{2})(\d+\.?\d*)/);
  if (amountMatch) {
    const amountLength = parseInt(amountMatch[1]);
    const amount = amountMatch[2];
    
    if (amount !== VALOR_PIX.toFixed(2)) {
      issues.push(`❌ Valor incorreto (encontrado: ${amount}, esperado: ${VALOR_PIX.toFixed(2)})`);
    } else {
      console.log('✅ Transaction Amount: OK');
    }
  } else {
    issues.push('❌ Transaction Amount não encontrado');
  }
  
  // 6. Validar Country Code
  if (!pixCode.includes('5802BR')) {
    issues.push('❌ Country Code inválido (esperado: 5802BR)');
  } else {
    console.log('✅ Country Code: OK');
  }
  
  // 7. Validar Merchant Name
  const merchantNameMatch = pixCode.match(/59(\d{2})([A-Z0-9\s]+)/);
  if (merchantNameMatch) {
    const nameLength = parseInt(merchantNameMatch[1]);
    const merchantName = merchantNameMatch[2];
    
    if (merchantName.length !== nameLength) {
      issues.push(`❌ Merchant Name com tamanho incorreto (declarado: ${nameLength}, real: ${merchantName.length})`);
    } else {
      console.log('✅ Merchant Name: OK');
    }
  } else {
    issues.push('❌ Merchant Name não encontrado');
  }
  
  // 8. Validar Merchant City
  const merchantCityMatch = pixCode.match(/60(\d{2})([A-Z0-9\s]+)/);
  if (merchantCityMatch) {
    const cityLength = parseInt(merchantCityMatch[1]);
    const merchantCity = merchantCityMatch[2];
    
    if (merchantCity.length !== cityLength) {
      issues.push(`❌ Merchant City com tamanho incorreto (declarado: ${cityLength}, real: ${merchantCity.length})`);
    } else {
      console.log('✅ Merchant City: OK');
    }
  } else {
    issues.push('❌ Merchant City não encontrado');
  }
  
  // 9. Validar CRC16
  const crc = pixCode.slice(-4);
  if (!/^[0-9A-F]{4}$/.test(crc)) {
    issues.push(`❌ CRC16 inválido (deve ser 4 dígitos hexadecimais): ${crc}`);
  } else {
    console.log('✅ CRC16 formato: OK');
    
    // Calcular CRC16 para verificar se está correto
    const payloadWithoutCrc = pixCode.slice(0, -4);
    const calculatedCrc = calculateCRC16(payloadWithoutCrc);
    
    if (crc !== calculatedCrc) {
      issues.push(`❌ CRC16 incorreto (calculado: ${calculatedCrc}, encontrado: ${crc})`);
    } else {
      console.log('✅ CRC16 valor: OK');
    }
  }
  
  return issues;
}

/**
 * Função para calcular CRC16 conforme especificação do PIX
 */
function calculateCRC16(payload) {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Testar diferentes configurações de PIX
 */
async function testDifferentPixConfigurations() {
  const configurations = [
    {
      name: 'PIX Ultra-Simples (sem info adicional)',
      params: {
        merchantName: 'EETAD',
        merchantCity: 'SAO PAULO',
        pixKey: CHAVE_PIX,
        transactionAmount: VALOR_PIX
      }
    },
    {
      name: 'PIX com nome mais curto',
      params: {
        merchantName: 'EETAD',
        merchantCity: 'PALMAS',
        pixKey: CHAVE_PIX,
        transactionAmount: VALOR_PIX
      }
    },
    {
      name: 'PIX sem valor (dinâmico)',
      params: {
        merchantName: 'EETAD',
        merchantCity: 'SAO PAULO',
        pixKey: CHAVE_PIX
      }
    }
  ];
  
  for (const config of configurations) {
    console.log(`\n🧪 Testando: ${config.name}`);
    console.log('=' .repeat(50));
    
    try {
      const pixObject = createStaticPix(config.params);
      
      if (hasError(pixObject)) {
        console.log('❌ Erro na geração:', pixObject.error);
        continue;
      }
      
      const pixCode = pixObject.toBRCode();
      const issues = detailedPixValidation(pixCode);
      
      console.log(`\n📊 Resultado: ${issues.length === 0 ? '✅ SEM PROBLEMAS' : '❌ ' + issues.length + ' PROBLEMA(S)'}`);
      
      if (issues.length > 0) {
        console.log('\n🔍 Problemas encontrados:');
        issues.forEach(issue => console.log('  ', issue));
      }
      
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
  }
}

// Executar análise
await testDifferentPixConfigurations();

// Testar com dados reais do sistema
console.log('\n\n🔍 TESTANDO CÓDIGO ATUAL DO SISTEMA');
console.log('=' .repeat(50));

try {
  const response = await fetch('http://localhost:3003/functions/generate-pix-with-tracking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nome: 'João Silva Test',
      cpf: '123.456.789-00',
      valor: 45
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('\n📱 Código gerado pelo sistema:');
    const issues = detailedPixValidation(data.pix_code);
    
    console.log(`\n📊 Sistema atual: ${issues.length === 0 ? '✅ SEM PROBLEMAS' : '❌ ' + issues.length + ' PROBLEMA(S)'}`);
    
    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS NO SISTEMA ATUAL:');
      issues.forEach(issue => console.log('  ', issue));
    }
  } else {
    console.log('❌ Erro ao testar sistema atual');
  }
} catch (error) {
  console.log('❌ Erro na conexão:', error.message);
}

console.log('\n🎯 Análise concluída!');