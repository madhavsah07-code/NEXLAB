// packages/backend/src/modules/courses/course.controller.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { CourseService } from './course.service.js';
import { User } from '../auth/auth.model.js';
import { ImageKitService } from '../../services/imagekit.service.js';
import { Course } from './course.model.js';
import { redisClient } from '../../config/redis.js';

// Import LeaderboardService dynamically to avoid circular dependencies
const getLeaderboardService = async () => {
  try {
    const { LeaderboardService } = await import('../leaderboard/leaderboard.service.js');
    return LeaderboardService;
  } catch (error) {
    console.warn('⚠️ Leaderboard service not available:', error);
    return null;
  }
};

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  category: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0).default(0),
  thumbnail: z.string().optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
  lessons: z.array(z.object({
    _id: z.string().optional(),
    title: z.string().min(1, 'Lesson title is required'),
    description: z.string().optional(),
    videoUrl: z.string().url('Must be a valid URL'),
    duration: z.number().optional(),
    order: z.number(),
    isFree: z.boolean().default(false),
    problemIds: z.array(z.string()).default([]),
    quizId: z.string().nullable().optional(), // ✅ Allow null
  })),
});

const updateCourseSchema = createCourseSchema.partial();

export class CourseController {
  // ---------- Create Course ----------
  static async create(req: Request, res: Response) {
    try {
      const data = createCourseSchema.parse(req.body);

      // If thumbnail is a base64 string, upload to ImageKit
      let thumbnailUrl = data.thumbnail;
      if (data.thumbnail && data.thumbnail.startsWith('data:image')) {
        const base64Data = data.thumbnail.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `course-${Date.now()}.jpg`;
        thumbnailUrl = await ImageKitService.uploadImage(buffer, fileName, 'courses');
      }

      // Handle cover image
      let coverImageUrl = data.coverImage;
      if (data.coverImage && data.coverImage.startsWith('data:image')) {
        const base64Data = data.coverImage.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `course-cover-${Date.now()}.jpg`;
        coverImageUrl = await ImageKitService.uploadImage(buffer, fileName, 'courses');
      }

      const course = await CourseService.createCourse({
        ...data,
        lessons: data.lessons.map((lesson) => ({
          ...lesson,
          _id: lesson._id ? new Types.ObjectId(lesson._id) : undefined,
        })),
        thumbnail: thumbnailUrl,
        coverImage: coverImageUrl,
        instructor: new Types.ObjectId(req.userId),
      });

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully',
      });
    } catch (error: any) {
      console.error('Create course error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course',
      });
    }
  }

  // ---------- Get All Courses (Admin) ----------
  static async getAllAdmin(req: Request, res: Response) {
    try {
      const courses = await CourseService.getAllCourses();
      res.status(200).json({
        success: true,
        data: courses,
        count: courses.length,
      });
    } catch (error: any) {
      console.error('Get admin courses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch courses',
      });
    }
  }

  // ---------- Get All Published Courses (Student) ----------
  static async getAllPublished(req: Request, res: Response) {
    try {
      const { category, level, search } = req.query;

      const courses = await CourseService.getCourses({
        category: category as string,
        level: level as string,
        isPublished: true,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: courses || [],
        count: courses?.length || 0,
      });
    } catch (error: any) {
      console.error('Get published courses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch courses',
      });
    }
  }

  // ---------- Get Single Course ----------
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const course = await CourseService.getCourseById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error: any) {
      console.error('Get course error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch course',
      });
    }
  }

  // ---------- Update Course ---------- ✅ FIXED
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateCourseSchema.parse(req.body);

      console.log(`📝 Updating course ${id}`);
      console.log('📦 Received data:', JSON.stringify(data, null, 2));

      // Find the course first to verify it exists
      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      // If thumbnail is a base64 string, upload to ImageKit
      let thumbnailUrl = data.thumbnail;
      if (data.thumbnail && data.thumbnail.startsWith('data:image')) {
        const base64Data = data.thumbnail.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `course-${Date.now()}.jpg`;
        thumbnailUrl = await ImageKitService.uploadImage(buffer, fileName, 'courses');
      }

      // Handle cover image
      let coverImageUrl = data.coverImage;
      if (data.coverImage && data.coverImage.startsWith('data:image')) {
        const base64Data = data.coverImage.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `course-cover-${Date.now()}.jpg`;
        coverImageUrl = await ImageKitService.uploadImage(buffer, fileName, 'courses');
      }

      // Prepare update data - preserve existing values if not provided
      const updateData: any = {
        title: data.title || existingCourse.title,
        description: data.description || existingCourse.description,
        category: data.category || existingCourse.category,
        level: data.level || existingCourse.level,
        price: data.price !== undefined ? data.price : existingCourse.price,
        thumbnail: thumbnailUrl || data.thumbnail || existingCourse.thumbnail,
        coverImage: coverImageUrl || data.coverImage || existingCourse.coverImage,
        isPublished: data.isPublished !== undefined ? data.isPublished : existingCourse.isPublished,
      };

      // Handle lessons - if provided, use them; otherwise keep existing
      if (data.lessons) {
        updateData.lessons = data.lessons.map((lesson: any) => ({
          // Preserve existing _id if present
          _id: lesson._id || new Types.ObjectId(),
          title: lesson.title,
          description: lesson.description || '',
          videoUrl: lesson.videoUrl,
          duration: lesson.duration || 0,
          order: lesson.order,
          isFree: lesson.isFree || false,
          problemIds: lesson.problemIds || [],
          quizId: lesson.quizId || null,
        }));
        console.log(`📚 Updating ${updateData.lessons.length} lessons`);
      } else {
        // Keep existing lessons
        updateData.lessons = existingCourse.lessons;
      }

      console.log('📦 Final update data:', JSON.stringify(updateData, null, 2));

      // ✅ Use findByIdAndUpdate with proper options
      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        { $set: updateData },
        { 
          new: true,
          runValidators: true,
        }
      ).populate('instructor', 'name email');

      if (!updatedCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found after update',
        });
      }

      console.log(`✅ Course updated successfully: ${updatedCourse.title}`);
      console.log(`📚 Lessons in updated course: ${updatedCourse.lessons?.length || 0}`);

      // Clear cache
      try {
        await redisClient.del('courses:list');
      } catch (cacheError) {
        console.warn('⚠️ Cache clear failed:', cacheError);
      }

      res.status(200).json({
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully',
      });
    } catch (error: any) {
      console.error('❌ Update course error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course',
      });
    }
  }

  // ---------- Delete Course ----------
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await CourseService.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course',
      });
    }
  }

  // ---------- Toggle Publish ----------
  static async togglePublish(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const course = await CourseService.togglePublish(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        data: course,
        message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
      });
    } catch (error: any) {
      console.error('Toggle publish error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle publish status',
      });
    }
  }

  // ---------- Get Popular Courses ----------
  static async getPopular(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const courses = await CourseService.getPopularCourses(limit);

      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error: any) {
      console.error('Get popular courses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch popular courses',
      });
    }
  }

  // ---------- Enroll Student in Course ----------
  static async enroll(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.userId;

      const course = await CourseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      if (!course.isPublished) {
        return res.status(400).json({
          success: false,
          message: 'This course is not yet available',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const alreadyEnrolled = user.enrolledCourses?.some(id => id.toString() === courseId);
      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this course',
        });
      }

      if (!user.enrolledCourses) {
        user.enrolledCourses = [];
      }
      user.enrolledCourses.push(new Types.ObjectId(courseId));
      await user.save();

      const success = await CourseService.enrollStudent(courseId, userId);
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to enroll in course',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Successfully enrolled in course',
      });
    } catch (error: any) {
      console.error('Enrollment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to enroll in course',
      });
    }
  }

  // ---------- Get Student's Course Progress ----------
  static async getProgress(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const course = await CourseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const progressKey = `progress:${courseId}`;
      const completedLessons = user.progress?.get(progressKey) || [];
      const totalLessons = course.lessons?.length || 0;

      res.status(200).json({
        success: true,
        data: {
          completedLessons: completedLessons.length,
          totalLessons: totalLessons,
          percentage: totalLessons > 0
            ? Math.round((completedLessons.length / totalLessons) * 100)
            : 0,
          completedLessonIds: completedLessons,
        },
      });
    } catch (error: any) {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch progress',
      });
    }
  }

  // ---------- Mark Lesson as Complete ----------
  static async completeLesson(req: Request, res: Response) {
    try {
      const { courseId, lessonId } = req.params;
      const userId = req.userId;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Find course
      const course = await CourseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      // Check if lesson exists in course
      const lessonExists = course.lessons?.some(l => l._id?.toString() === lessonId);
      if (!lessonExists) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found in this course',
        });
      }

      // Initialize progress if needed
      if (!user.progress) {
        user.progress = new Map();
      }

      const progressKey = `progress:${courseId}`;
      if (!user.progress.has(progressKey)) {
        user.progress.set(progressKey, []);
      }

      const completedLessons = user.progress.get(progressKey) || [];

      // Only process if lesson not already completed
      if (!completedLessons.includes(lessonId)) {
        // Add lesson to completed
        completedLessons.push(lessonId);
        user.progress.set(progressKey, completedLessons);

        // Award XP
        const xpGain = 10;
        user.xp = (user.xp || 0) + xpGain;

        // Update level
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }

        // Save user
        await user.save();

        // Update Leaderboard
        try {
          const LeaderboardService = await getLeaderboardService();
          if (LeaderboardService) {
            await LeaderboardService.updateUserScore(userId, user.xp);
            console.log(`🏆 Leaderboard updated for user ${userId}`);
          }
        } catch (leaderboardError: any) {
          console.warn('⚠️ Leaderboard update failed (Redis may not be available):', leaderboardError.message);
        }

        console.log(`✅ User ${userId} completed lesson ${lessonId} in course ${courseId}`);
        console.log(`📊 XP: ${user.xp}, Level: ${user.level}`);

        // Check for badges
        try {
          await this.checkBadges(user);
        } catch (badgeError: any) {
          console.warn('⚠️ Badge check failed:', badgeError.message);
        }
      }

      // Get updated progress
      const updatedCompletedLessons = user.progress.get(progressKey) || [];
      const totalLessons = course.lessons?.length || 0;
      const percentage = totalLessons > 0
        ? Math.round((updatedCompletedLessons.length / totalLessons) * 100)
        : 0;

      res.status(200).json({
        success: true,
        message: 'Lesson marked as complete',
        data: {
          xpEarned: 10,
          totalXp: user.xp,
          level: user.level,
          completedLessons: updatedCompletedLessons.length,
          totalLessons: totalLessons,
          percentage: percentage,
          leaderboardUpdated: true,
        },
      });
    } catch (error: any) {
      console.error('❌ Complete lesson error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete lesson',
      });
    }
  }

  // ---------- Helper: Check and Award Badges ----------
  private static async checkBadges(user: any): Promise<void> {
    try {
      const badgesToAward: string[] = [];

      // Badge: First Steps - Complete first lesson
      if (user.xp >= 10 && !user.badges?.includes('First Steps')) {
        badgesToAward.push('First Steps');
      }

      // Badge: Dedicated Learner - Complete 5 lessons
      let totalLessons = 0;
      if (user.progress) {
        for (const [, lessons] of user.progress) {
          totalLessons += lessons.length;
        }
      }
      if (totalLessons >= 5 && !user.badges?.includes('Dedicated Learner')) {
        badgesToAward.push('Dedicated Learner');
      }

      // Badge: Master Student - Complete 10 lessons
      if (totalLessons >= 10 && !user.badges?.includes('Master Student')) {
        badgesToAward.push('Master Student');
      }

      // Badge: Level Up - Reach level 5
      if (user.level >= 5 && !user.badges?.includes('Level Up!')) {
        badgesToAward.push('Level Up!');
      }

      // Award badges if any
      if (badgesToAward.length > 0) {
        if (!user.badges) user.badges = [];
        user.badges.push(...badgesToAward);
        await user.save();
        console.log(`🎖️ Badges awarded to ${user._id}: ${badgesToAward.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error checking badges:', error);
    }
  }
}

export default CourseController;