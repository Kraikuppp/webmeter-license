const crypto = require('crypto');
const { customAlphabet } = require('nanoid');
const env = require('../config/env');

const SEGMENT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SEGMENT_LENGTH = 4;
const PREFIX = 'WM';
const segmentGenerator = customAlphabet(SEGMENT_ALPHABET, SEGMENT_LENGTH);

const checksumSalt = crypto.createHash('sha256')
  .update(`${env.ADMIN_API_SECRET}:${env.INSTALLER_SECRET}:wm-license-v1`)
  .digest('hex');

function randomSegment() {
  return segmentGenerator();
}

function computeChecksum(payload) {
  return crypto
    .createHash('sha256')
    .update(payload + checksumSalt)
    .digest('hex')
    .slice(0, SEGMENT_LENGTH)
    .toUpperCase();
}

function normalizeKey(key) {
  return key
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/--+/g, '-');
}

function generateLicenseKey() {
  const segments = [randomSegment(), randomSegment(), randomSegment()];
  const payload = segments.join('');
  const checksum = computeChecksum(payload);
  const key = `${PREFIX}-${segments.join('-')}-${checksum}`;
  return { key, checksum, segments };
}

function splitKey(key) {
  const normalized = normalizeKey(key);
  const parts = normalized.split('-');
  if (parts.length !== 5 || parts[0] !== PREFIX) {
    return null;
  }
  return {
    prefix: parts[0],
    bodySegments: parts.slice(1, 4),
    checksumSegment: parts[4],
    normalized
  };
}

function verifyLicenseKeyStructure(key) {
  const segments = splitKey(key);
  if (!segments) return false;
  const { bodySegments, checksumSegment } = segments;
  if (bodySegments.some((segment) => segment.length !== SEGMENT_LENGTH)) {
    return false;
  }
  const expectedChecksum = computeChecksum(bodySegments.join(''));
  return checksumSegment === expectedChecksum;
}

function createValidationToken(licenseKey, hwid) {
  const timestamp = Date.now();
  const payload = `${licenseKey}:${hwid}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', env.INSTALLER_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ timestamp, signature })).toString('base64url');
}

module.exports = {
  generateLicenseKey,
  verifyLicenseKeyStructure,
  normalizeKey,
  computeChecksum,
  createValidationToken
};
