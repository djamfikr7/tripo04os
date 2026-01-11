const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '100');

const rateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_REQUESTS,
  standardHeaders: true,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).send('Too Many Requests - Rate limit exceeded');
    res.setHeader('Retry-After', new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toUTCString());
  },
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      reportUri: '/csp-report',
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'sameorigin',
  },
  permittedCrossDomainPolicies: false,
  referrerPolicy: {
    policy: 'no-referrer',
  },
}));

app.use(rateLimitMiddleware);

app.use((req, res, next) => {
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'security-middleware',
    timestamp: new Date().toISOString(),
  });
});

app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.log('CSP Violation:', req.body);
  res.status(204).end();
});

const securityMiddleware = express.Router();
securityMiddleware.use(helmet());
securityMiddleware.use(rateLimitMiddleware);

module.exports = {
  app,
  securityMiddleware,
  applySecurity: (targetApp) => {
    targetApp.use(helmet());
    targetApp.use(rateLimitMiddleware);
  },
};

if (require.main === module) {
  const PORT = process.env.PORT || 8000;

  app.listen(PORT, () => {
    console.log(`Security middleware service running on port ${PORT}`);
    console.log(`Rate limit: ${RATE_LIMIT_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS}ms`);
  });
}
