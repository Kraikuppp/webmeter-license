const express = require('express');
const { z } = require('zod');
const logger = require('../utils/logger');
const { validateAndActivate, heartbeat, STATUS } = require('../services/licenseService');

const router = express.Router();

const validateBody = z.object({
  licenseKey: z.string().min(10),
  hwid: z.string().min(8),
  installerVersion: z.string().optional().default('unknown')
});

router.post('/validate', async (req, res, next) => {
  try {
    const payload = validateBody.parse(req.body);
    const result = await validateAndActivate(payload);

    logger.info({
      event: 'license_validate',
      status: result.status,
      licenseKey: payload.licenseKey,
      hwid: payload.hwid
    });

    if (result.status === STATUS.VALID) {
      return res.json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ status: 'INVALID_PAYLOAD', details: error.flatten() });
    }
    return next(error);
  }
});

const heartbeatBody = z.object({
  licenseKey: z.string().min(10),
  hwid: z.string().min(8)
});

router.post('/heartbeat', async (req, res, next) => {
  try {
    const payload = heartbeatBody.parse(req.body);
    const ok = await heartbeat(payload);
    return res.json({ status: ok ? 'OK' : 'NOT_FOUND' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ status: 'INVALID_PAYLOAD', details: error.flatten() });
    }
    return next(error);
  }
});

module.exports = router;
