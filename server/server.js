const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const connectDB = require('./config/db');
const sanitize = require('./middleware/sanitize');

dotenv.config();

// Refuse to start without a JWT secret (needed for login)
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is short. Use a random string of 32+ characters.');
}

const app = express();

// Needed when the app runs behind a hosting proxy (Render, Railway, etc.)
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS: only your own front-end may call the API.
// CLIENT_ORIGIN can hold several addresses separated by commas.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const err = new Error('Origin not allowed by CORS');
    err.status = 403;
    callback(err);
  }
}));

app.use(express.json({ limit: '10kb' }));
app.use(sanitize);

// Login brute-force protection: 10 failed attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);

// General limit: 1000 requests per 15 minutes per IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' }
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/machines', require('./routes/machineRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/quality', require('./routes/qualityRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/waste', require('./routes/wasteRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Paper Mill API is running!' });
});

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Central error handler (bad JSON, CORS, unexpected errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: status < 500 ? err.message : 'Server error' });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then accept requests
(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();