const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const env = require('./config/env');
const { installerAuth, adminAuth } = require('./middleware/auth');
const { installerLimiter, adminLimiter } = require('./middleware/rateLimit');

const installerRoutes = require('./routes/installer');
const adminRoutes = require('./routes/admin');

const app = express();

// Fix CORS: Allow all origins (including file:// which is 'null') and custom headers
app.use(cors({
  origin: true, // Reflects the request origin (works for 'null' and others)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret', 'x-installer-secret']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(helmet());
app.use(express.json());
// app.use(cors(...)); // Removed old CORS line

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/v1/licenses', installerLimiter, installerAuth, installerRoutes);
app.use('/api/v1/admin', adminLimiter, adminAuth, adminRoutes);

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
});

app.listen(env.PORT, () => {
  logger.info(`License server listening on port ${env.PORT}`);
});
