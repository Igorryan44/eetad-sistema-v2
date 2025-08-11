import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

// Configurações
const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';

// Credenciais corretas do Google Service Account
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com';
const GOOGLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvoypC5H++3vN+
WRUXmc2tPZ7HRgGW3KtgmTTGMV02SOAEB3SCmoMkzXpMYbNoH10KlA2aJbMpXGac
4khGHQU1R5btR6o9nU3MKCBYCLR0BWFZhlMQtp4bO+m8GEHttPa34OL09LVedktY
uwQ9NYf74tR8BECQmFRAvxDxt/Xi6ZK7CRFAkdj1X1Og2BK4d6tTdrclSGix3Ng7
FkwYF+cxM9l3pxBqtwZLVwsLKZ6e+T5tB8RPUNPy665+QiRcWYMxFVb30ukxAPrM
NpEfF5fzfL4ys1KFYnIIA+OWfZheXP54bBkbhrrq7y06IyhC+g3fe3KfJ7+F2cKY
24e7nEJzAgMBAAECggEAVzxclkL17DDCkgPfBQzgamaLwYBU88CA4obV/oawPHEv
yvCE/wWNk673So7QVCwXw1RL+T82YJnDYbLGoQRy/MalAQ+yT84cwQVBI1iXgHTX
qGaeRVPe7bnxWvpVbKKQVD4/m9kbaGKrA9RHw7sd4o8EaOCXzPnMByifWt+7Ikt7
DKr2vD3Lm9uNppqzmTKSHl5AcXoT0zOf3kMoJPkUyCLYqerYTLQk5V0FbB/7EY/n
rvk8E/ZMBxGImLPCrlDc93gwendGR71+FXGkayERgkXLvM4eAeALTB39NcEWc/WJ
daa38k3wD1dBdwOfe6nFsuKwicSmQEb74GjX4gn/6QKBgQDt2OOBTVsUwI6V5Bwz
DP/n8MPspJ8XPeqb57BtQ4KBDu+I2mUkc95sta99oToE8SQGICOIYQRbZBjNmVgt
OnFp48f0fjv6NVsQ++uYZxDNKKkplQRi6hf2wb/0Pl3MZgeNNTYBrWO63ZR7oiRK
qzpIIWNqAPkjGsUjhx87Nttu1wKBgQC9Cs53fVXdOe0Uw/Vq0ZIFRILfpQv2FHt+
4nZb+HnL1DzGOyCK8URA5EcCK5UV1z14jA15vrMGcKCQQ8AHRRyx51g48+LCCWu3
gSFQXxUHp1LIPgEFI8/S/KSMewhh3FoGMVFmiDFnvpaHa/YJodZdUb+Tzz1ndXG4
mDjbGLPhxQKBgQCsqqyWnOrHSPb6N+yE3yYUYoRJkkTwYYGlBvDckYr3WDlqt2l/
qiJJ9yfcYyQ0nD7Tt5c0FYJNOoCLGYya4PeesL7jbpTqErv2u3wQWpom5iLQTh8u
E9WrzIImtPPxRAytZXi8hPyGlv+JNW91SZL49Ewwk15KLs/498ojebKZZwKBgDYT
cEo3/SbiWhI1l+9tcYK2PWWyNcC3zTfXmhnm8xg+ZwAhi8aTC34wjqttQiFUR85C
6dvolBeEgjmiV7z8pR+y2Ma55SSyQzDj7F6sRDzDPWfwbKRGwT1ObdeNnjE4MjxR
QUK+NLvDhhXI6UGKHOLm7pFel+cPbm9qg+EQqOwtAoGAR7krzL0NNsRelJ4f3xu4
gnrhMT+bVlFV65TSQbmWF26df19uxzQdGSb+DdnQOCI4ZsgO3q87Lu4EZ5tezT5R
pdUtTvhDoKtflUeiciVTmn6tCSmfrQp9uCMmxQZlkMqzhY+NWlES9R49p+jZI+DT
VoGgXze+8D2Bu7g9qemRGts=
-----END PRIVATE KEY-----`;

async function testAbaMatriculasDireta() {
  console.log('🔍 TESTE DIRETO - Verificando aba "matriculas" na planilha\n');
  
  try {
    // Configurar autenticação
    const auth = new GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Verificar se a aba "matriculas" existe
    console.log('1️⃣ Verificando se a aba "matriculas" existe...');
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    });

    const sheetNames = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];
    console.log('📋 Abas encontradas:', sheetNames);
    
    const matriculasSheetExists = sheetNames.includes('matriculas');
    console.log('✅ Aba "matriculas" existe:', matriculasSheetExists);

    if (!matriculasSheetExists) {
      console.log('❌ A aba "matriculas" não existe! Criando...');
      
      // Criar a aba "matriculas"
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'matriculas'
              }
            }
          }]
        }
      });
      
      console.log('✅ Aba "matriculas" criada com sucesso');
      
      // Adicionar cabeçalhos
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
        range: 'matriculas!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['nome', 'cpf', 'nucleo', 'subnucleo', 'ciclo', 'data', 'status', 'observacao']]
        }
      });
      
      console.log('✅ Cabeçalhos adicionados à aba "matriculas"');
    }

    // 2. Verificar conteúdo da aba "matriculas"
    console.log('\n2️⃣ Verificando conteúdo da aba "matriculas"...');
    
    const matriculasData = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'matriculas',
    });

    const rows = matriculasData.data.values || [];
    console.log('📊 Total de linhas na aba "matriculas":', rows.length);
    
    if (rows.length > 0) {
      console.log('📋 Cabeçalhos:', rows[0]);
      
      if (rows.length > 1) {
        console.log('📝 Primeira linha de dados:', rows[1]);
        console.log('📈 Total de matrículas (excluindo cabeçalho):', rows.length - 1);
      } else {
        console.log('⚠️ Apenas cabeçalhos encontrados, nenhuma matrícula');
      }
    } else {
      console.log('⚠️ Aba "matriculas" está completamente vazia');
    }

    // 3. Testar adição de uma linha de teste
    console.log('\n3️⃣ Testando adição de uma linha de teste...');
    
    const testData = [
      'Teste Nome',
      '12345678901',
      'Núcleo Teste',
      'Subnúcleo Teste',
      'Ciclo 2025',
      new Date().toLocaleDateString('pt-BR'),
      'Teste',
      'Observação de teste - ' + new Date().toLocaleString()
    ];
    
    const addResult = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'matriculas',
      valueInputOption: 'RAW',
      requestBody: {
        values: [testData]
      }
    });
    
    console.log('✅ Linha de teste adicionada:', addResult.data.updates?.updatedRange);

    // 4. Verificar se a linha foi adicionada
    console.log('\n4️⃣ Verificando se a linha foi adicionada...');
    
    const updatedData = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'matriculas',
    });

    const updatedRows = updatedData.data.values || [];
    console.log('📊 Total de linhas após adição:', updatedRows.length);
    
    if (updatedRows.length > 0) {
      const lastRow = updatedRows[updatedRows.length - 1];
      console.log('📝 Última linha:', lastRow);
      
      if (lastRow[0] === 'Teste Nome') {
        console.log('🎉 SUCESSO! Linha de teste foi adicionada corretamente');
      } else {
        console.log('❌ PROBLEMA! Linha de teste não foi encontrada');
      }
    }

  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
    console.log('📋 Detalhes do erro:', error);
  }
}

testAbaMatriculasDireta();