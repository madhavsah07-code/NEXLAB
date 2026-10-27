import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/env.zod.js';
import { connectDB } from './config/database.js';
import { redisClient } from './config/redis.js';
import { logger } from './shared/logger.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import sandboxRoutes from './modules/sandbox/sandbox.routes.js';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes.js';
import userRoutes from './modules/user/user.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import quizRoutes from './modules/quizzes/quiz.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import problemRoutes from './modules/problems/problem.routes.js';

// Initialize Express
const app = express();

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://nexlab-v2.vercel.app',
  process.env.CLIENT_URL,
].filter((origin): origin is string => Boolean(origin));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.error(`CORS blocked origin: ${origin}`);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  })
);

// Parse JSON and cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/problems', problemRoutes);

// Test endpoint
app.get('/api/test-auth', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    hasToken: Boolean(req.cookies?.token),
  });
});

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    redis: redisClient.isReady,
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(err.stack || err.message || String(err));

    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  }
);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`🚀 Backend running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error.stack || error.message
        : String(error)
    );

    process.exitCode = 1;
  }
};

void startServer();