module.exports = {
  apps: [
    {
      name: "med_backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003
      }
    }
  ]
};
