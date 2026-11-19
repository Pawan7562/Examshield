// middleware/rateLimiter.js - Multi-Tier Cluster-Aware Enterprise Rate Limiter
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');

/**
 * Cluster-aware Rate Limit Store for Redis with In-Memory fallback.
 * Synchronizes rate limit counters across all 6 backend container replicas.
 */
class ClusterRateLimitStore {
  constructor(prefix = 'rl:') {
    this.prefix = prefix;
    this.memoryHits = new Map();
    this.memoryReset = new Map();
    this.windowMs = 15 * 60 * 1000;
  }

  init(options) {
    this.windowMs = options.windowMs || 15 * 60 * 1000;
  }

  async increment(key) {
    const redis = getRedisClient();
    if (!redis) {
      return this.memoryIncrement(key);
    }
    const redisKey = `${this.prefix}${key}`;
    try {
      const multi = redis.multi();
      multi.incr(redisKey);
      multi.pTTL(redisKey);
      const results = await multi.exec();

      const totalHits = Number(results[0]);
      const ttl = Number(results[1]);

      let resetTime;
      if (ttl <= 0) {
        await redis.pExpire(redisKey, this.windowMs);
        resetTime = new Date(Date.now() + this.windowMs);
      } else {
        resetTime = new Date(Date.now() + ttl);
      }

      return { totalHits, resetTime };
    } catch (err) {
      return this.memoryIncrement(key);
    }
  }

  async decrement(key) {
    const redis = getRedisClient();
    if (redis) {
      try { await redis.decr(`${this.prefix}${key}`); } catch (_) {}
    } else {
      const hits = this.memoryHits.get(key) || 0;
      if (hits > 0) this.memoryHits.set(key, hits - 1);
    }
  }

  async resetKey(key) {
    const redis = getRedisClient();
    if (redis) {
      try { await redis.del(`${this.prefix}${key}`); } catch (_) {}
    } else {
      this.memoryHits.delete(key);
      this.memoryReset.delete(key);
    }
  }

  memoryIncrement(key) {
    const now = Date.now();
    let resetTime = this.memoryReset.get(key);
    if (!resetTime || now > resetTime) {
      resetTime = now + this.windowMs;
      this.memoryReset.set(key, resetTime);
      this.memoryHits.set(key, 1);
      return { totalHits: 1, resetTime: new Date(resetTime) };
    }
    const hits = (this.memoryHits.get(key) || 0) + 1;
    this.memoryHits.set(key, hits);
    return { totalHits: hits, resetTime: new Date(resetTime) };
  }
}

/**
 * Helper to safely extract client IP behind reverse proxies (Nginx / Cloudflare)
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

/**
 * Super Admin Login Limiter
 * Maximum 5 failed login attempts per 15 minutes per IP.
 * Strict protection against credential attacks on the master administrative account.
 */
const superAdminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:superadmin_login:'),
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many Super Admin login attempts from this network. Access suspended for 15 minutes for security.',
      retryAfter: 900
    });
  }
});

/**
 * College Admin Login Limiter
 * Maximum 10 login attempts per 15 minutes per institution email or IP.
 */
const collegeLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:college_login:'),
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : '';
    if (email) return `email:${email}`;
    return `ip:${getClientIp(req)}`;
  },
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. For security reasons, please wait 15 minutes before trying again or use the password recovery link.',
      retryAfter: 900
    });
  }
});

/**
 * College Registration Limiter
 * Maximum 5 registrations per hour per IP.
 */
const collegeRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:college_register:'),
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Registration rate limit reached for this IP address. Please contact support@nexifyforge.in for institutional onboarding.',
      retryAfter: 3600
    });
  }
});

/**
 * Student Login Limiter
 * Account-level rate limiter: 10 attempts per 15 minutes per Student ID / Email.
 * Crucial: Prevents campus Wi-Fi NAT collision while completely blocking targeted brute-force.
 */
const studentLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:student_login:'),
  keyGenerator: (req) => {
    const rawId = req.body?.student_id || req.body?.email || req.body?.roll_number || '';
    const cleanId = String(rawId).trim().toLowerCase();
    if (cleanId) return `account:${cleanId}`;
    return `ip:${getClientIp(req)}`;
  },
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many sign-in attempts for this student account. Please wait 15 minutes or contact your college exam coordinator.',
      retryAfter: 900
    });
  }
});

/**
 * Password Reset & Recovery Limiter
 * Maximum 5 requests per 15 minutes per email/target.
 */
const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:password_recovery:'),
  keyGenerator: (req) => {
    const email = req.body?.email || req.body?.student_id || '';
    const clean = String(email).trim().toLowerCase();
    if (clean) return `target:${clean}`;
    return `ip:${getClientIp(req)}`;
  },
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password recovery requests. Please wait 15 minutes before requesting another security reset code.',
      retryAfter: 900
    });
  }
});

/**
 * General API Limiter (Token or IP based)
 * 2,000 requests per 15 minutes per user / IP.
 */
const apiGeneralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:api_general:'),
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          return `user:${decoded.role || 'u'}:${decoded.id}`;
        }
      } catch (_) {}
    }
    return `ip:${getClientIp(req)}`;
  },
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    if (req.originalUrl?.includes('/api/student/exam/') && req.originalUrl?.includes('/heartbeat')) return true;
    if (req.originalUrl?.includes('/run-code') || req.originalUrl?.includes('/submit-code')) return true;
    return false;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'High request frequency detected. System bandwidth protected.',
      retryAfter: 60
    });
  }
});

/**
 * Code Execution Limiter
 * Protects isolated execution container against runaway loops or compilation abuse.
 * 60 runs per minute per candidate session.
 */
const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ClusterRateLimitStore('rl:code_exec:'),
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.decode(authHeader.slice(7));
        if (decoded && decoded.id) {
          return `student:${decoded.id}`;
        }
      } catch (_) {}
    }
    const studentId = req.user?.id || req.body?.studentId || req.body?.student_id;
    const session = req.body?.sessionId || req.body?.session_id;
    if (studentId) return `student:${studentId}`;
    if (session) return `session:${session}`;
    return `ip:${getClientIp(req)}`;
  },
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Code compilation limit reached (max 60 executions/minute). Please review your code before re-running.',
      retryAfter: 60
    });
  }
});

module.exports = {
  superAdminLoginLimiter,
  collegeLoginLimiter,
  collegeRegisterLimiter,
  studentLoginLimiter,
  passwordRecoveryLimiter,
  apiGeneralLimiter,
  codeExecutionLimiter,
  getClientIp
};
