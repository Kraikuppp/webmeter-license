const env = require('../config/env');

function installerAuth(req, res, next) {
  const headerSecret = req.header('x-installer-secret');
  if (!headerSecret || headerSecret !== env.INSTALLER_SECRET) {
    return res.status(401).json({
      status: 'INVALID_INSTALLER',
      message: 'Installer secret mismatch'
    });
  }
  return next();
}

function adminAuth(req, res, next) {
  const headerSecret = req.header('x-admin-secret');
  if (!headerSecret || headerSecret !== env.ADMIN_API_SECRET) {
    return res.status(401).json({
      status: 'UNAUTHORIZED',
      message: 'Admin secret mismatch'
    });
  }
  return next();
}

module.exports = {
  installerAuth,
  adminAuth
};
