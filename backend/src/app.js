'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');

const errorHandler = require('./middleware/errorHandler');

// Routes
const jobsRouter            = require('./routes/jobs');
const skillsRouter          = require('./routes/skills');
const rolesRouter           = require('./routes/roles');
const profileRouter         = require('./routes/profile');
const matchRouter           = require('./routes/match');
const marketRouter          = require('./routes/market');
const recommendationsRouter = require('./routes/recommendations');

const app = express();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/jobs',            jobsRouter);
app.use('/api/skills',          skillsRouter);
app.use('/api/roles',           rolesRouter);
app.use('/api/profile',         profileRouter);
app.use('/api/match',           matchRouter);
app.use('/api/market',          marketRouter);
app.use('/api/recommendations', recommendationsRouter);

// ---------------------------------------------------------------------------
// 404 — unknown routes
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ---------------------------------------------------------------------------
// Global error handler (must be last)
// ---------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
