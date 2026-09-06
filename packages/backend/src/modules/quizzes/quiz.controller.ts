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
  isPublished: z.boolean().optional().default(false),
});

const submitQuizSchema = z.object({
  answers: z.array(z.number()),
});

export class QuizController {
  // ---------- Create Quiz ----------
  static async create(req: Request, res: Response) {
    try {
      const data = createQuizSchema.parse(req.body);

      console.log('📝 Creating quiz with data:', JSON.stringify(data, null, 2));

      const course = await Course.findById(data.courseId);
      if (!course) {
        console.error(`❌ Course not found: ${data.courseId}`);
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const lessonExists = course.lessons?.some(
        (lesson: any) => lesson._id?.toString() === data.lessonId
      );
      
      if (!lessonExists) {
        console.error(`❌ Lesson not found in course: ${data.lessonId}`);
        return res.status(404).json({
          success: false,
          message: 'Lesson not found in this course',
        });
      }

      if (!req.userId) {
        console.error('❌ User ID not found in request');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const quizData = {
        ...data,
        courseId: new Types.ObjectId(data.courseId),
        lessonId: data.lessonId,
        timeLimit: data.timeLimit ?? undefined,
        createdBy: new Types.ObjectId(req.userId),
        isPublished: data.isPublished || false,
      };

      console.log('📦 Quiz data to save:', JSON.stringify(quizData, null, 2));

      const quiz = await QuizService.createQuiz(quizData);

      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz,
      });
    } catch (error: any) {
      console.error('❌ Create quiz error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
          errors: error.errors,
        });
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({
          success: false,
          message: messages.join(', '),
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create quiz',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  // ---------- Get Quiz (Public) ----------
  static async getQuizPublic(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      
      console.log(`📚 Fetching public quiz: ${quizId}`);
      
      if (!Types.ObjectId.isValid(quizId)) {
        console.log(`❌ Invalid quiz ID: ${quizId}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid quiz ID',
        });
      }

      const quiz = await QuizService.getQuizById(quizId);
      
      if (!quiz) {
        console.log(`❌ Quiz not found: ${quizId}`);
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      console.log(`✅ Quiz found: ${quiz.title}, isPublished: ${quiz.isPublished}`);

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
        isPublished: quiz.isPublished,
      };

      res.status(200).json({
        success: true,
        data: quizData,
      });
    } catch (error: any) {
      console.error('Get quiz public error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz',
      });
    }
  }

  // ---------- Get Quiz Stats (Public) ----------
  static async getQuizStatsPublic(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const userId = req.userId;

      console.log(`📚 Fetching public quiz stats for: ${quizId}, user: ${userId}`);

      if (!Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quiz ID',
        });
      }

      const quiz = await QuizService.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      const stats = await QuizService.getUserAttemptStats(userId, quizId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get quiz stats public error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz stats',
      });
    }
  }

  // ---------- Get Quiz for Attempt ---------- ✅ FIXED - Removed isPublished check
  static async getQuizForAttempt(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const userId = req.userId;

      console.log(`📚 Getting quiz for attempt: ${quizId}, user: ${userId}`);

      const quiz = await QuizService.getQuizById(quizId);
      if (!quiz) {
        console.log(`❌ Quiz not found: ${quizId}`);
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      console.log(`✅ Quiz found: ${quiz.title}, isPublished: ${quiz.isPublished}`);

      // ✅ isPublished check removed - quiz is now published

      const stats = await QuizService.getUserAttemptStats(userId, quizId);
      console.log(`📊 User stats:`, stats);
      
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

      const { attempt, remainingAttempts } = await QuizService.startQuiz(quizId, userId);

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

  // ---------- Get Quiz (Admin) ----------
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

      res.status(200).json({
        success: true,
        data: quiz,
      });
    } catch (error: any) {
      console.error('Get quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quiz',
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
        ...(timeLimit !== undefined && timeLimit !== null ? { timeLimit } : {}),
        ...(courseId ? { courseId: new Types.ObjectId(courseId) } : {}),
        ...(lessonId ? { lessonId: lessonId } : {}),
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

  // ---------- Get Quizzes by Lesson ----------
  static async getQuizzesByLesson(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const quizzes = await QuizService.getQuizzesByLesson(lessonId);

      res.status(200).json({
        success: true,
        data: quizzes || [],
      });
    } catch (error: any) {
      console.error('Get quizzes by lesson error:', error);
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