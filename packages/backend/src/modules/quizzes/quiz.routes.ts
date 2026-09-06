// packages/backend/src/modules/quizzes/quiz.routes.ts

import express from 'express';
import { QuizController } from './quiz.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// ---------- Public Routes (Students) ----------
// ✅ MUST COME BEFORE parameter routes
// Get quiz by ID (Public - for students)
router.get('/public/:quizId', authenticate, QuizController.getQuizPublic);

// Get quiz stats (Public - for students)
router.get('/public/:quizId/stats', authenticate, QuizController.getQuizStatsPublic);

// Get quizzes by lesson (Student)
router.get('/lesson/:lessonId', authenticate, QuizController.getQuizzesByLesson);

// ---------- Student Routes ----------
// Get quiz for attempt (starts attempt)
router.get('/attempt/:quizId', authenticate, QuizController.getQuizForAttempt);

// Submit quiz
router.post('/:quizId/submit', authenticate, QuizController.submitQuiz);

// Get user's attempts
router.get('/attempts', authenticate, QuizController.getAttempts);

// Get user quiz stats
router.get('/:quizId/user-stats', authenticate, QuizController.getUserQuizStats);

// ---------- Admin Routes ----------
// Create quiz
router.post('/', authenticate, isAdmin, QuizController.create);

// Get quiz (admin - full details) - ✅ MUST COME AFTER PUBLIC ROUTES
router.get('/:quizId', authenticate, isAdmin, QuizController.getQuiz);

// Update quiz
router.put('/:quizId', authenticate, isAdmin, QuizController.updateQuiz);

// Delete quiz
router.delete('/:quizId', authenticate, isAdmin, QuizController.deleteQuiz);

// Toggle publish
router.patch('/:quizId/publish', authenticate, isAdmin, QuizController.togglePublish);

// Get quiz stats (admin - full stats)
router.get('/:quizId/stats', authenticate, isAdmin, QuizController.getQuizStats);

export default router;