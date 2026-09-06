// packages/backend/src/modules/quizzes/quiz.controller.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { QuizService } from './quiz.service.js';
import { Course } from '../courses/course.model.js';

// Validation schemas
const createQuizSchema = z.object({
  courseId: z.string(),
  lessonId: z.string(),
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  questions: z.array(z.object({
    question: z.string().min(3),
    options: z.array(z.string()).min(2),
    correctAnswer: z.number().min(0),
    explanation: z.string().optional(),
    points: z.number().min(1).default(1),
  })),
  passingScore: z.number().min(0).max(100).default(60),
  timeLimit: z.number().nullable().optional(),
  maxAttempts: z.number().min(1).default(1),
  order: z.number().default(0),
});

const submitQuizSchema = z.object({
  answers: z.array(z.number()),
});

export class QuizController {
  // ---------- Create Quiz ----------
  static async create(req: Request, res: Response) {
    try {
      const data = createQuizSchema.parse(req.body);

      // Check if course exists
      const course = await Course.findById(data.courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const quiz = await QuizService.createQuiz({
        ...data,
        courseId: new Types.ObjectId(data.courseId),
        lessonId: new Types.ObjectId(data.lessonId),
        timeLimit: data.timeLimit ?? undefined,
        createdBy: new Types.ObjectId(req.userId),
      });

      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz,
      });
    } catch (error: any) {
      console.error('Create quiz error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create quiz',
      });
    }
  }

  // ---------- Get Quiz ----------
  static async getQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const quiz = await QuizService.getQuizById(quizId);
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      // Don't expose correct answers to students
      const isAdmin = (req as Request & { userRole?: string }).userRole === 'admin';
      const data = isAdmin ? quiz : {
        ...quiz.toObject(),
        questions: quiz.questions.map((q: any) => ({
          _id: q._id,
          question: q.question,
          options: q.options,
        })),
      };

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Get quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz',
      });
    }
  }

  // ---------- Get Quiz for Attempt ----------
  static async getQuizForAttempt(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const userId = req.userId;

      const quiz = await QuizService.getQuizById(quizId);
      if (!quiz || !quiz.isPublished) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found or not published',
        });
      }

      // Get attempt stats
      const stats = await QuizService.getUserAttemptStats(userId, quizId);
      
      if (stats.passed) {
        return res.status(400).json({
          success: false,
          message: 'You have already passed this quiz',
          data: { stats },
        });
      }

      if (stats.remainingAttempts <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No attempts remaining for this quiz',
          data: { stats },
        });
      }

      // Start or get existing attempt
      const { attempt, remainingAttempts } = await QuizService.startQuiz(quizId, userId);

      // Return quiz without correct answers
      const quizData = {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions.map((q: any) => ({
          _id: q._id,
          question: q.question,
          options: q.options,
        })),
        timeLimit: quiz.timeLimit,
        totalQuestions: quiz.questions.length,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        attemptNumber: attempt.attemptNumber,
        remainingAttempts,
      };

      res.status(200).json({
        success: true,
        data: {
          quiz: quizData,
          attempt: {
            _id: attempt._id,
            startedAt: attempt.startedAt,
          },
          stats,
        },
      });
    } catch (error: any) {
      console.error('Get quiz for attempt error:', error);
      
      if (error.message.includes('Maximum attempts')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz',
      });
    }
  }

  // ---------- Submit Quiz ----------
  static async submitQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const userId = req.userId;
      const { answers } = submitQuizSchema.parse(req.body);

      const result = await QuizService.submitQuiz(quizId, userId, answers);

      res.status(200).json({
        success: true,
        message: 'Quiz submitted successfully',
        data: {
          score: result.score,
          passed: result.passed,
          feedback: result.feedback,
          xpEarned: result.xpEarned,
          remainingAttempts: result.remainingAttempts,
          attemptId: result.attempt._id,
        },
      });
    } catch (error: any) {
      console.error('Submit quiz error:', error);
      
      if (error.message === 'Quiz not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === 'No active quiz attempt found') {
        return res.status(400).json({
          success: false,
          message: 'No active quiz attempt. Please start the quiz first.',
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit quiz',
      });
    }
  }

  // ---------- Get Quiz Attempts ----------
  static async getAttempts(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { quizId } = req.query;

      const attempts = await QuizService.getAttempts(
        userId,
        quizId as string | undefined
      );

      res.status(200).json({
        success: true,
        data: attempts,
      });
    } catch (error: any) {
      console.error('Get attempts error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch attempts',
      });
    }
  }

  // ---------- Get Quiz Stats (Admin) ----------
  static async getQuizStats(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const stats = await QuizService.getQuizStats(quizId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get quiz stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz stats',
      });
    }
  }

  // ---------- Update Quiz ----------
  static async updateQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const data = createQuizSchema.partial().parse(req.body);

      const { courseId, lessonId, timeLimit, ...quizData } = data;
      const quiz = await QuizService.updateQuiz(quizId, {
        ...quizData,
        ...(timeLimit !== null ? { timeLimit } : {}),
        ...(courseId ? { courseId: new Types.ObjectId(courseId) } : {}),
        ...(lessonId ? { lessonId: new Types.ObjectId(lessonId) } : {}),
      });
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Quiz updated successfully',
        data: quiz,
      });
    } catch (error: any) {
      console.error('Update quiz error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update quiz',
      });
    }
  }

  // ---------- Delete Quiz ----------
  static async deleteQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const deleted = await QuizService.deleteQuiz(quizId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete quiz',
      });
    }
  }

  // ---------- Toggle Publish ----------
  static async togglePublish(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const quiz = await QuizService.togglePublish(quizId);
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      res.status(200).json({
        success: true,
        message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'} successfully`,
        data: quiz,
      });
    } catch (error: any) {
      console.error('Toggle publish error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle publish status',
      });
    }
  }

  // ---------- Get Quizzes by Lesson ---------- ✅ FIXED
  static async getQuizzesByLesson(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      
      // ✅ Validate that lessonId is a valid ObjectId
      if (!Types.ObjectId.isValid(lessonId)) {
        console.warn(`⚠️ Invalid lessonId format: ${lessonId}`);
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Invalid lesson ID format',
        });
      }

      const quizzes = await QuizService.getQuizzesByLesson(lessonId);

      res.status(200).json({
        success: true,
        data: quizzes || [],
      });
    } catch (error: any) {
      console.error('Get quizzes by lesson error:', error);
      // ✅ Return empty array instead of 500 error
      res.status(200).json({
        success: true,
        data: [],
        message: error.message || 'Failed to fetch quizzes',
      });
    }
  }

  // ---------- Get User Quiz Stats ----------
  static async getUserQuizStats(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const userId = req.userId;

      const stats = await QuizService.getUserAttemptStats(userId, quizId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get user quiz stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz stats',
      });
    }
  }
}

export default QuizController;