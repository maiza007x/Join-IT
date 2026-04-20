module.exports = {
  apps: [
    {
      name: "join-it_backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003
      }
    }
  ]
};
