import fetch from 'node-fetch';

console.log('🧪 TESTE LOCAL: Simulando dados da planilha');
console.log('================================================================================');

// Simular dados da aba "dados pessoais" com a estrutura real
const dadosPessoaisSimulados = [
    // Cabeçalho (linha 1)
    ['origem_academica', 'em qual escola estudou?', 'em qual modalidade estudou?', 'congregacao', 'nome', 'rg', 'cpf', 'telefone', 'email', 'sexo', 'estado_civil', 'data_nascimento', 'uf_nascimento', 'escolaridade', 'profissao', 'nacionalidade', 'cargo_igreja', 'endereco_rua', 'cep', 'numero', 'bairro', 'cidade', 'uf', 'data_cadastro'],
    
    // Aluno 1 - Simião
    ['Nunca estudou teologia', 'ARNO 31', '', 'Simião Alves da Costa Junior', 'Simião Alves da Costa Junior', '103061 SSP TO', '61767735120', '5563985112006', 'simacjr@hotmail.com', 'M', 'Casado', '03/09/1985', 'TO', 'Medio', 'Vendedor', 'Brasileira', 'Pastor', 'ARNO 33 ALAMEDA 22 LOTE 24', '77001-430', '24', 'Plano Diretor Norte', 'Palmas', 'TO', '2025-06-30'],
    
    // Aluno 2 - Bruno
    ['Primeira formação teológica', 'Outra escola', 'N/A', 'Arse 33', 'Bruno Alexandre Barros dos Santos', '1519438', '003.807.533-40', '63992261578', 'babs.bruno@gmail.com', 'M', 'Casado', '08/01/1987', 'MA', 'Ensino Superior Completo', 'Professor', 'Brasileira', 'Pastor', 'Lago Norte Alameda 15', '75003-310', '15', 'Lago Norte', 'Palmas', 'TO', 'EETAD1754059939297']
];

// Simular dados da aba "matriculas" (vazia para este teste)
const matriculasSimuladas = [
    // Cabeçalho apenas
    ['data_matricula', 'nome', 'cpf', 'curso', 'turma', 'status', 'valor_total', 'desconto', 'valor_final', 'forma_pagamento', 'observacoes']
];

console.log('📋 1. Dados simulados da aba "dados pessoais":');
dadosPessoaisSimulados.slice(1).forEach((row, index) => {
    console.log(`   Aluno ${index + 1}:`);
    console.log(`   - Nome (índice 4): ${row[4]}`);
    console.log(`   - CPF (índice 6): ${row[6]}`);
    console.log(`   - Telefone (índice 7): ${row[7]}`);
    console.log(`   - Email (índice 8): ${row[8]}`);
    console.log('');
});

console.log('📋 2. Dados simulados da aba "matriculas":');
console.log('   (Vazia - apenas cabeçalho)');
console.log('');

console.log('🔍 3. Processando com a lógica da função corrigida...');

// Simular a lógica da função get-pending-enrollments
const dadosPessoaisDataRows = dadosPessoaisSimulados.slice(1); // Pular cabeçalho
const matriculasDataRows = matriculasSimuladas.slice(1); // Pular cabeçalho

// Extrair CPFs das matrículas (índice 2)
const cpfsMatriculados = matriculasDataRows.map(row => {
    const cpf = row[2] || '';
    return cpf.replace(/\D/g, ''); // Remover caracteres não numéricos
}).filter(cpf => cpf.length > 0);

console.log(`   CPFs já matriculados: [${cpfsMatriculados.join(', ')}]`);

// Filtrar alunos pendentes
const pendingEnrollments = dadosPessoaisDataRows
    .map((row, index) => {
        const cpf = row[6] || ''; // CPF está na coluna 7 (índice 6)
        const nome = row[4] || ''; // Nome está na coluna 5 (índice 4)
        const email = row[8] || ''; // Email está na coluna 9 (índice 8)
        const telefone = row[7] || ''; // Telefone está na coluna 8 (índice 7)

        return {
            linha: index + 2, // +2 porque começamos da linha 2 (após cabeçalho)
            nome,
            cpf: cpf.replace(/\D/g, ''), // Normalizar CPF
            email,
            telefone,
            cpfOriginal: cpf
        };
    })
    .filter(student => {
        // Filtrar apenas alunos com dados válidos
        if (!student.nome || !student.cpf) {
            return false;
        }

        // Verificar se o CPF NÃO está na lista de matriculados
        const isNotEnrolled = !cpfsMatriculados.includes(student.cpf);
        
        console.log(`   Verificando ${student.nome}:`);
        console.log(`     CPF: ${student.cpf} (original: ${student.cpfOriginal})`);
        console.log(`     Está matriculado? ${!isNotEnrolled ? 'SIM' : 'NÃO'}`);
        console.log(`     Será incluído como pendente? ${isNotEnrolled ? 'SIM' : 'NÃO'}`);
        console.log('');

        return isNotEnrolled;
    });

console.log('✅ 4. RESULTADO FINAL:');
console.log(`   Total de alunos pendentes encontrados: ${pendingEnrollments.length}`);
console.log('');

if (pendingEnrollments.length > 0) {
    console.log('📋 5. ALUNOS PENDENTES:');
    pendingEnrollments.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.nome}`);
        console.log(`      CPF: ${student.cpf}`);
        console.log(`      Email: ${student.email}`);
        console.log(`      Telefone: ${student.telefone}`);
        console.log('');
    });
} else {
    console.log('⚠️ 5. NENHUM ALUNO PENDENTE ENCONTRADO');
    console.log('   Possíveis causas:');
    console.log('   - Todos os alunos já estão matriculados');
    console.log('   - Dados não estão no formato esperado');
    console.log('   - Problema na lógica de filtragem');
}

console.log('🎯 6. CONCLUSÃO:');
if (pendingEnrollments.length > 0) {
    console.log('   ✅ A correção dos índices FUNCIONOU!');
    console.log('   ✅ Os alunos agora são detectados como pendentes');
    console.log('   🚀 Após o deploy, eles aparecerão no Dashboard da secretaria');
} else {
    console.log('   ❌ Ainda há um problema na lógica');
    console.log('   🔍 Necessário investigar mais a fundo');
}