// Configuração PM2 para EETAD Sistema v2 - Versão ROOT
// Este arquivo deve estar na raiz do projeto

module.exports = {
  apps: [
    {
      name: 'eetad-backend',
      script: './local-server/index.js',
      cwd: '/var/www/eetad-sistema-v2',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        LOCAL_SERVER_PORT: 3003
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        LOCAL_SERVER_PORT: 3003
      },
      // Logs
      error_file: '/var/log/eetad/backend-error.log',
      out_file: '/var/log/eetad/backend-out.log',
      log_file: '/var/log/eetad/backend-combined.log',
      time: true,
      
      // Configurações de restart
      min_uptime: '10s',
      max_restarts: 10,
      
      // Configurações de cluster (opcional)
      // instances: 'max', // Usar todos os CPUs disponíveis
      // exec_mode: 'cluster',
      
      // Configurações de monitoramento
      monitoring: false,
      
      // Configurações de merge logs
      merge_logs: true,
      
      // Configurações de source map
      source_map_support: true,
      
      // Configurações de ignore watch
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log',
        '.git',
        'dist'
      ]
    }
  ],

  // Configurações de deploy (opcional)
  deploy: {
    production: {
      user: 'root',
      host: 'seu-ip-vps',
      ref: 'origin/main',
      repo: 'https://github.com/Igorryan44/eetad-sistema-v2.git',
      path: '/var/www/eetad-sistema-v2',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && cd local-server && npm install && cd .. && npm run build && pm2 reload ecosystem-root.config.js --env production',
      'pre-setup': ''
    }
  }
};
