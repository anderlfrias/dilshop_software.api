const jwt = require('jsonwebtoken');
const { ROOT } = require('../../constants/role');

module.exports = async function (req, res, proceed) {
  const token = req.headers.authorization;

  console.log('isRoot?');
  jwt.verify(token, sails.config.session.secret, async (err, decoded) => {
    if (err) {
      return res.forbidden();
    }

    const isAuthorized = await sails.helpers.verifyUserRole(decoded, ROOT);

    if (!isAuthorized) {
      return res.forbidden();
    }

    req.user = decoded;
    proceed();
  });
};
