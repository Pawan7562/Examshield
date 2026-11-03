// ecosystem.config.js
// Production PM2 Cluster Configuration for Nexify Examina (ExamShield)
// Optimizes performance across all available CPU cores with auto-restart & memory limits.

module.exports = {
  apps: [
    {
      name: 'examshield-backend',
      script: './server.js',
      cwd: __dirname,
      instances: 'max',          // Utilizes all CPU cores automatically
      exec_mode: 'cluster',      // Built-in TCP load balancing across CPU cores
      watch: false,              // Disable in production to prevent unexpected restarts
      max_memory_restart: '1G',  // Auto-restart if a worker leaks memory above 1GB
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logs configuration
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
