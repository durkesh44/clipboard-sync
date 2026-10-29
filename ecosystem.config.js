module.exports = {
  apps: [
    {
      name: 'clipboard-server',
      cwd: './server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        PORT: 3000,
      },
    },
    {
      name: 'clipboard-client',
      cwd: './windows-client',
      script: 'client.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
