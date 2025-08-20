import { getGoogleAccessToken } from '../utils/google-auth.js';
import fetch from 'node-fetch';

export default async (req, res) => {
    try {
        console.log('=== DIAGNÓSTICO DETALHADO DA AUTENTICAÇÃO GOOGLE ===');
        
        // Verificar variáveis de ambiente
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        
        console.log('Email:', email);
        console.log('Private Key Length:', privateKey ? privateKey.length : 'undefined');
        console.log('Spreadsheet ID:', spreadsheetId);
        
        // Verificar formato da chave privada
        if (privateKey) {
            console.log('Private Key starts with:', privateKey.substring(0, 50));
            console.log('Private Key ends with:', privateKey.substring(privateKey.length - 50));
            console.log('Has BEGIN marker:', privateKey.includes('-----BEGIN PRIVATE KEY-----'));
            console.log('Has END marker:', privateKey.includes('-----END PRIVATE KEY-----'));
        }
        
        // Tentar obter token de acesso
        console.log('\n=== TENTANDO OBTER TOKEN DE ACESSO ===');
        
        try {
            const accessToken = await getGoogleAccessToken(email, privateKey);
            console.log('✅ Token obtido com sucesso!');
            console.log('Token length:', accessToken.length);
            console.log('Token preview:', accessToken.substring(0, 20) + '...');
            
            // Tentar fazer uma requisição de teste para a API do Google Sheets
            const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
            
            console.log('\n=== TESTANDO ACESSO À PLANILHA ===');
            console.log('URL de teste:', testUrl);
            
            const response = await fetch(testUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Status da resposta:', response.status);
            console.log('Status text:', response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Acesso à planilha bem-sucedido!');
                console.log('Título da planilha:', data.properties?.title);
                console.log('Número de abas:', data.sheets?.length);
                
                res.json({
                    success: true,
                    message: 'Autenticação e acesso à planilha funcionando corretamente!',
                    details: {
                        tokenObtained: true,
                        spreadsheetAccess: true,
                        spreadsheetTitle: data.properties?.title,
                        sheetsCount: data.sheets?.length
                    }
                });
            } else {
                const errorText = await response.text();
                console.log('❌ Erro no acesso à planilha:', errorText);
                
                res.json({
                    success: false,
                    message: 'Token obtido, mas erro no acesso à planilha',
                    details: {
                        tokenObtained: true,
                        spreadsheetAccess: false,
                        error: errorText,
                        status: response.status
                    }
                });
            }
            
        } catch (tokenError) {
            console.log('❌ Erro ao obter token:', tokenError.message);
            console.log('Stack trace:', tokenError.stack);
            
            res.json({
                success: false,
                message: 'Erro na obtenção do token de acesso',
                details: {
                    tokenObtained: false,
                    error: tokenError.message,
                    stack: tokenError.stack
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Erro geral no diagnóstico:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no diagnóstico',
            error: error.message
        });
    }
};