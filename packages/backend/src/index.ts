import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import rateLimit from 'express-rate-limit'; // ✅ Comment out or remove this import

import { env } from './config/env.zod.js';
import { connectDB } from './config/database.js';
import { redisClient } from './config/redis.js';
import { logger } from './shared/logger.js';

// Import Routes
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import sandboxRoutes from './modules/sandbox/sandbox.routes.js';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes.js';
import userRoutes from './modules/user/user.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import quizRoutes from './modules/quizzes/quiz.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import problemRoutes from './modules/problems/problem.routes.js';

// --- Init App ---
const app = express();

// 1. Security Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://nexlab-v2.vercel.app',
    process.env.CLIENT_URL || 'https://nexlab-v2.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// 2. Global Rate Limiter - ✅ REMOVED
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 3. Routes
//console.log('📌 Registering routes...');
app.use('/api/auth', authRoutes);
//console.log('✅ Auth routes registered at /api/auth');
app.use('/api/courses', courseRoutes);
//console.log('✅ Course routes registered at /api/courses');
app.use('/api/sandbox', sandboxRoutes);
//console.log('✅ Sandbox routes registered at /api/sandbox');
app.use('/api/leaderboard', leaderboardRoutes);
//console.log('✅ Leaderboard routes registered at /api/leaderboard');
app.use('/api/users', userRoutes);
//console.log('✅ User routes registered at /api/users');
app.use('/api/admin', adminRoutes);
//console.log('✅ Admin routes registered at /api/admin');
app.use('/api/quizzes', quizRoutes);
//console.log('✅ Quiz routes registered at /api/quizzes');
app.use('/api/reviews', reviewRoutes);
//console.log('✅ Review routes registered at /api/reviews');
app.use('/api/problems', problemRoutes);
//console.log('✅ Problem routes registered at /api/problems');

// Test auth endpoint (no auth required)
app.get('/api/test-auth', (req, res) => {
  //console.log('📥 Test auth endpoint called');
  //console.log('🍪 Cookies:', req.cookies);
  res.json({ 
    success: true, 
    message: 'API is working!',
    cookies: req.cookies,
    hasToken: !!req.cookies?.token
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', redis: redisClient.isReady });
});

// 4. Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  //console.error('❌ Global error:', err);
  logger.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// 5. Start Server
await connectDB();
app.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
});