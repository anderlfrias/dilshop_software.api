module.exports = {
  apps : [{
    name   : 'dilshop.api',
    script : './app.js',
    autorestart: true,
    env: {
      PORT: 3010,
    }
  }]
}
