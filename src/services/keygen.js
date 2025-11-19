const { addDays, parseISO, isValid } = require('date-fns');
const { query, withTransaction } = require('../config/database');
const { generateLicenseKey, normalizeKey } = require('../utils/crypto');

const DEFAULT_EXPIRY_DAYS = 365;

function resolveExpiryDate(expiry) {
  if (!expiry) {
    return addDays(new Date(), DEFAULT_EXPIRY_DAYS);
  }

  if (typeof expiry === 'number') {
    return addDays(new Date(), expiry);
  }

  if (typeof expiry === 'string') {
    const parsed = parseISO(expiry);
    if (isValid(parsed)) {
      return parsed;
    }
  }

  throw new Error('Invalid expiry date value');
}

async function createLicenseRecord({
  expiryDate,
  maxDevices = 1,
  type = 'full',
  metadata = {},
  status = 'active'
}) {
  const expiresAt = resolveExpiryDate(expiryDate);

  return withTransaction(async (client) => {
    let attempts = 0;
    while (attempts < 5) {
      attempts += 1;
      const { key } = generateLicenseKey();
      const normalizedKey = normalizeKey(key);
      try {
        const result = await client.query(
          `INSERT INTO licenses (license_key, checksum, expiry_date, max_devices, status, type, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            normalizedKey,
            normalizedKey.split('-').pop(),
            expiresAt,
            maxDevices,
            status,
            type,
            metadata
          ]
        );
        return result.rows[0];
      } catch (error) {
        if (error.code === '23505') {
          continue; // collision, retry
        }
        throw error;
      }
    }
    throw new Error('Failed to generate unique license key');
  });
}

async function createBatch({ count = 1, ...options }) {
  const jobs = [];
  for (let i = 0; i < count; i += 1) {
    jobs.push(createLicenseRecord(options));
  }
  return Promise.all(jobs);
}

module.exports = {
  createLicenseRecord,
  createBatch
};
