import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

async function verificarAbaUsuarios() {
    try {
        console.log('🔍 Verificando aba "usuarios" na planilha...\n');

        // Configurar autenticação
        const auth = new GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: 'testen8n-448514',
                private_key_id: 'b123456789abcdef123456789abcdef123456789a',
                private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8xYzQJ2K3vN8m\n...\n-----END PRIVATE KEY-----\n',
                client_email: 'puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com',
                client_id: '123456789012345678901',
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/puppeteer-service-account%40testen8n-448514.iam.gserviceaccount.com'
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';

        // 1. Verificar se a aba "usuarios" existe
        console.log('📋 Listando todas as abas da planilha...');
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });

        const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
        console.log('Abas encontradas:', sheetNames);

        if (!sheetNames.includes('usuarios')) {
            console.log('❌ PROBLEMA: A aba "usuarios" não existe na planilha!');
            console.log('📝 Solução: Crie uma aba chamada "usuarios" na planilha do Google Sheets');
            console.log('🔗 Link da planilha: https://docs.google.com/spreadsheets/d/' + spreadsheetId);
            return;
        }

        console.log('✅ A aba "usuarios" existe na planilha');

        // 2. Verificar o conteúdo da aba "usuarios"
        console.log('\n📊 Verificando conteúdo da aba "usuarios"...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'usuarios!A:Z'
        });

        const rows = response.data.values || [];
        console.log(`Número de linhas encontradas: ${rows.length}`);

        if (rows.length === 0) {
            console.log('❌ PROBLEMA: A aba "usuarios" está vazia!');
            console.log('📝 Solução: Adicione pelo menos um cabeçalho e um usuário na aba "usuarios"');
            console.log('Estrutura sugerida:');
            console.log('A1: nome | B1: email | C1: senha | D1: ultimo_login');
            console.log('A2: Admin | B2: admin@eetad.com | C2: senha123 | D2: (vazio)');
            return;
        }

        // 3. Mostrar estrutura atual
        console.log('\n📋 Estrutura atual da aba "usuarios":');
        if (rows.length > 0) {
            console.log('Cabeçalho (linha 1):', rows[0]);
        }
        
        if (rows.length > 1) {
            console.log('Primeira linha de dados (linha 2):', rows[1]);
            console.log(`Total de usuários cadastrados: ${rows.length - 1}`);
        } else {
            console.log('❌ PROBLEMA: Não há dados de usuários (apenas cabeçalho)');
            console.log('📝 Solução: Adicione pelo menos um usuário na linha 2');
        }

        // 4. Verificar se existe usuário "Admin"
        console.log('\n🔍 Procurando usuário "Admin"...');
        let adminFound = false;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[0] && row[0].toLowerCase().includes('admin')) {
                console.log('✅ Usuário Admin encontrado na linha', i + 1, ':', row);
                adminFound = true;
                break;
            }
        }

        if (!adminFound) {
            console.log('❌ PROBLEMA: Usuário "Admin" não encontrado!');
            console.log('📝 Solução: Adicione um usuário "Admin" na aba "usuarios"');
            console.log('Exemplo de linha para adicionar:');
            console.log('Admin | admin@eetad.com | senha123 | (deixar vazio)');
        }

        console.log('\n🔗 Link direto para a planilha:');
        console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`);

    } catch (error) {
        console.error('❌ Erro ao verificar aba usuarios:', error.message);
        if (error.code === 404) {
            console.log('💡 Possíveis causas:');
            console.log('1. A planilha não foi compartilhada com o service account');
            console.log('2. O ID da planilha está incorreto');
            console.log('3. A aba "usuarios" não existe');
        }
    }
}

verificarAbaUsuarios();