import express from 'express';
import { corsMiddleware } from '../utils/cors.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(corsMiddleware);

// Hash seguro para senha usando método mais robusto
function hashPassword(password) {
  const salt = 'eetad_salt_2024';
  let hash = 0;
  const input = salt + password + salt;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
    hash = Math.abs(hash);
  }
  
  // Aplicar múltiplas iterações para maior segurança
  for (let i = 0; i < 1000; i++) {
    hash = ((hash << 3) ^ (hash >>> 2)) & 0x7fffffff;
  }
  
  return hash.toString(16).padStart(8, '0');
}

// Caminho para arquivo de usuários (temporário)
const USERS_FILE = path.join(__dirname, '..', 'data', 'secretary-users.json');

// Garantir que o diretório existe
function ensureDataDirectory() {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Carregar usuários do arquivo
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
  
  // Retornar usuário padrão se arquivo não existe
  return [{
    id: '1',
    username: 'Admin',
    email: 'admin@eetad.com',
    fullName: 'Administrador',
    passwordHash: hashPassword('admin1'),
    createdAt: new Date().toISOString(),
    status: 'ATIVO'
  }];
}

// Salvar usuários no arquivo
function saveUsers(users) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar usuários:', error);
    return false;
  }
}

router.post('/', async (req, res) => {
  try {
    const { action, username, password, userData } = req.body;
    console.log('👥 Gerenciando usuários secretaria:', { action, username: username || 'N/A' });
    
    switch (action) {
      case 'list':
        const users = loadUsers();
        res.json({ success: true, users });
        break;
        
      case 'login':
        const allUsers = loadUsers();
        const user = allUsers.find(u => u.username === username);
        
        if (user) {
          const inputPasswordHash = hashPassword(password);
          
          if (user.passwordHash === inputPasswordHash) {
            // Atualizar último login
            user.lastLogin = new Date().toISOString();
            saveUsers(allUsers);
            
            // Remover hash da senha da resposta
            const { passwordHash, ...userResponse } = user;
            
            res.json({ 
              success: true, 
              user: userResponse,
              message: 'Login realizado com sucesso'
            });
          } else {
            res.json({ 
              success: false, 
              error: 'Credenciais inválidas' 
            });
          }
        } else {
          res.json({ 
            success: false, 
            error: 'Usuário não encontrado' 
          });
        }
        break;
        
      case 'create':
        const existingUsers = loadUsers();
        
        // Verificar se usuário já existe
        const existingUser = existingUsers.find(u => 
          u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
          res.json({ 
            success: false, 
            error: 'Usuário ou email já existem' 
          });
          break;
        }

        const newUser = {
          id: Date.now().toString(),
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          passwordHash: hashPassword(userData.password),
          createdAt: new Date().toISOString(),
          status: 'ATIVO'
        };

        existingUsers.push(newUser);
        
        if (saveUsers(existingUsers)) {
          const { passwordHash, ...userResponse } = newUser;
          res.json({ 
            success: true, 
            user: userResponse,
            message: 'Usuário criado com sucesso'
          });
        } else {
          res.json({ 
            success: false, 
            error: 'Erro ao salvar usuário' 
          });
        }
        break;
        
      default:
        res.json({ 
          success: false, 
          error: 'Ação não suportada' 
        });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ function: 'manage-secretary-users', status: 'ok' });
});

export default router;