import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import proxy from 'express-http-proxy';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 5000;

// Trust reverse proxy for client IP resolution
app.set('trust proxy', 1);

// HTTP Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Microservice Base URLs (configurable via environment variables)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001';
const VISIT_SERVICE_URL = process.env.VISIT_SERVICE_URL || 'http://127.0.0.1:5002';
const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://127.0.0.1:5003';
const MASTER_SERVICE_URL = process.env.MASTER_SERVICE_URL || 'http://127.0.0.1:5004';

// Hardened CORS
const allowedOriginRegex = /^(https?:\/\/localhost(:\d+)?|https?:\/\/127\.0\.0\.1(:\d+)?|https:\/\/.*\.vercel\.app)$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginRegex.test(origin) || (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate Limiters
const gatewayLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

const gatewayApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'API Gateway rate limit exceeded. Please try again later.' }
});

app.use('/api/', gatewayApiLimiter);
app.use('/api/auth/login', gatewayLoginLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Resilient Proxy Helper
const createMicroserviceProxy = (targetUrl, serviceName) => {
  return proxy(targetUrl, {
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: (err, res, next) => {
      console.error(`[Gateway Proxy Error] Target "${serviceName}" (${targetUrl}) is unreachable:`, err.message);
      return res.status(503).json({
        success: false,
        errorType: 'MICROSERVICE_UNAVAILABLE',
        service: serviceName,
        targetUrl,
        message: `${serviceName} is currently unavailable. Please verify that the microservice is running.`,
        hint: `Run "npm run start:services" to start all microservices simultaneously.`
      });
    }
  });
};

// 1. Auth & Employee Microservice (Port 5001)
app.use('/api/auth', createMicroserviceProxy(AUTH_SERVICE_URL, 'Auth Service (Port 5001)'));
app.use('/api/employees', createMicroserviceProxy(AUTH_SERVICE_URL, 'Auth & Employee Service (Port 5001)'));

// 2. Visit, Daily Expenses & Stats Microservice (Port 5002)
app.use('/api/visits', createMicroserviceProxy(VISIT_SERVICE_URL, 'Visit Service (Port 5002)'));
app.use('/api/daily-visit-expenses', createMicroserviceProxy(VISIT_SERVICE_URL, 'Expense Service (Port 5002)'));
app.use('/api/stats', createMicroserviceProxy(VISIT_SERVICE_URL, 'Stats & Dashboard Service (Port 5002)'));

// 3. Sales & Commercial Microservice (Port 5003)
app.use('/api/clients', createMicroserviceProxy(SALES_SERVICE_URL, 'Sales Service (Port 5003)'));
app.use('/api/customers', createMicroserviceProxy(SALES_SERVICE_URL, 'Sales Service (Port 5003)'));
app.use('/api/contact-persons', createMicroserviceProxy(SALES_SERVICE_URL, 'Sales Service (Port 5003)'));
app.use('/api/opportunities', createMicroserviceProxy(SALES_SERVICE_URL, 'Sales Service (Port 5003)'));
app.use('/api/quotations', createMicroserviceProxy(SALES_SERVICE_URL, 'Sales Service (Port 5003)'));

// 4. Master Data Microservice (Port 5004)
app.use('/api/masters', createMicroserviceProxy(MASTER_SERVICE_URL, 'Master Data Service (Port 5004)'));

// Helper to query microservice health
const checkServiceHealth = (url, name) => {
  return new Promise((resolve) => {
    const healthUrl = `${url}/health`;
    const req = http.get(healthUrl, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ name, url, status: 'UP', code: res.statusCode, details: parsed });
        } catch {
          resolve({ name, url, status: 'UP', code: res.statusCode });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ name, url, status: 'DOWN', error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ name, url, status: 'TIMEOUT' });
    });
  });
};

// Aggregated Gateway Health Check
app.get('/api/health', async (req, res) => {
  const [authHealth, visitHealth, salesHealth, masterHealth] = await Promise.all([
    checkServiceHealth(AUTH_SERVICE_URL, 'Auth & Employee Service'),
    checkServiceHealth(VISIT_SERVICE_URL, 'Visit & Operations Service'),
    checkServiceHealth(SALES_SERVICE_URL, 'Sales & Quotation Service'),
    checkServiceHealth(MASTER_SERVICE_URL, 'Master Data Service')
  ]);

  const allUp = [authHealth, visitHealth, salesHealth, masterHealth].every(s => s.status === 'UP');

  res.status(allUp ? 200 : 207).json({
    gateway: 'UP',
    port: PORT,
    architecture: 'Microservices with API Gateway',
    overallStatus: allUp ? 'ALL_SERVICES_HEALTHY' : 'PARTIALLY_DEGRADED',
    services: {
      authService: authHealth,
      visitService: visitHealth,
      salesService: salesHealth,
      masterService: masterHealth
    },
    timestamp: new Date().toISOString()
  });
});

// Root Information
app.get('/', (req, res) => {
  res.json({
    name: 'Field Visit CRM API Gateway',
    version: '1.0.0',
    port: PORT,
    architecture: 'Microservices Pattern',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      employees: '/api/employees',
      visits: '/api/visits',
      expenses: '/api/daily-visit-expenses',
      stats: '/api/stats/dashboard',
      customers: '/api/customers',
      quotations: '/api/quotations',
      masters: '/api/masters'
    }
  });
});

export const startGateway = () => {
  return app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 [API Gateway] running on http://localhost:${PORT}`);
    console.log(`🔐 Auth Service Target:    ${AUTH_SERVICE_URL}`);
    console.log(`📍 Visit Service Target:   ${VISIT_SERVICE_URL}`);
    console.log(`💼 Sales Service Target:   ${SALES_SERVICE_URL}`);
    console.log(`🗄️ Master Service Target:  ${MASTER_SERVICE_URL}`);
    console.log(`🩺 Gateway Health:         http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
};

if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.includes('gateway')) {
  startGateway();
}

export default app;
