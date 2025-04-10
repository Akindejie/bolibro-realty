module.exports = {
  apps: [
    {
      name: 'bolibro-realty',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
