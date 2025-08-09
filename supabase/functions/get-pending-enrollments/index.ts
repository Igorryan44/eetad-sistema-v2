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

  // Verificar se é uma requisição de debug
  let isDebugRequest = false
  try {
    const requestBody = await req.text()
    try {
      const body = JSON.parse(requestBody || '{}')
      isDebugRequest = body.debug === true
    } catch (e) {
      // Ignorar erro de parsing
    }
  } catch {
    // Se não conseguir ler o body, não é debug
    isDebugRequest = false
  }

  try {

    console.log('📋 Buscando matrículas pendentes...')
    console.log('🔍 Nova lógica: Comparando "dados pessoais" vs "matriculas"')
    if (isDebugRequest) {
      console.log('🐛 Modo DEBUG ativado')
    }

    // Configurações do Google Sheets
    const GOOGLE_SHEETS_SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID') || '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA'
    const DADOS_PESSOAIS_SHEET = 'dados pessoais'
    const MATRICULAS_SHEET = 'matriculas'
    
    // Credenciais do Google (service account)
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

    // DEBUG: Mostrar informações das variáveis de ambiente
    if (isDebugRequest) {
      console.log('🔍 DEBUG - Variáveis de ambiente:')
      console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', GOOGLE_SERVICE_ACCOUNT_EMAIL ? `Configurado (${GOOGLE_SERVICE_ACCOUNT_EMAIL.substring(0, 20)}...)` : 'NÃO configurado')
      console.log('GOOGLE_PRIVATE_KEY:', GOOGLE_PRIVATE_KEY ? `Configurado (${GOOGLE_PRIVATE_KEY.substring(0, 50)}...)` : 'NÃO configurado')
      console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', GOOGLE_SHEETS_SPREADSHEET_ID)
    }

    // Se as credenciais não estiverem configuradas, retornar array vazio
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || 
        GOOGLE_SERVICE_ACCOUNT_EMAIL.includes('desenvolvimento') || 
        GOOGLE_PRIVATE_KEY.includes('desenvolvimento')) {
      
      console.log('⚠️ Credenciais do Google não configuradas - retornando array vazio')
      
      if (isDebugRequest) {
        const debugInfo = {
           pendingEnrollments: [],
           debug: {
             error: 'Credenciais não configuradas',
             GOOGLE_SERVICE_ACCOUNT_EMAIL: GOOGLE_SERVICE_ACCOUNT_EMAIL ? `Configurado (${GOOGLE_SERVICE_ACCOUNT_EMAIL.substring(0, 20)}...)` : 'NÃO configurado',
             GOOGLE_PRIVATE_KEY: GOOGLE_PRIVATE_KEY ? `Configurado (${GOOGLE_PRIVATE_KEY.substring(0, 50)}...)` : 'NÃO configurado',
             GOOGLE_SHEETS_SPREADSHEET_ID: GOOGLE_SHEETS_SPREADSHEET_ID,
             allEnvVars: {
                GOOGLE_SERVICE_ACCOUNT_EMAIL: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') ? 'Existe' : 'Não existe',
                GOOGLE_PRIVATE_KEY: Deno.env.get('GOOGLE_PRIVATE_KEY') ? 'Existe' : 'Não existe',
                GOOGLE_SHEETS_SPREADSHEET_ID: Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID') ? 'Existe' : 'Não existe'
              }
           }
         }
        
        return new Response(
          JSON.stringify(debugInfo, null, 2),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            }
          }
        )
      }
      
      return new Response(
        JSON.stringify([]),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
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

    // Buscar dados da aba "dados pessoais"
    console.log('📊 Buscando dados da aba "dados pessoais"...')
    const dadosPessoaisResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${DADOS_PESSOAIS_SHEET}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!dadosPessoaisResponse.ok) {
      throw new Error(`Erro ao buscar dados pessoais: ${dadosPessoaisResponse.status}`)
    }

    const dadosPessoaisData = await dadosPessoaisResponse.json()
    const dadosPessoaisRows = dadosPessoaisData.values || []

    // DEBUG: Mostrar estrutura dos dados pessoais
    console.log(`📊 DEBUG - Dados pessoais: ${dadosPessoaisRows.length} linhas`)
    if (dadosPessoaisRows.length > 0) {
      console.log('📊 DEBUG - Cabeçalho dados pessoais:', JSON.stringify(dadosPessoaisRows[0]))
      if (dadosPessoaisRows.length > 1) {
        console.log('📊 DEBUG - Primeira linha de dados:', JSON.stringify(dadosPessoaisRows[1]))
        console.log('📊 DEBUG - Segunda linha de dados:', JSON.stringify(dadosPessoaisRows[2]))
      }
    }

    // Buscar dados da aba "matriculas"
    console.log('📚 Buscando dados da aba "matriculas"...')
    const matriculasResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${MATRICULAS_SHEET}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    // Se a aba "matriculas" não existir ou der erro, consideramos que não há matrículas
    let matriculasRows = []
    if (matriculasResponse.ok) {
      const matriculasData = await matriculasResponse.json()
      matriculasRows = matriculasData.values || []
      console.log(`📋 Encontradas ${matriculasRows.length} linhas na aba "matriculas"`)
      
      // DEBUG: Mostrar estrutura das matrículas
      if (matriculasRows.length > 0) {
        console.log('📋 DEBUG - Cabeçalho matriculas:', JSON.stringify(matriculasRows[0]))
        if (matriculasRows.length > 1) {
          console.log('📋 DEBUG - Primeira linha matriculas:', JSON.stringify(matriculasRows[1]))
        }
      }
    } else {
      console.log('⚠️ Aba "matriculas" não encontrada ou inacessível - considerando todos como pendentes')
    }

    if (dadosPessoaisRows.length === 0) {
      console.log('📭 Nenhum dado encontrado na aba "dados pessoais"')
      return new Response(
        JSON.stringify([]),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Processar dados pessoais (primeira linha são cabeçalhos)
    const dadosPessoaisDataRows = dadosPessoaisRows.slice(1)
    console.log(`👥 Encontrados ${dadosPessoaisDataRows.length} alunos na aba "dados pessoais"`)

    // Processar matrículas (primeira linha são cabeçalhos, se existir)
    const matriculasDataRows = matriculasRows.length > 0 ? matriculasRows.slice(1) : []
    console.log(`🎓 Encontrados ${matriculasDataRows.length} registros na aba "matriculas"`)

    // Função para normalizar CPF (remover pontos, traços e espaços)
    function normalizeCPF(cpf) {
      return cpf.replace(/[.\-\s]/g, '').trim()
    }

    // Criar lista de CPFs que já estão matriculados
    const cpfsMatriculados = new Set()
    matriculasDataRows.forEach(row => {
      const cpf = row[2] || '' // CPF está na coluna 3 (índice 2) na aba matriculas
      if (cpf.trim()) {
        cpfsMatriculados.add(normalizeCPF(cpf))
      }
    })

    console.log(`🔍 CPFs já matriculados: ${cpfsMatriculados.size}`)

    // Filtrar alunos que estão em "dados pessoais" mas NÃO estão em "matriculas"
    const pendingEnrollments = dadosPessoaisDataRows
      .map((row, index) => {
        const nome = row[4] || '' // Nome está na coluna 5 (índice 4)
        const cpf = row[6] || '' // CPF está na coluna 7 (índice 6)
        const telefone = row[7] || '' // Telefone está na coluna 8 (índice 7)
        const email = row[8] || '' // Email está na coluna 9 (índice 8)

        const student = {
          rowIndex: index + 2, // +2 porque começamos da linha 2 (após cabeçalho)
          nome: nome.trim(),
          cpf: cpf.trim(),
          email: email.trim(),
          telefone: telefone.trim()
        }

        // DEBUG: Mostrar dados extraídos de cada aluno
        if (index < 5) { // Mostrar apenas os primeiros 5 para não poluir o log
          console.log(`📊 DEBUG - Aluno ${index + 1}:`, JSON.stringify(student))
          console.log(`📊 DEBUG - Row original:`, JSON.stringify(row))
        }

        return student
      })
      .filter(student => {
        // Filtrar apenas alunos que têm dados válidos
        if (!student.nome || !student.cpf) {
          return false
        }
        
        // Verificar se o CPF NÃO está na lista de matriculados
        const isNotEnrolled = !cpfsMatriculados.has(normalizeCPF(student.cpf))
        
        if (isNotEnrolled) {
          console.log(`📋 Aluno pendente encontrado: ${student.nome} (CPF: ${student.cpf})`)
        }
        
        return isNotEnrolled
      })
      .map(student => ({
        id: student.rowIndex.toString(),
        nome: student.nome,
        cpf: student.cpf,
        email: student.email,
        telefone: student.telefone,
        rowIndex: student.rowIndex
      }))

    console.log(`✅ Total de matrículas pendentes encontradas: ${pendingEnrollments.length}`)

    // Preparar resposta
    const response = {
      pendingEnrollments
    }

    // Adicionar informações de debug se solicitado
    if (isDebugRequest) {
      response.debug = {
        credentialsConfigured: true,
        totalDadosPessoaisRows: dadosPessoaisRows.length,
        totalMatriculasRows: matriculasRows.length,
        enrolledCPFs: Array.from(cpfsMatriculados),
        dadosPessoaisHeaders: dadosPessoaisRows[0] || [],
        matriculasHeaders: matriculasRows[0] || [],
        firstThreeDadosPessoaisRows: dadosPessoaisDataRows.slice(0, 3).map((row, index) => ({
          rowIndex: index + 2,
          originalRow: row,
          extractedData: {
            nome: row[4] || '',
            cpf: row[6] || '',
            email: row[8] || '',
            telefone: row[7] || ''
          }
        })),
        allEnvVars: {
          GOOGLE_SERVICE_ACCOUNT_EMAIL: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') ? 'Existe' : 'Não existe',
          GOOGLE_PRIVATE_KEY: Deno.env.get('GOOGLE_PRIVATE_KEY') ? 'Existe' : 'Não existe',
          GOOGLE_SHEETS_SPREADSHEET_ID: Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID') ? 'Existe' : 'Não existe'
        }
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Erro na função get-pending-enrollments:', error)
    
    // Se for uma requisição de debug, retornar informações do erro
    if (isDebugRequest) {
      return new Response(
        JSON.stringify({
          pendingEnrollments: [],
          debug: {
            error: true,
            errorMessage: error.message,
            errorStack: error.stack,
            credentialsConfigured: false,
            allEnvVars: {
              GOOGLE_SERVICE_ACCOUNT_EMAIL: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') ? 'Existe' : 'Não existe',
              GOOGLE_PRIVATE_KEY: Deno.env.get('GOOGLE_PRIVATE_KEY') ? 'Existe' : 'Não existe',
              GOOGLE_SHEETS_SPREADSHEET_ID: Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID') ? 'Existe' : 'Não existe'
            }
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
    
    return new Response(
      JSON.stringify([]),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})