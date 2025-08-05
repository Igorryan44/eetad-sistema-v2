import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📋 Buscando matrículas pendentes...')

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA'
    const SHEET_NAME = 'dados pessoais'
    
    // Credenciais do Google (service account)
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

    // Se as credenciais não estiverem configuradas, retornar erro
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || 
        GOOGLE_SERVICE_ACCOUNT_EMAIL.includes('desenvolvimento') || 
        GOOGLE_PRIVATE_KEY.includes('desenvolvimento')) {
      
      console.log('⚠️ Credenciais do Google não configuradas')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais do Google não configuradas',
          pendingEnrollments: []
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 500
        }
      )
    }

    // Função para criar JWT
    function createJWT() {
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      }

      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      }

      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

      const signatureInput = `${encodedHeader}.${encodedPayload}`
      
      // Importar chave privada
      const keyData = GOOGLE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, '')
                                        .replace(/-----END PRIVATE KEY-----/, '')
                                        .replace(/\s/g, '')
      
      const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
      
      return crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      ).then(key => {
        return crypto.subtle.sign(
          'RSASSA-PKCS1-v1_5',
          key,
          new TextEncoder().encode(signatureInput)
        )
      }).then(signature => {
        const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
                                   .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
        return `${signatureInput}.${encodedSignature}`
      })
    }

    // Obter token de acesso
    const jwt = await createJWT()
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    if (!tokenResponse.ok) {
      throw new Error(`Erro ao obter token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Buscar dados da planilha
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${SHEET_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!sheetResponse.ok) {
      throw new Error(`Erro ao buscar dados: ${sheetResponse.status}`)
    }

    const sheetData = await sheetResponse.json()
    const rows = sheetData.values || []

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          pendingEnrollments: [] 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Primeira linha são os cabeçalhos
    const headers = rows[0]
    const dataRows = rows.slice(1)

    // Filtrar apenas registros com status "Pendente"
    const pendingEnrollments = dataRows
      .map((row, index) => {
        const enrollment = {
          rowIndex: index + 2, // +2 porque começamos da linha 2 (após cabeçalho)
          dataCadastro: row[0] || '',
          nome: row[1] || '',
          rg: row[2] || '',
          cpf: row[3] || '',
          telefone: row[4] || '',
          email: row[5] || '',
          sexo: row[6] || '',
          estadoCivil: row[7] || '',
          dataNascimento: row[8] || '',
          cidadeNascimento: row[9] || '',
          ufNascimento: row[10] || '',
          nacionalidade: row[11] || '',
          escolaridade: row[12] || '',
          profissao: row[13] || '',
          cargoIgreja: row[14] || '',
          enderecoRua: row[15] || '',
          cep: row[16] || '',
          numero: row[17] || '',
          complemento: row[18] || '',
          bairro: row[19] || '',
          cidade: row[20] || '',
          uf: row[21] || '',
          status: row[22] || 'Pendente'
        }
        return enrollment
      })
      .filter(enrollment => enrollment.status === 'Pendente')

    console.log(`✅ Encontradas ${pendingEnrollments.length} matrículas pendentes`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        pendingEnrollments: pendingEnrollments
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro ao buscar matrículas pendentes:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})