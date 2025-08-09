// Script simples para testar acesso à planilha do Google Sheets
console.log('🔍 DIAGNÓSTICO DO PROBLEMA');
console.log('================================================================================');

console.log('📋 INFORMAÇÕES IDENTIFICADAS:');
console.log('✅ Credenciais configuradas no Supabase:');
console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL: Existe');
console.log('   - GOOGLE_PRIVATE_KEY: Existe');
console.log('   - GOOGLE_SHEETS_SPREADSHEET_ID: Existe');
console.log('');
console.log('❌ ERRO ENCONTRADO:');
console.log('   - Erro 404 ao acessar a aba "dados pessoais"');
console.log('   - Planilha ID: 1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA');
console.log('');

console.log('🔍 POSSÍVEIS CAUSAS:');
console.log('1. A planilha não foi compartilhada com a conta de serviço');
console.log('2. O ID da planilha está incorreto');
console.log('3. A aba "dados pessoais" não existe ou tem nome diferente');
console.log('');

console.log('📧 SOLUÇÃO RECOMENDADA:');
console.log('Compartilhe a planilha com a conta de serviço:');
console.log('   eetad-sistema@eetad-sistema-v2.iam.gserviceaccount.com');
console.log('');
console.log('📋 PASSOS PARA COMPARTILHAR:');
console.log('1. Abra a planilha no Google Sheets');
console.log('2. Clique em "Compartilhar" (botão azul no canto superior direito)');
console.log('3. Digite o email da conta de serviço:');
console.log('   eetad-sistema@eetad-sistema-v2.iam.gserviceaccount.com');
console.log('4. Defina a permissão como "Visualizador" ou "Editor"');
console.log('5. Clique em "Enviar"');
console.log('');

console.log('🔗 LINK DA PLANILHA:');
console.log('https://docs.google.com/spreadsheets/d/1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA/edit');
console.log('');

console.log('⚠️ IMPORTANTE:');
console.log('Após compartilhar a planilha, teste novamente a função get-pending-enrollments');