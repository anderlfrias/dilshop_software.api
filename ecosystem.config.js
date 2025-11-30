module.exports = {
  apps : [{
    name   : "restaurante.api",
    script : "./app.js",
    autorestart: true,
    env: {
      PORT: 3001,
    }
  }]
}
