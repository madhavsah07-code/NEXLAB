// packages/backend/src/modules/courses/course.service.ts

import { Types } from 'mongoose';
import { Course, ICourse } from './course.model.js';
import { redisClient } from '../../config/redis.js';

export class CourseService {
  private static CACHE_KEY = 'courses:list';

  // Create a new course
  static async createCourse(data: Partial<ICourse>): Promise<ICourse> {
    const course = await Course.create(data);
    await this.clearCache();
    return course;
  }

  // Get all courses (with optional filters)
  static async getCourses(filters: {
    category?: string;
    level?: string;
    isPublished?: boolean;
    search?: string;
  }): Promise<ICourse[]> {
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;
    if (filters.isPublished !== undefined) {
      query.isPublished = filters.isPublished;
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return await Course.find(query)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
  }

  // Get all courses for admin (no filters)
  static async getAllCourses(): Promise<ICourse[]> {
    return await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
  }

  // Get single course by ID or slug
  static async getCourseById(id: string): Promise<ICourse | null> {
    return await Course.findById(id)
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email');
  }

  static async getCourseBySlug(slug: string): Promise<ICourse | null> {
    return await Course.findOne({ slug })
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email');
  }

  // ✅ FIXED: Update course with proper handling of nested arrays
  static async updateCourse(id: string, data: Partial<ICourse>): Promise<ICourse | null> {
    try {
      // Find the course first
      const course = await Course.findById(id);
      if (!course) {
        console.error(`❌ Course with ID ${id} not found`);
        return null;
      }

      console.log(`📝 Updating course: ${course.title} (${id})`);
      console.log('📦 Update data:', JSON.stringify(data, null, 2));

      // Handle lessons update properly
      if (data.lessons) {
        console.log(`📚 Updating ${data.lessons.length} lessons`);
        
        // Map lessons to ensure all fields are present
        const updatedLessons = data.lessons.map((lesson, index) => ({
          _id: lesson._id || new Types.ObjectId(),
          title: lesson.title || `Lesson ${index + 1}`,
          description: lesson.description || '',
          videoUrl: lesson.videoUrl || '',
          duration: lesson.duration || 0,
          order: lesson.order || index + 1,
          isFree: lesson.isFree || false,
          problemIds: lesson.problemIds || [],
        }));

        // Use findOneAndUpdate with proper options
        const updatedCourse = await Course.findByIdAndUpdate(
          id,
          { 
            $set: {
              title: data.title,
              description: data.description,
              category: data.category,
              level: data.level,
              price: data.price,
              thumbnail: data.thumbnail,
              coverImage: data.coverImage,
              isPublished: data.isPublished,
              lessons: updatedLessons,
            }
          },
          { 
            new: true,  // Return the updated document
            runValidators: true,  // Run schema validators
          }
        ).populate('instructor', 'name email');

        if (updatedCourse) {
          console.log(`✅ Course updated successfully: ${updatedCourse.title}`);
          console.log(`📚 Lessons count: ${updatedCourse.lessons?.length || 0}`);
        }

        await this.clearCache();
        return updatedCourse;
      }

      // If no lessons update, just update other fields
      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        { $set: data },
        { 
          new: true,
          runValidators: true,
        }
      ).populate('instructor', 'name email');

      if (updatedCourse) {
        console.log(`✅ Course updated successfully: ${updatedCourse.title}`);
      }

      await this.clearCache();
      return updatedCourse;
    } catch (error) {
      console.error('❌ Error updating course:', error);
      throw error;
    }
  }

  // Delete course
  static async deleteCourse(id: string): Promise<boolean> {
    const result = await Course.findByIdAndDelete(id);
    if (result) await this.clearCache();
    return !!result;
  }

  // Toggle publish status
  static async togglePublish(id: string): Promise<ICourse | null> {
    const course = await Course.findById(id);
    if (!course) return null;
    
    course.isPublished = !course.isPublished;
    await course.save();
    await this.clearCache();
    return course;
  }

  // Enroll a student
  static async enrollStudent(courseId: string, userId: string): Promise<boolean> {
    try {
      const course = await Course.findById(courseId);
      if (!course) return false;
      
      const userIdObj = new Types.ObjectId(userId);
      
      if (course.enrolledStudents.some(id => id.toString() === userId)) {
        return false;
      }
      
      course.enrolledStudents.push(userIdObj);
      await course.save();
      
      return true;
    } catch (error) {
      console.error('Error enrolling student:', error);
      return false;
    }
  }

  // Get popular courses (by enrollment count)
  static async getPopularCourses(limit: number = 5): Promise<ICourse[]> {
    return await Course.find({ isPublished: true })
      .sort({ enrolledStudents: -1 })
      .limit(limit)
      .populate('instructor', 'name');
  }

  // Clear cache
  private static async clearCache() {
    try {
      await redisClient.del(this.CACHE_KEY);
    } catch (error) {
      // Redis may not be available - ignore
    }
  }
}