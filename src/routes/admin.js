const express = require('express');
const { z } = require('zod');
const logger = require('../utils/logger');
const { createBatch } = require('../services/keygen');
const {
  listLicenses,
  revokeLicense,
  listDevices,
  getLicenseByKey
} = require('../services/licenseService');

const router = express.Router();

const licensePayload = z.object({
  count: z.number().int().min(1).max(1000).default(1),
  expiryDate: z.union([z.string().min(8), z.number().int().positive()]).optional(),
  maxDevices: z.number().int().min(1).max(100).default(1),
  type: z.enum(['demo', 'full', 'oem']).default('full'),
  status: z.enum(['active', 'suspended', 'revoked']).default('active'),
  metadata: z.record(z.any()).optional()
});

router.post('/licenses', async (req, res, next) => {
  try {
    const payload = licensePayload.parse(req.body);
    const result = await createBatch(payload);
    logger.info({ event: 'admin_create_license', count: result.length });
    return res.status(201).json({ count: result.length, licenses: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ status: 'INVALID_PAYLOAD', details: error.flatten() });
    }
    return next(error);
  }
});

router.get('/licenses', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const data = await listLicenses({ limit, offset });
    return res.json({ items: data, count: data.length });
  } catch (error) {
    return next(error);
  }
});

router.get('/licenses/:key', async (req, res, next) => {
  try {
    const license = await getLicenseByKey(req.params.key);
    if (!license) {
      return res.status(404).json({ status: 'KEY_NOT_FOUND' });
    }
    const devices = await listDevices(license.id);
    return res.json({ license, devices });
  } catch (error) {
    return next(error);
  }
});

const statusPayload = z.object({
  status: z.enum(['active', 'suspended', 'revoked']).default('revoked')
});

router.post('/licenses/:key/status', async (req, res, next) => {
  try {
    const { status } = statusPayload.parse(req.body || {});
    const license = await revokeLicense(req.params.key, status);
    if (!license) {
      return res.status(404).json({ status: 'KEY_NOT_FOUND' });
    }
    logger.warn({ event: 'admin_license_status', key: req.params.key, status });
    return res.json({ status: 'UPDATED', license });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ status: 'INVALID_PAYLOAD', details: error.flatten() });
    }
    return next(error);
  }
});

module.exports = router;
