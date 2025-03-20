module.exports = {
  apps: [
    {
      name: "bolibro-rentals",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
