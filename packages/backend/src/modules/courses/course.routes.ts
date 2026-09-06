// packages/backend/src/modules/courses/course.routes.ts

import express from 'express';
import { CourseController } from './course.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// ---------- Public Routes (Student) ----------
// Get all published courses
router.get('/published', CourseController.getAllPublished);

// Get popular courses
router.get('/popular', CourseController.getAllPublished);

// Get single course by ID
router.get('/:id', CourseController.getOne);

// ---------- Protected Routes (Student - Auth Required) ----------
// Enroll in a course
router.post('/:courseId/enroll', authenticate, CourseController.enroll);

// Get course progress
router.get('/:courseId/progress', authenticate, CourseController.getProgress);

// Mark lesson as complete
router.post('/:courseId/:lessonId/complete', authenticate, CourseController.completeLesson);

// ---------- Admin Only Routes ----------
// Get all courses (admin view)
router.get('/admin/all', authenticate, isAdmin, CourseController.getAllAdmin);

// Create a new course
router.post('/', authenticate, isAdmin, CourseController.create);

// Update a course
router.put('/:id', authenticate, isAdmin, CourseController.update);

// Delete a course
router.delete('/:id', authenticate, isAdmin, CourseController.delete);

// Toggle publish status
router.patch('/:id/publish', authenticate, isAdmin, CourseController.togglePublish);

// ---------- Debug Route (Admin Only - Remove in production) ----------
// Get course with full details for debugging
router.get('/debug/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { Course } = await import('./course.model.js');
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    console.log('🔍 Debug Course Data:');
    console.log('📚 Course:', course.title);
    console.log('📊 Lessons count:', course.lessons?.length || 0);
    console.log('📋 Lessons:', JSON.stringify(course.lessons, null, 2));

    res.status(200).json({
      success: true,
      data: {
        course,
        lessons: course.lessons,
        lessonCount: course.lessons?.length || 0,
        lessonDetails: course.lessons?.map((lesson: any) => ({
          _id: lesson._id,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          order: lesson.order,
          problemIds: lesson.problemIds || [],
          quizId: lesson.quizId || null,
          problemCount: lesson.problemIds?.length || 0,
        })),
      }
    });
  } catch (error: any) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Debug route failed',
    });
  }
});

export default router;