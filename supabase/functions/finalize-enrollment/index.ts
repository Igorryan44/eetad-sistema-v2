import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrollmentData {
  rowIndex: number;
  cpf: string;
  ciclo: string;
  subnucleo: string;
  dataEvento: string;
  status: string;
  observacao: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const enrollmentData: EnrollmentData = await req.json()
    console.log('📝 Efetivando matrícula:', enrollmentData)

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA'
    const DADOS_PESSOAIS_SHEET = 'dados pessoais'
    const MATRICULAS_SHEET = 'matriculas'
    
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

    // 1. Atualizar status na aba "dados pessoais"
    const updateStatusResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${DADOS_PESSOAIS_SHEET}!W${enrollmentData.rowIndex}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[enrollmentData.status]]
        })
      }
    )

    if (!updateStatusResponse.ok) {
      throw new Error(`Erro ao atualizar status: ${updateStatusResponse.status}`)
    }

    // 2. Buscar dados pessoais do aluno
    const studentDataResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${DADOS_PESSOAIS_SHEET}!${enrollmentData.rowIndex}:${enrollmentData.rowIndex}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!studentDataResponse.ok) {
      throw new Error(`Erro ao buscar dados do aluno: ${studentDataResponse.status}`)
    }

    const studentData = await studentDataResponse.json()
    const studentRow = studentData.values?.[0] || []

    // 3. Adicionar registro na aba "matriculas"
    const currentDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const matriculaNumber = `EETAD${Date.now()}`
    
    const matriculaRowData = [
      currentDate, // Data de efetivação
      matriculaNumber, // Número da matrícula
      enrollmentData.cpf, // CPF
      studentRow[1] || '', // Nome
      enrollmentData.ciclo, // Ciclo
      enrollmentData.subnucleo, // Subnúcleo
      enrollmentData.dataEvento, // Data do evento
      enrollmentData.status, // Status
      enrollmentData.observacao || '', // Observação
      studentRow[5] || '', // Email
      studentRow[4] || '' // Telefone
    ]

    const addMatriculaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${MATRICULAS_SHEET}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [matriculaRowData]
        })
      }
    )

    if (!addMatriculaResponse.ok) {
      throw new Error(`Erro ao adicionar matrícula: ${addMatriculaResponse.status}`)
    }

    console.log('✅ Matrícula efetivada com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Matrícula efetivada com sucesso',
        matriculaNumber: matriculaNumber
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro ao efetivar matrícula:', error)
    
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