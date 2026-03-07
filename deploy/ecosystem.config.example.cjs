module.exports = {
  apps: [
    {
      name: 'ordinary-note-api',
      script: 'packages/server/dist/index.js',
      cwd: '/home/<user>/ordinary-note',
      exec_mode: 'fork',
      instances: 1,
      node_args: '--env-file=packages/server/.env',
      kill_timeout: 35000,
      wait_ready: false,
      listen_timeout: 10000,
      max_restarts: 5,
      min_uptime: '5s',
      restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
