import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar funções locais
import finalizeEnrollment from './functions/finalize-enrollment.js';
import getPendingEnrollments from './functions/get-pending-enrollments.js';
import getEnrollments from './functions/get-enrollments.js';
import saveStudentPersonalData from './functions/save-student-personal-data.js';
import saveStudentRegistration from './functions/save-student-registration.js';
import createMercadoPagoPayment from './functions/create-mercadopago-payment.js';
import checkPaymentStatus from './functions/check-payment-status.js';
import mercadoPagoWebhook from './functions/mercadopago-webhook.js';
import manageSecretaryUsers from './functions/manage-secretary-users.js';
import aiChatbot from './functions/ai-chatbot.js';
import cancelOrder from './functions/cancel-order.js';
import sendEmailNotification from './functions/send-email-notification.js';
import getBookOrdersByCpfBookObservacao from './functions/get-book-orders-by-cpf-book-observacao.js';
import sendWhatsappNotification from './functions/send-whatsapp-notification.js';
import getStudentPersonalData from './functions/get-student-personal-data.js';
import getStudentBooks from './functions/get-student-books.js';
import getStudentEnrollmentData from './functions/get-student-enrollment-data.js';
import saveSettings from './functions/save-settings.js';
import updateStudentData from './functions/update-student-data.js';
import debugSheetData from './functions/debug-sheet-data.js';
import saveBookOrder from './functions/save-book-order.js';
import testEnrollments from './functions/test-enrollments.js';
import getMatriculatedStudents from './functions/get-matriculated-students.js';
import getCursandoStudents from './functions/get-cursando-students.js';
import getAprovadoStudents from './functions/get-aprovado-students.js';
import getReprovadoStudents from './functions/get-reprovado-students.js';
import getRecuperacaoStudents from './functions/get-recuperacao-students.js';
import getPendenteStudents from './functions/get-pendente-students.js';
import clearCache from './functions/clear-cache.js';
import debugSaveData from './functions/debug-save-data.js';
import testSaveComplete from './functions/test-save-complete.js';
import debugColumnMapping from './functions/debug-column-mapping.js';
import testSpecificSave from './functions/test-specific-save.js';
import testDirectWrite from './functions/test-direct-write.js';
import checkRealData from './functions/check-real-data.js';
import countRealRows from './functions/count-real-rows.js';
import generateStaticPix from './functions/generate-static-pix.js';
import getStudentPixQrcode from './functions/get-student-pix-qrcode.js';
import confirmPixPayment from './functions/confirm-pix-payment.js';
import testPixFlow from './functions/test-pix-flow.js';
import generateAndSaveStudentPix from './functions/generate-and-save-student-pix.js';
import generatePixForStudent from './functions/generate-pix-for-student.js';
import generateQrCodeForManualSave from './functions/generate-qr-code-for-manual-save.js';
import generatePixWithTracking from './functions/generate-pix-with-tracking.js';
import confirmPixByTracking from './functions/confirm-pix-by-tracking.js';
import generateStaticPixWithId from './functions/generate-static-pix-with-id.js';
import confirmPixById from './functions/confirm-pix-by-id.js';
import generateMonthlyPix from './functions/generate-monthly-pix.js';
import confirmMonthlyPix from './functions/confirm-monthly-pix.js';
import testMonthlyPixFlow from './functions/test-monthly-pix-flow.js';
import regeneratePixQrcode from './functions/regenerate-pix-qrcode.js';
import { testGoogleCredentials } from './functions/test-google-credentials.js';
import debugGoogleAuth from './functions/debug-google-auth.js';
import autoCheckPayments from './functions/auto-check-payments.js';
import createTrackingSheet from './functions/create-tracking-sheet.js';
import listSheetTabs from './functions/list-sheet-tabs.js';
import checkPedidosHeaders from './functions/check-pedidos-headers.js';
import checkPagamentosHeaders from './functions/check-pagamentos-headers.js';
import createPagamentosHeaders from './functions/create-pagamentos-headers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.LOCAL_SERVER_PORT || 3003;

// Middleware de segurança com configurações mais permissivas para desenvolvimento
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - configuração mais permissiva para desenvolvimento
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // máximo 1000 requests por IP por janela
  message: 'Muitas requisições deste IP, tente novamente em 1 minuto.'
});
app.use(limiter);

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:5173',
  'https://eetad-sistema-v2.vercel.app'
];
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : defaultOrigins,
  credentials: true
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Rota de health check aprimorada
app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      googleSheets: 'unknown',
      database: 'operational'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  };

  // Test Google Sheets connection
  try {
    const { readSheetDataWithRetry } = await import('./utils/google-auth.js');
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (SPREADSHEET_ID) {
      await readSheetDataWithRetry(SPREADSHEET_ID, "'dados pessoais'!A1:A1", 1);
      healthStatus.services.googleSheets = 'connected';
    } else {
      healthStatus.services.googleSheets = 'not_configured';
    }
  } catch (error) {
    healthStatus.services.googleSheets = 'error';
    healthStatus.services.googleSheetsError = error.message;
  }

  // Determine overall status
  const isHealthy = 
    healthStatus.services.googleSheets === 'connected' ||
    healthStatus.services.googleSheets === 'not_configured';
  
  const statusCode = isHealthy ? 200 : 503;
  healthStatus.status = isHealthy ? 'ok' : 'degraded';

  res.status(statusCode).json(healthStatus);
});

// Quick health check endpoint
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

// Dashboard HTML
app.get('/', (req, res) => {
  const functions = [
    { name: 'finalize-enrollment', status: '✅', description: 'Finalizar matrícula de aluno' },
    { name: 'get-pending-enrollments', status: '✅', description: 'Buscar matrículas pendentes' },
    { name: 'get-enrollments', status: '✅', description: 'Listar matrículas efetivadas' },
    { name: 'save-student-personal-data', status: '✅', description: 'Salvar dados pessoais' },
    { name: 'save-student-registration', status: '🚧', description: 'Salvar registro do aluno' },
    { name: 'create-mercadopago-payment', status: '🚧', description: 'Criar pagamento MercadoPago' },
    { name: 'check-payment-status', status: '🚧', description: 'Verificar status do pagamento' },
    { name: 'mercadopago-webhook', status: '🚧', description: 'Webhook MercadoPago' },
    { name: 'manage-secretary-users', status: '🚧', description: 'Gerenciar usuários da secretaria' },
    { name: 'ai-chatbot', status: '🚧', description: 'Chatbot com IA' },
    { name: 'cancel-order', status: '✅', description: 'Cancelar pedido' },
    { name: 'send-email-notification', status: '✅', description: 'Enviar notificações por email' }
  ];

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EETAD Local Server - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .status { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            padding: 30px; 
        }
        .card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px; 
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
        }
        .card h3 { 
            color: #1e293b; 
            margin-bottom: 15px; 
            display: flex; 
            align-items: center; 
            gap: 10px;
        }
        .functions { 
            background: white; 
            padding: 30px; 
        }
        .function-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px; 
            border-bottom: 1px solid #e2e8f0; 
            transition: background 0.2s;
        }
        .function-item:hover { background: #f1f5f9; }
        .function-item:last-child { border-bottom: none; }
        .function-name { 
            font-weight: 600; 
            color: #1e293b; 
            font-family: 'Courier New', monospace;
        }
        .function-desc { 
            color: #64748b; 
            font-size: 0.9rem; 
        }
        .function-status { 
            font-size: 1.2rem; 
        }
        .links { 
            display: flex; 
            gap: 10px; 
            flex-wrap: wrap; 
        }
        .link { 
            background: #4f46e5; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 6px; 
            text-decoration: none; 
            font-size: 0.9rem; 
            transition: background 0.2s;
        }
        .link:hover { background: #3730a3; }
        .test-btn { 
            background: #059669; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 0.9rem;
            transition: background 0.2s;
        }
        .test-btn:hover { background: #047857; }
        .footer { 
            background: #f8fafc; 
            padding: 20px 30px; 
            text-align: center; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 EETAD Local Server</h1>
            <p>Servidor local para funções migradas do Supabase</p>
        </div>
        
        <div class="status">
            <div class="card">
                <h3>🚀 Status do Servidor</h3>
                <p><strong>Status:</strong> ✅ Online</p>
                <p><strong>Porta:</strong> ${PORT}</p>
                <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Uptime:</strong> ${Math.floor(process.uptime())}s</p>
            </div>
            
            <div class="card">
                <h3>🔗 Links Úteis</h3>
                <div class="links">
                    <a href="/health" class="link">Health Check</a>
                    <a href="/functions/" class="link">Funções</a>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Estatísticas</h3>
                <p><strong>Funções:</strong> ${functions.length}</p>
                <p><strong>Completas:</strong> ${functions.filter(f => f.status === '✅').length}</p>
                <p><strong>Templates:</strong> ${functions.filter(f => f.status === '🚧').length}</p>
            </div>
        </div>
        
        <div class="functions">
            <h2 style="margin-bottom: 20px; color: #1e293b;">📋 Funções Disponíveis</h2>
            ${functions.map(func => `
                <div class="function-item">
                    <div>
                        <div class="function-name">${func.name}</div>
                        <div class="function-desc">${func.description}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="function-status">${func.status}</span>
                        <button class="test-btn" onclick="testFunction('${func.name}')">Testar</button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>EETAD Sistema v2 - Servidor Local | Porta ${PORT} | ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    </div>
    
    <script>
        async function testFunction(functionName) {
            try {
                const response = await fetch(\`/functions/\${functionName}/health\`);
                const data = await response.json();
                alert(\`✅ \${functionName}: \${data.status}\`);
            } catch (error) {
                alert(\`❌ Erro ao testar \${functionName}: \${error.message}\`);
            }
        }
    </script>
</body>
</html>`;
  
  res.send(html);
});

// Rotas das funções
app.use('/functions/finalize-enrollment', finalizeEnrollment);
app.use('/functions/get-enrollments', getEnrollments);
app.use('/functions/get-pending-enrollments', getPendingEnrollments);
app.use('/functions/save-student-personal-data', saveStudentPersonalData);
app.use('/functions/save-student-registration', saveStudentRegistration);
app.use('/functions/create-mercadopago-payment', createMercadoPagoPayment);
app.use('/functions/check-payment-status', checkPaymentStatus);
app.use('/functions/mercadopago-webhook', mercadoPagoWebhook);
app.use('/functions/manage-secretary-users', manageSecretaryUsers);
app.use('/functions/ai-chatbot', aiChatbot);
app.use('/functions/save-settings', saveSettings);
app.use('/api/save-settings', saveSettings);
app.use('/functions/send-whatsapp-notification', sendWhatsappNotification);
app.use('/functions/get-student-personal-data', getStudentPersonalData);
app.use('/functions/get-student-books', getStudentBooks);
app.use('/functions/get-student-enrollment-data', getStudentEnrollmentData);
app.use('/functions/update-student-data', updateStudentData);
app.use('/functions/debug-sheet-data', debugSheetData);
app.use('/functions/save-book-order', saveBookOrder);
app.use('/functions/test-enrollments', testEnrollments);
app.use('/functions/get-matriculated-students', getMatriculatedStudents);
app.use('/functions/get-cursando-students', getCursandoStudents);
app.use('/functions/get-aprovado-students', getAprovadoStudents);
app.use('/functions/generate-static-pix', generateStaticPix);
app.use('/functions/get-student-pix-qrcode', getStudentPixQrcode);
app.use('/functions/confirm-pix-payment', confirmPixPayment);
app.use('/functions/test-pix-flow', testPixFlow);
app.use('/functions/generate-and-save-student-pix', generateAndSaveStudentPix);
app.use('/functions/generate-pix-for-student', generatePixForStudent);
app.use('/functions/generate-qr-code-for-manual-save', generateQrCodeForManualSave);
app.use('/functions/generate-pix-with-tracking', generatePixWithTracking);
app.use('/functions/confirm-pix-by-tracking', confirmPixByTracking);
app.use('/functions/generate-static-pix-with-id', generateStaticPixWithId);
app.use('/functions/confirm-pix-by-id', confirmPixById);
app.use('/functions/get-reprovado-students', getReprovadoStudents);
app.use('/functions/get-recuperacao-students', getRecuperacaoStudents);
app.use('/functions/get-pendente-students', getPendenteStudents);
app.use('/functions/clear-cache', clearCache);
app.use('/functions/debug-save-data', debugSaveData);
app.use('/functions/test-save-complete', testSaveComplete);
app.use('/functions/debug-column-mapping', debugColumnMapping);
app.use('/functions/test-specific-save', testSpecificSave);
app.use('/functions/test-direct-write', testDirectWrite);
app.use('/functions/check-real-data', checkRealData);
app.use('/functions/count-real-rows', countRealRows);
app.use('/functions/generate-monthly-pix', generateMonthlyPix);
app.use('/functions/confirm-monthly-pix', confirmMonthlyPix);
app.use('/functions/test-monthly-pix-flow', testMonthlyPixFlow);
app.use('/functions/regenerate-pix-qrcode', regeneratePixQrcode);
app.post('/functions/test-google-credentials', testGoogleCredentials);
app.post('/functions/debug-google-auth', debugGoogleAuth);
app.use('/functions/auto-check-payments', autoCheckPayments);
app.use('/functions/create-tracking-sheet', createTrackingSheet);
app.use('/functions/list-sheet-tabs', listSheetTabs);
app.use('/functions/check-pedidos-headers', checkPedidosHeaders);
app.use('/functions/check-pagamentos-headers', checkPagamentosHeaders);
app.use('/functions/create-pagamentos-headers', createPagamentosHeaders);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor local EETAD rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`⚡ Funções disponíveis em: http://localhost:${PORT}/functions/*`);
  
  // Verificar variáveis de ambiente essenciais
  const requiredEnvVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEETS_SPREADSHEET_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ Todas as variáveis de ambiente essenciais configuradas');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

export default app;