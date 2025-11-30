const jwt = require('jsonwebtoken');

module.exports = async function (req, res, proceed) {
  const token = req.headers.authorization;

  jwt.verify(token, sails.config.session.secret, (err, decoded) => {
    if (err) {
      return res.forbidden();
    }

    // validar si el token ha expirado
    const tokenExpirado = new Date(decoded.exp * 1000) < new Date();
    if (tokenExpirado) {
      return res.forbidden({
        err: 'El token ha expirado',
        code: 'E_TOKEN_EXPIRED',
      });
    }

    req.user = decoded;
    proceed();
  });
};
