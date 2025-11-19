const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const installerLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      status: 'RATE_LIMITED',
      message: 'Too many requests, slow down'
    });
  }
});

const adminLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX * 5,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  installerLimiter,
  adminLimiter
};
