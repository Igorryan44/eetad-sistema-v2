import express from 'express';
import nodemailer from 'nodemailer';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();
router.use(corsMiddleware);

// Configurar transporter do nodemailer
function createTransporter() {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

router.post('/', async (req, res) => {
  try {
    console.log('📧 Enviando notificação por email:', req.body);
    
    const { to, subject, message, type } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Destinatário, assunto e mensagem são obrigatórios'
      });
    }
    
    // Verificar credenciais SMTP
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(500).json({
        success: false,
        error: `Credenciais SMTP não configuradas: ${missingVars.join(', ')}`
      });
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.FROM_NAME || 'EETAD'} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html: message,
      text: message.replace(/<[^>]*>/g, '') // Remove HTML tags para versão texto
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email enviado com sucesso',
      messageId: info.messageId,
      type: type || 'notification'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  
  res.json({ 
    function: 'send-email-notification', 
    status: 'ok',
    hasSmtpConfig
  });
});

export default router;