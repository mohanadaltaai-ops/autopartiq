import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import legalRoutes from './routes/legalRoutes.js';

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/', (_, res) => res.json({ ok: true, app: 'AutoPartIQ API', health: '/health' }));
app.get('/api', (_, res) => res.json({ ok: true, app: 'AutoPartIQ API', routes: ['/api/auth/login', '/api/requests', '/api/orders'] }));
app.get('/health', (_, res) => res.json({ ok: true, app: 'AutoPartIQ API' }));
app.use('/legal', legalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payouts', payoutRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`AutoPartIQ API running on http://localhost:${port}`));
