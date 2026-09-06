// packages/backend/src/modules/quizzes/quiz.service.ts

import { Types } from 'mongoose';
import { Quiz, QuizAttempt, IQuiz, IQuizAttempt } from './quiz.model.js';
import { Course } from '../courses/course.model.js';
import { User } from '../auth/auth.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export class QuizService {
  // ---------- Quiz CRUD ----------
  
  static async createQuiz(data: Partial<IQuiz>): Promise<IQuiz> {
    console.log('📝 Creating quiz with data:', JSON.stringify(data, null, 2));
    const quiz = await Quiz.create(data);
    console.log(`✅ Quiz created with ID: ${quiz._id}`);
    return quiz;
  }

  static async getQuizById(quizId: string): Promise<IQuiz | null> {
    return await Quiz.findById(quizId)
      .populate('courseId', 'title')
      .populate('createdBy', 'name');
  }

  static async getQuizzesByLesson(lessonId: string): Promise<IQuiz[]> {
    return await Quiz.find({ lessonId, isPublished: true })
      .populate('courseId', 'title')
      .sort({ order: 1, createdAt: 1 });
  }

  static async getQuizzesByCourse(courseId: string): Promise<IQuiz[]> {
    return await Quiz.find({ courseId, isPublished: true })
      .populate('courseId', 'title')
      .sort({ order: 1, createdAt: 1 });
  }

  static async updateQuiz(quizId: string, data: Partial<IQuiz>): Promise<IQuiz | null> {
    return await Quiz.findByIdAndUpdate(quizId, data, { new: true, runValidators: true });
  }

  static async deleteQuiz(quizId: string): Promise<boolean> {
    const result = await Quiz.findByIdAndDelete(quizId);
    return !!result;
  }

  static async togglePublish(quizId: string): Promise<IQuiz | null> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;
    quiz.isPublished = !quiz.isPublished;
    await quiz.save();
    return quiz;
  }

  // ---------- Quiz Attempts ----------
  
  static async startQuiz(quizId: string, userId: string): Promise<{ attempt: IQuizAttempt; remainingAttempts: number }> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const existingAttempts = await QuizAttempt.find({ quizId, userId });
    const completedAttempts = existingAttempts.filter(a => a.completedAt);
    
    if (quiz.maxAttempts && completedAttempts.length >= quiz.maxAttempts) {
      throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz`);
    }

    const incompleteAttempt = existingAttempts.find(a => !a.completedAt);
    if (incompleteAttempt) {
      return { 
        attempt: incompleteAttempt, 
        remainingAttempts: Math.max(0, (quiz.maxAttempts || 1) - completedAttempts.length) 
      };
    }

    const attemptNumber = completedAttempts.length + 1;
    const attempt = await QuizAttempt.create({
      quizId: new Types.ObjectId(quizId),
      userId: new Types.ObjectId(userId),
      startedAt: new Date(),
      attemptNumber,
    });

    return {
      attempt,
      remainingAttempts: Math.max(0, (quiz.maxAttempts || 1) - attemptNumber),
    };
  }

  static async submitQuiz(
    quizId: string,
    userId: string,
    answers: number[]
  ): Promise<{ 
    attempt: IQuizAttempt; 
    score: number; 
    passed: boolean; 
    feedback: any[];
    xpEarned: number;
    remainingAttempts: number;
  }> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const attempt = await QuizAttempt.findOne({ quizId, userId, completedAt: { $exists: false } });
    if (!attempt) {
      throw new Error('No active quiz attempt found');
    }

    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    const feedback = quiz.questions.map((question, index) => {
      const userAnswer = answers[index] ?? -1;
      const isCorrect = userAnswer === question.correctAnswer;
      const points = question.points || 1;
      
      totalPoints += points;
      if (isCorrect) {
        correctCount++;
        earnedPoints += points;
      }
      
      return {
        questionId: question._id,
        question: question.question,
        userAnswer: userAnswer === -1 ? 'Not answered' : question.options[userAnswer] || 'Invalid',
        correctAnswer: question.options[question.correctAnswer],
        isCorrect,
        points: isCorrect ? points : 0,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    attempt.answers = answers;
    attempt.score = score;
    attempt.passed = passed;
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor(
      (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
    );

    await attempt.save();

    let xpEarned = 0;
    if (passed) {
      const baseXp = Math.round((score / 100) * 20) + 10;
      
      const previousAttempts = await QuizAttempt.countDocuments({ 
        quizId, 
        userId, 
        completedAt: { $exists: true } 
      });
      const bonusXp = previousAttempts === 0 ? 10 : 0;
      
      xpEarned = baseXp + bonusXp;
      
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + xpEarned;
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        await user.save();
        await LeaderboardService.updateUserScore(userId, user.xp);
      }
    }

    const allAttempts = await QuizAttempt.find({ quizId, userId, completedAt: { $exists: true } });
    const remainingAttempts = Math.max(0, (quiz.maxAttempts || 1) - allAttempts.length);

    return {
      attempt,
      score,
      passed,
      feedback,
      xpEarned,
      remainingAttempts,
    };
  }

  static async getAttempts(userId: string, quizId?: string): Promise<any[]> {
    const query: any = { userId };
    if (quizId) query.quizId = quizId;

    return await QuizAttempt.find(query)
      .populate('quizId', 'title')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getUserAttemptStats(userId: string, quizId: string): Promise<{
    totalAttempts: number;
    completedAttempts: number;
    bestScore: number;
    passed: boolean;
    remainingAttempts: number;
  }> {
    const quiz = await Quiz.findById(quizId);
    const attempts = await QuizAttempt.find({ quizId, userId });
    const completedAttempts = attempts.filter(a => a.completedAt);
    
    const bestScore = completedAttempts.length > 0 
      ? Math.max(...completedAttempts.map(a => a.score))
      : 0;

    const passed = completedAttempts.some(a => a.passed);

    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      bestScore,
      passed,
      remainingAttempts: Math.max(0, (quiz?.maxAttempts || 1) - completedAttempts.length),
    };
  }

  static async getQuizStats(quizId: string): Promise<any> {
    const attempts = await QuizAttempt.find({ quizId });
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completedAt);
    const passedAttempts = completedAttempts.filter(a => a.passed);
    
    const avgScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((acc, a) => acc + a.score, 0) / completedAttempts.length
      : 0;

    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    completedAttempts.forEach(a => {
      if (a.score <= 20) distribution['0-20']++;
      else if (a.score <= 40) distribution['21-40']++;
      else if (a.score <= 60) distribution['41-60']++;
      else if (a.score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return {
      totalAttempts,
      completedAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      passRate: completedAttempts.length > 0 
        ? Math.round((passedAttempts.length / completedAttempts.length) * 100) 
        : 0,
      averageScore: Math.round(avgScore),
      distribution,
    };
  }
}