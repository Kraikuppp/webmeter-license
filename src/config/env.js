const dotenv = require('dotenv');
const { z } = require('zod');

if (!process.env.LOADED_ENV) {
  dotenv.config();
  process.env.LOADED_ENV = 'true';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_API_SECRET: z.string().min(16, 'ADMIN_API_SECRET is too short'),
  INSTALLER_SECRET: z.string().min(16, 'INSTALLER_SECRET is too short'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(30),
  CORS_ORIGIN: z.string().default('*')
});

const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_API_SECRET: process.env.ADMIN_API_SECRET,
  INSTALLER_SECRET: process.env.INSTALLER_SECRET,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  CORS_ORIGIN: process.env.CORS_ORIGIN
});

module.exports = env;
