// Script para testar diretamente o Google Sheets
console.log('🔍 Testando acesso direto ao Google Sheets...');

// Simulação das credenciais (você deve configurar as variáveis de ambiente)
const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
const DADOS_PESSOAIS_SHEET = 'dados pessoais';
const MATRICULAS_SHEET = 'matriculas';

async function testGoogleSheetsAccess() {
    try {
        console.log('📊 Verificando variáveis de ambiente...');
        
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', GOOGLE_SERVICE_ACCOUNT_EMAIL ? `Configurado (${GOOGLE_SERVICE_ACCOUNT_EMAIL.substring(0, 20)}...)` : 'NÃO configurado');
        console.log('GOOGLE_PRIVATE_KEY:', GOOGLE_PRIVATE_KEY ? `Configurado (${GOOGLE_PRIVATE_KEY.substring(0, 50)}...)` : 'NÃO configurado');
        console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', GOOGLE_SHEETS_SPREADSHEET_ID);
        
        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            console.log('❌ Credenciais do Google não configuradas');
            console.log('📝 Para configurar, execute:');
            console.log('   set GOOGLE_SERVICE_ACCOUNT_EMAIL=seu_email@projeto.iam.gserviceaccount.com');
            console.log('   set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
            return;
        }

        // Função para criar JWT (simplificada para Node.js)
        const crypto = require('crypto');
        
        function createJWT() {
            const header = {
                alg: 'RS256',
                typ: 'JWT'
            };

            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
            };

            const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
            const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const signatureInput = `${encodedHeader}.${encodedPayload}`;
            
            const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), GOOGLE_PRIVATE_KEY);
            const encodedSignature = signature.toString('base64url');
            
            return `${signatureInput}.${encodedSignature}`;
        }

        console.log('🔑 Criando JWT...');
        const jwt = createJWT();
        
        console.log('🎫 Obtendo token de acesso...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Erro ao obter token:', tokenResponse.status, errorText);
            return;
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        console.log('✅ Token obtido com sucesso');

        // Buscar dados da aba "dados pessoais"
        console.log('📊 Buscando dados da aba "dados pessoais"...');
        const dadosPessoaisResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${encodeURIComponent(DADOS_PESSOAIS_SHEET)}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!dadosPessoaisResponse.ok) {
            const errorText = await dadosPessoaisResponse.text();
            console.error('❌ Erro ao buscar dados pessoais:', dadosPessoaisResponse.status, errorText);
            return;
        }

        const dadosPessoaisData = await dadosPessoaisResponse.json();
        const dadosPessoaisRows = dadosPessoaisData.values || [];
        
        console.log(`📊 Dados pessoais: ${dadosPessoaisRows.length} linhas`);
        if (dadosPessoaisRows.length > 0) {
            console.log('📊 Cabeçalho:', JSON.stringify(dadosPessoaisRows[0]));
            if (dadosPessoaisRows.length > 1) {
                console.log('📊 Primeira linha de dados:', JSON.stringify(dadosPessoaisRows[1]));
                console.log('📊 Segunda linha de dados:', JSON.stringify(dadosPessoaisRows[2]));
            }
        }

        // Buscar dados da aba "matriculas"
        console.log('📚 Buscando dados da aba "matriculas"...');
        const matriculasResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${encodeURIComponent(MATRICULAS_SHEET)}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        let matriculasRows = [];
        if (matriculasResponse.ok) {
            const matriculasData = await matriculasResponse.json();
            matriculasRows = matriculasData.values || [];
            console.log(`📋 Matrículas: ${matriculasRows.length} linhas`);
            
            if (matriculasRows.length > 0) {
                console.log('📋 Cabeçalho:', JSON.stringify(matriculasRows[0]));
                if (matriculasRows.length > 1) {
                    console.log('📋 Primeira linha de dados:', JSON.stringify(matriculasRows[1]));
                }
            }
        } else {
            const errorText = await matriculasResponse.text();
            console.log('⚠️ Aba "matriculas" não encontrada ou inacessível:', matriculasResponse.status, errorText);
        }

        // Análise dos dados
        if (dadosPessoaisRows.length === 0) {
            console.log('❌ Nenhum dado encontrado na aba "dados pessoais"');
            return;
        }

        const dadosPessoaisDataRows = dadosPessoaisRows.slice(1);
        const matriculasDataRows = matriculasRows.length > 0 ? matriculasRows.slice(1) : [];
        
        console.log(`👥 Total de alunos em "dados pessoais": ${dadosPessoaisDataRows.length}`);
        console.log(`🎓 Total de registros em "matriculas": ${matriculasDataRows.length}`);

        // Criar lista de CPFs matriculados
        const cpfsMatriculados = new Set();
        matriculasDataRows.forEach(row => {
            const cpf = row[2] || ''; // CPF está na coluna 3 (índice 2)
            if (cpf.trim()) {
                cpfsMatriculados.add(cpf.trim());
            }
        });

        console.log(`🔍 CPFs já matriculados: ${cpfsMatriculados.size}`);
        console.log('📋 Lista de CPFs matriculados:', Array.from(cpfsMatriculados));

        // Filtrar alunos pendentes
        const pendingEnrollments = dadosPessoaisDataRows
            .map((row, index) => {
                const cpf = row[6] || ''; // CPF está na coluna 7 (índice 6)
                const nome = row[4] || ''; // Nome está na coluna 5 (índice 4)
                
                return {
                    rowIndex: index + 2,
                    nome: nome.trim(),
                    cpf: cpf.trim()
                };
            })
            .filter(student => {
                if (!student.nome || !student.cpf) {
                    return false;
                }
                
                const isNotEnrolled = !cpfsMatriculados.has(student.cpf);
                
                if (isNotEnrolled) {
                    console.log(`📋 Aluno pendente: ${student.nome} (CPF: ${student.cpf})`);
                }
                
                return isNotEnrolled;
            });

        console.log(`✅ Total de matrículas pendentes: ${pendingEnrollments.length}`);

    } catch (error) {
        console.error('❌ Erro ao testar Google Sheets:', error);
    }
}

// Executar teste
testGoogleSheetsAccess();