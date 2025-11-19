const { differenceInDays } = require('date-fns');
const { query, withTransaction } = require('../config/database');
const env = require('../config/env');
const {
  normalizeKey,
  verifyLicenseKeyStructure,
  createValidationToken
} = require('../utils/crypto');

const STATUS = {
  VALID: 'VALID',
  INVALID_INSTALLER: 'INVALID_INSTALLER',
  KEY_NOT_FOUND: 'KEY_NOT_FOUND',
  KEY_EXPIRED: 'KEY_EXPIRED',
  DEVICE_LIMIT_EXCEEDED: 'DEVICE_LIMIT_EXCEEDED',
  LICENSE_REVOKED: 'LICENSE_REVOKED',
  LICENSE_SUSPENDED: 'LICENSE_SUSPENDED'
};

async function getLicenseByKey(rawKey, runner = query) {
  const licenseKey = normalizeKey(rawKey);
  const result = await runner(
    'SELECT * FROM licenses WHERE license_key = $1',
    [licenseKey]
  );
  return result.rows[0];
}

async function listDevices(licenseId) {
  const result = await query(
    'SELECT * FROM license_devices WHERE license_id = $1 ORDER BY activated_at ASC',
    [licenseId]
  );
  return result.rows;
}

async function upsertDevice(runner, license, hwid, installerVersion) {
  const existing = await runner(
    'SELECT * FROM license_devices WHERE license_id = $1 AND hwid = $2',
    [license.id, hwid]
  );

  if (existing.rows.length > 0) {
    await runner(
      'UPDATE license_devices SET last_used = now(), installer_version = $2 WHERE id = $1',
      [existing.rows[0].id, installerVersion]
    );
    return { device: existing.rows[0], licenseSnapshot: license };
  }

  if (license.used_devices >= license.max_devices) {
    const err = new Error('Device limit exceeded');
    err.code = STATUS.DEVICE_LIMIT_EXCEEDED;
    throw err;
  }

  const insertResult = await runner(
    `INSERT INTO license_devices (license_id, hwid, installer_version)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [license.id, hwid, installerVersion]
  );

  const updatedLicense = await runner(
    'UPDATE licenses SET used_devices = used_devices + 1 WHERE id = $1 RETURNING *',
    [license.id]
  );

  return { device: insertResult.rows[0], licenseSnapshot: updatedLicense.rows[0] };
}

async function validateAndActivate({ licenseKey, hwid, installerVersion }) {
  if (!verifyLicenseKeyStructure(licenseKey)) {
    return { status: STATUS.KEY_NOT_FOUND };
  }

  try {
    return await withTransaction(async (client) => {
      const runner = (text, params) => client.query(text, params);
      const license = await getLicenseByKey(licenseKey, runner);

      if (!license) {
        return { status: STATUS.KEY_NOT_FOUND };
      }

      if (license.status === 'revoked') {
        return { status: STATUS.LICENSE_REVOKED };
      }

      if (license.status === 'suspended') {
        return { status: STATUS.LICENSE_SUSPENDED };
      }

      const now = new Date();
      const expiry = new Date(license.expiry_date);
      if (now > expiry) {
        return { status: STATUS.KEY_EXPIRED };
      }

      let licenseSnapshot = license;
      try {
        const result = await upsertDevice(runner, license, hwid, installerVersion);
        licenseSnapshot = result.licenseSnapshot;
      } catch (error) {
        if (error.code === STATUS.DEVICE_LIMIT_EXCEEDED) {
          return { status: STATUS.DEVICE_LIMIT_EXCEEDED };
        }
        throw error;
      }

      const remainingSeats = Math.max(licenseSnapshot.max_devices - licenseSnapshot.used_devices, 0);
      return {
        status: STATUS.VALID,
        data: {
          licenseKey: normalizeKey(licenseSnapshot.license_key),
          type: licenseSnapshot.type,
          expiresAt: licenseSnapshot.expiry_date,
          daysRemaining: differenceInDays(new Date(licenseSnapshot.expiry_date), new Date()),
          remainingSeats,
          validationToken: createValidationToken(licenseSnapshot.license_key, hwid)
        }
      };
    });
  } catch (error) {
    throw error;
  }
}

async function heartbeat({ licenseKey, hwid }) {
  const normalized = normalizeKey(licenseKey);
  const result = await query(
    `UPDATE license_devices ld
     SET last_used = now()
     FROM licenses l
     WHERE ld.license_id = l.id AND l.license_key = $1 AND ld.hwid = $2
     RETURNING ld.*`,
    [normalized, hwid]
  );
  return result.rowCount > 0;
}

async function revokeLicense(licenseKey, status = 'revoked') {
  const normalized = normalizeKey(licenseKey);
  const result = await query(
    'UPDATE licenses SET status = $2 WHERE license_key = $1 RETURNING *',
    [normalized, status]
  );
  return result.rows[0];
}

async function listLicenses({ limit = 50, offset = 0 }) {
  const result = await query(
    'SELECT * FROM licenses ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

module.exports = {
  STATUS,
  validateAndActivate,
  heartbeat,
  revokeLicense,
  listLicenses,
  listDevices,
  getLicenseByKey
};
