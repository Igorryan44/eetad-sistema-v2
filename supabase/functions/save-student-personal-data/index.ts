import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentPersonalData {
  nome: string;
  rg: string;
  cpf: string;
  telefone: string;
  email: string;
  sexo: string;
  estado_civil: string;
  data_nascimento: string;
  cidade_nascimento: string;
  uf_nascimento: string;
  nacionalidade: string;
  escolaridade: string;
  profissao: string;
  cargo_igreja: string;
  endereco_rua: string;
  cep: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentData: StudentPersonalData = await req.json()
    console.log('📝 Dados recebidos:', studentData)

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA'
    const SHEET_NAME = 'dados pessoais'
    
    // Credenciais do Google (service account)
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas')
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

    // Preparar dados para inserção
    const currentDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    
    const rowData = [
      currentDate, // Data de cadastro
      studentData.nome || '',
      studentData.rg || '',
      studentData.cpf || '',
      studentData.telefone || '',
      studentData.email || '',
      studentData.sexo || '',
      studentData.estado_civil || '',
      studentData.data_nascimento || '',
      studentData.cidade_nascimento || '',
      studentData.uf_nascimento || '',
      studentData.nacionalidade || '',
      studentData.escolaridade || '',
      studentData.profissao || '',
      studentData.cargo_igreja || '',
      studentData.endereco_rua || '',
      studentData.cep || '',
      studentData.numero || '',
      studentData.complemento || '',
      studentData.bairro || '',
      studentData.cidade || '',
      studentData.uf || '',
      'Pendente' // Status inicial
    ]

    // Adicionar dados à planilha
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowData]
        })
      }
    )

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text()
      throw new Error(`Erro ao adicionar dados: ${appendResponse.status} - ${errorText}`)
    }

    console.log('✅ Dados pessoais salvos com sucesso na planilha')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados pessoais salvos com sucesso',
        data: studentData
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro ao salvar dados pessoais:', error)
    
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