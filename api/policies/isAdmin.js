const jwt = require('jsonwebtoken');
const { ADMIN } = require('../../constants/role');

module.exports = async function (req, res, proceed) {
  const token = req.headers.authorization;

  jwt.verify(token, sails.config.session.secret, async (err, decoded) => {
    console.log('isAdmin?');
    if (err) {
      return res.forbidden();
    }

    const isAuthorized = await sails.helpers.verifyUserRole(decoded, ADMIN);

    if (!isAuthorized) {
      return res.forbidden();
    }

    req.user = decoded;
    proceed();
  });
};
