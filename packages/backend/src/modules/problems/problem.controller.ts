// packages/backend/src/modules/problems/problem.controller.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ProblemService } from './problem.service.js';
import { Problem } from './problem.model.js';
import { User } from '../auth/auth.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';
import { ProblemSubmission } from './problem.model.js';

const createProblemSchema = z.object({
  title: z.string().min(3).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  description: z.string().min(10),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })),
  constraints: z.array(z.string()).default([]),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false),
  })),
  starterCode: z.object({
    javascript: z.string().default(''),
    python: z.string().default(''),
    java: z.string().default(''),
  }).default({
    javascript: '',
    python: '',
    java: '',
  }),
  solutionCode: z.string().default(''),
  hints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  timeLimit: z.number().default(2000),
  memoryLimit: z.number().default(256),
});

const updateProblemSchema = createProblemSchema.partial();

const submitProblemSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  isSubmission: z.boolean().optional().default(true),
  result: z.object({
    status: z.enum(['accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compile_error']),
    passedTests: z.number(),
    totalTests: z.number(),
    runtime: z.number(),
    memory: z.number(),
    errorMessage: z.string().optional(),
    testResults: z.array(z.any()).optional(),
  }).optional(),
});

export class ProblemController {
  static async create(req: Request, res: Response) {
    try {
      const data = createProblemSchema.parse(req.body);

      const problemData = {
        ...data,
        createdBy: new Types.ObjectId(req.userId),
        isPublished: false,
      };

      const problem = await ProblemService.createProblem(problemData);

      res.status(201).json({
        success: true,
        message: `Problem #${problem.problemNumber} created successfully`,
        data: problem,
      });
    } catch (error: any) {
      console.error('Create problem error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create problem',
      });
    }
  }

  static async getProblems(req: Request, res: Response) {
    try {
      const { difficulty, tag, search, limit, page } = req.query;
      const query: any = { isPublished: true };

      if (difficulty) query.difficulty = difficulty;
      if (tag) query.tags = tag;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const [problems, total] = await Promise.all([
        Problem.find(query)
          .sort({ problemNumber: 1 })
          .skip(skip)
          .limit(parseInt(limit as string) || 20)
          .lean(),
        Problem.countDocuments(query),
      ]);

      const formattedProblems = problems.map((p: any) => ({
        _id: p._id,
        problemNumber: p.problemNumber || 0,
        title: p.title || '',
        slug: p.slug || p._id.toString(),
        difficulty: p.difficulty || 'easy',
        tags: p.tags || [],
        createdAt: p.createdAt,
        isPublished: p.isPublished !== false,
        acceptanceRate: Math.floor(Math.random() * 40) + 40,
        totalSubmissions: Math.floor(Math.random() * 500) + 100,
        starterCode: p.starterCode || '',
      }));

      res.status(200).json({
        success: true,
        data: formattedProblems,
        pagination: {
          total,
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 20,
          totalPages: Math.ceil(total / (parseInt(limit as string) || 20)),
        },
      });
    } catch (error: any) {
      console.error('Get problems error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problems',
      });
    }
  }

  static async getAdminProblems(req: Request, res: Response) {
    try {
      const { search, difficulty, tag, limit = 50, page = 1 } = req.query;
      const query: any = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
      if (difficulty) query.difficulty = difficulty;
      if (tag) query.tags = tag;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const [problems, total] = await Promise.all([
        Problem.find(query)
          .sort({ problemNumber: 1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .populate('createdBy', 'name')
          .lean(),
        Problem.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: problems,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Get admin problems error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problems',
      });
    }
  }

  // ✅ NEW: Get problem by ID (Public - for students)
  static async getProblemByIdPublic(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      
      // Validate ObjectId
      if (!Types.ObjectId.isValid(problemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid problem ID',
        });
      }

      const problem = await Problem.findOne({ 
        _id: problemId, 
        isPublished: true 
      })
        .select('problemNumber title slug difficulty tags acceptanceRate totalSubmissions isPublished')
        .lean();

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found or not published',
        });
      }

      // Add random stats for display (in production, these would be real)
      const problemStats = problem as typeof problem & {
        acceptanceRate?: number;
        totalSubmissions?: number;
      };
      const problemWithStats = {
        ...problem,
        acceptanceRate: problemStats.acceptanceRate || Math.floor(Math.random() * 40) + 40,
        totalSubmissions: problemStats.totalSubmissions || Math.floor(Math.random() * 500) + 100,
      };

      res.status(200).json({
        success: true,
        data: problemWithStats,
      });
    } catch (error: any) {
      console.error('Get problem by ID public error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problem',
      });
    }
  }

  static async searchProblems(req: Request, res: Response) {
    try {
      const { query, limit = 10 } = req.query;
      
      if (!query || typeof query !== 'string' || query.trim().length < 1) {
        return res.status(200).json({
          success: true,
          data: [],
          count: 0,
        });
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      
      let problemNumberQuery: any = {};
      const numQuery = parseInt(query.trim());
      if (!isNaN(numQuery)) {
        problemNumberQuery = { problemNumber: numQuery };
      }
      
      const problems = await Problem.find({
        isPublished: true,
        $or: [
          { title: { $regex: searchRegex } },
          { slug: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } },
          ...(Object.keys(problemNumberQuery).length > 0 ? [problemNumberQuery] : []),
        ],
      })
        .select('problemNumber title slug difficulty tags isPublished')
        .sort({ problemNumber: 1 })
        .limit(parseInt(limit as string) || 10)
        .lean();

      res.status(200).json({
        success: true,
        data: problems,
        count: problems.length,
      });
    } catch (error: any) {
      console.error('Search problems error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search problems',
      });
    }
  }

  static async getProblem(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const problem = await ProblemService.getProblemBySlug(slug);

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      let userSubmissions = [];
      if (req.userId) {
        userSubmissions = await ProblemService.getUserSubmissions(req.userId, problem._id.toString());
      }

      const stats = await ProblemService.getProblemStats(problem._id.toString());
      const totalSubmissions = stats.totalSubmissions || 0;
      const acceptedSubmissions = stats.acceptedSubmissions || 0;
      const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

      const problemData = {
        ...problem,
        problemNumber: problem.problemNumber,
        testCases: problem.testCases?.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
        })) || [],
        acceptanceRate,
        totalSubmissions,
        starterCode: problem.starterCode || '',
      };

      res.status(200).json({
        success: true,
        data: {
          problem: problemData,
          userSubmissions,
          stats,
        },
      });
    } catch (error: any) {
      console.error('Get problem error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problem',
      });
    }
  }

  static async getProblemById(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const problem = await ProblemService.getProblemById(problemId);

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error: any) {
      console.error('Get problem by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problem',
      });
    }
  }

  static async getNextProblemNumber(req: Request, res: Response) {
    try {
      const nextNumber = await ProblemService.getNextProblemNumber();
      res.status(200).json({
        success: true,
        data: nextNumber,
      });
    } catch (error: any) {
      console.error('Get next problem number error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get next problem number',
      });
    }
  }

  static async submitSolution(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const userId = req.userId;
      const { code, isSubmission = true, result: clientResult } = req.body;

      console.log(`📝 ${isSubmission ? 'SUBMITTING' : 'RUNNING'} solution for ${slug}`);
      console.log(`👤 User ID: ${userId}`);

      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Code is required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const problem = await ProblemService.getProblemBySlug(slug);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      let result;

      if (clientResult && isSubmission) {
        console.log('📊 Using client-side execution result');

        const submission = await ProblemSubmission.create({
          problemId: new Types.ObjectId(problem._id),
          userId: new Types.ObjectId(userId),
          language: 'javascript',
          code,
          status: clientResult.status,
          passedTests: clientResult.passedTests,
          totalTests: clientResult.totalTests,
          runtime: clientResult.runtime,
          memory: clientResult.memory || 0,
          errorMessage: clientResult.errorMessage || undefined,
          submittedAt: new Date(),
        });

        if (clientResult.status === 'accepted') {
          const xpGain = ProblemService.getXpForDifficulty(problem.difficulty);
          const user = await User.findById(userId);
          if (user) {
            user.xp = (user.xp || 0) + xpGain;
            const newLevel = Math.floor(user.xp / 100) + 1;
            if (newLevel > user.level) {
              user.level = newLevel;
            }
            await user.save();
            await LeaderboardService.updateUserScore(userId, user.xp);
            console.log(`🏆 Awarded ${xpGain} XP to user ${userId}`);
          }
        }

        result = {
          ...clientResult,
          isSubmission: true,
          submission: {
            id: submission._id,
            status: submission.status,
            passedTests: submission.passedTests,
            totalTests: submission.totalTests,
            runtime: submission.runtime,
            memory: submission.memory,
            errorMessage: submission.errorMessage,
            createdAt: submission._id.getTimestamp(),
          },
        };
      } else if (clientResult && !isSubmission) {
        result = {
          ...clientResult,
          isSubmission: false,
          submission: null,
        };
      } else {
        console.log('💻 Using server-side execution (fallback)');
        result = await ProblemService.submitSolution(
          problem._id.toString(),
          userId,
          code,
          isSubmission
        );
      }

      console.log(`✅ ${isSubmission ? 'Submission' : 'Run'} result: ${result.status} (${result.passedTests}/${result.totalTests} tests passed)`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Submit solution error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit solution',
      });
    }
  }

  static async getSubmissions(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { problemId } = req.query;

      const submissions = await ProblemService.getUserSubmissions(
        userId,
        problemId as string
      );

      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error: any) {
      console.error('Get submissions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch submissions',
      });
    }
  }

  static async updateProblem(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const data = updateProblemSchema.parse(req.body);

      const problem = await ProblemService.updateProblem(problemId, data);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Problem updated successfully',
        data: problem,
      });
    } catch (error: any) {
      console.error('Update problem error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update problem',
      });
    }
  }

  static async deleteProblem(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const deleted = await ProblemService.deleteProblem(problemId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Problem deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete problem error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete problem',
      });
    }
  }

  static async togglePublish(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const problem = await ProblemService.getProblemById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      const updated = await ProblemService.updateProblem(problemId, {
        isPublished: !problem.isPublished,
      });

      res.status(200).json({
        success: true,
        message: `Problem ${updated?.isPublished ? 'published' : 'unpublished'} successfully`,
        data: updated,
      });
    } catch (error: any) {
      console.error('Toggle publish error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle publish',
      });
    }
  }
}

export default ProblemController;