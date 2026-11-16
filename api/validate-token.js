const { authenticate } = require('../lib/auth');
const { prepareResponse, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    authenticate(req);
    return res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    return sendError(res, error);
  }
};
