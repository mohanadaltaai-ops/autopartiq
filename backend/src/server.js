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

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (_, res) => res.json({ ok: true, app: 'AutoPartIQ API' }));
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`AutoPartIQ API running on http://localhost:${port}`));
