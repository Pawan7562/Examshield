// Vercel Serverless API Entry Point
// This file handles the routing between frontend and backend

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import backend routes
const { admin, student, auth, results } = require('../backend/routes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:", "https://api.supabase.co"],
    },
  },
}));

// CORS configuration for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://examshield.vercel.app', 'https://examshield-git-*.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression and rate limiting
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/admin', admin);
app.use('/api/student', student);
app.use('/api/auth', auth);
app.use('/api/results', results);

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  // Don't leak error details in production
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
});

// Export for Vercel
module.exports = app;
