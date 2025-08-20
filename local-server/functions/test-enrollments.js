import express from 'express';
import { corsMiddleware } from '../utils/cors.js';

const router = express.Router();

// Aplicar middleware CORS
router.use(corsMiddleware);

// Rota de teste para simular dados com diferentes status
router.post('/', async (req, res) => {
  try {
    console.log('🧪 Retornando dados de teste com diferentes status...');

    // Dados de teste com diferentes status
    const testEnrollments = [
      {
        rowIndex: 1,
        nome: 'João Silva',
        cpf: '123.456.789-01',
        nucleo: '1979',
        subnucleo: 'ARNO 44',
        ciclo: '1º Ciclo - Formação Básica',
        data: '13/08/2025',
        status: 'Matriculado',
        observacao: '',
        congregacao: ''
      },
      {
        rowIndex: 2,
        nome: 'Maria Santos',
        cpf: '987.654.321-09',
        nucleo: '1979',
        subnucleo: 'ARNO 44',
        ciclo: '1º Ciclo - Formação Básica',
        data: '13/08/2025',
        status: 'Cursando',
        observacao: '',
        congregacao: ''
      },
      {
        rowIndex: 3,
        nome: 'Pedro Costa',
        cpf: '456.789.123-45',
        nucleo: '1979',
        subnucleo: 'ARNO 44',
        ciclo: '1º Ciclo - Formação Básica',
        data: '13/08/2025',
        status: 'Aprovado',
        observacao: '',
        congregacao: ''
      },
      {
        rowIndex: 4,
        nome: 'Ana Oliveira',
        cpf: '789.123.456-78',
        nucleo: '1979',
        subnucleo: 'ARNO 44',
        ciclo: '1º Ciclo - Formação Básica',
        data: '13/08/2025',
        status: 'Não-cursando',
        observacao: '',
        congregacao: ''
      },
      {
        rowIndex: 5,
        nome: 'Carlos Ferreira',
        cpf: '321.654.987-32',
        nucleo: '1979',
        subnucleo: 'ARNO 44',
        ciclo: '1º Ciclo - Formação Básica',
        data: '13/08/2025',
        status: 'Recuperação',
        observacao: '',
        congregacao: ''
      },
      {
        rowIndex: 6,
        nome: 'Lucia Mendes',
        cpf: '654.321.789-65',
        nucleo: '1979',
        subnucleo: 'ARNO 44',
        ciclo: '1º Ciclo - Formação Básica',
        data: '13/08/2025',
        status: 'Reprovado',
        observacao: '',
        congregacao: ''
      }
    ];

    console.log(`🧪 Retornando ${testEnrollments.length} matrículas de teste`);
    res.json(testEnrollments);

  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota GET para compatibilidade
router.get('/', async (req, res) => {
  req.body = {};
  return router.handle(req, res);
});

export default router;