// packages/frontend/src/components/CoursePreviewModal.tsx

import React, { useState } from 'react';
import {
  X, BookOpen, Users, Clock, Award,
  Play, CheckCircle, Star, Calendar,
  GraduationCap, ChevronRight, Lock
} from 'lucide-react';
import { Button } from './ui/Button';
import { CourseReviews } from './CourseReviews';

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  order: number;
  isFree: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isPublished: boolean;
  lessons: Lesson[];
  enrolledStudents: string[];
  rating?: number;
  totalReviews?: number;
  instructor?: { name: string; email: string };
  createdAt: string;
  coverImage?: string;
  thumbnail?: string;
}

interface CoursePreviewModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
  course,
  isOpen,
  onClose,
  onEnroll,
  isEnrolled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');

  if (!isOpen) return null;

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30',
      intermediate: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
      advanced: 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30',
    };
    return colors[level] || 'bg-[#0B2CB1] text-[#CBE9FD] border-[#0B2CB1]';
  };

  const getDurationText = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // ✅ Format price in INR
  const formatPrice = (amount: number): string => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total duration
  const totalDuration = course.lessons?.reduce((acc, lesson) => acc + (lesson.duration || 0), 0) || 0;
  const totalLessons = course.lessons?.length || 0;

  // Check if all lessons are free
  const allLessonsFree = course.lessons?.every(lesson => lesson.isFree) || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-[#1951FC]/10">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-[#0B2CB1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1951FC]/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#1951FC]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FFFFFF]">{course.title}</h2>
              <p className="text-xs text-[#5BB8FB]">Course Preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#0B2CB1] rounded-lg transition-colors text-[#CBE9FD] hover:text-[#FFFFFF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {/* Course Header with Cover Image */}
          {(course.coverImage || course.thumbnail) && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={course.coverImage || course.thumbnail}
                alt={course.title}
                className="w-full h-48 sm:h-56 md:h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Course Info */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getLevelBadge(course.level)}`}>
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
              <span className="text-xs text-[#5BB8FB]">•</span>
              <span className="text-xs text-[#5BB8FB]">{course.category}</span>
              <span className="text-xs text-[#5BB8FB]">•</span>
              <span className="text-xs text-[#5BB8FB]">{totalLessons} lessons</span>
              <span className="text-xs text-[#5BB8FB]">•</span>
              <span className="text-xs text-[#5BB8FB]">{getDurationText(totalDuration)}</span>
              {course.rating && course.rating > 0 && (
                <>
                  <span className="text-xs text-[#5BB8FB]">•</span>
                  <span className="text-xs text-[#3781FC] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#3781FC]" />
                    {course.rating.toFixed(1)} ({course.totalReviews || 0} reviews)
                  </span>
                </>
              )}
            </div>
            <p className="text-[#CBE9FD] text-sm leading-relaxed">{course.description}</p>
          </div>

          {/* Stats Row - Removed price from here since it's in footer */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 p-4 bg-[#000000] rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1951FC]">{course.enrolledStudents?.length || 0}</p>
              <p className="text-xs text-[#5BB8FB]">Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#5BB8FB]">{totalLessons}</p>
              <p className="text-xs text-[#5BB8FB]">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#3781FC]">{getDurationText(totalDuration)}</p>
              <p className="text-xs text-[#5BB8FB]">Total Duration</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#0B2CB1] mb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#1951FC] text-[#1951FC]'
                  : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'curriculum'
                  ? 'border-[#1951FC] text-[#1951FC]'
                  : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
              }`}
            >
              Curriculum ({totalLessons})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'reviews'
                  ? 'border-[#1951FC] text-[#1951FC]'
                  : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
              }`}
            >
              Reviews
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#FFFFFF] mb-2">About This Course</h4>
                  <p className="text-sm text-[#CBE9FD] leading-relaxed">{course.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#000000] rounded-lg p-4">
                    <h5 className="text-xs font-semibold text-[#FFFFFF] mb-3">What You'll Learn</h5>
                    <ul className="space-y-2">
                      {course.lessons?.slice(0, 4).map((lesson, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-[#CBE9FD]">
                          <CheckCircle className="w-3.5 h-3.5 text-[#1951FC] mt-0.5 flex-shrink-0" />
                          <span>{lesson.title}</span>
                        </li>
                      ))}
                    </ul>
                    {course.lessons?.length > 4 && (
                      <p className="text-xs text-[#5BB8FB] mt-2">+ {course.lessons.length - 4} more lessons</p>
                    )}
                  </div>
                  <div className="bg-[#000000] rounded-lg p-4">
                    <h5 className="text-xs font-semibold text-[#FFFFFF] mb-3">Course Details</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#5BB8FB]">Category</span>
                        <span className="text-[#FFFFFF]">{course.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5BB8FB]">Level</span>
                        <span className="text-[#FFFFFF] capitalize">{course.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5BB8FB]">Instructor</span>
                        <span className="text-[#FFFFFF]">{course.instructor?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5BB8FB]">Created</span>
                        <span className="text-[#FFFFFF]">{new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5BB8FB]">Lessons</span>
                        <span className="text-[#FFFFFF]">{totalLessons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5BB8FB]">Total Duration</span>
                        <span className="text-[#FFFFFF]">{getDurationText(totalDuration)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Free Preview Info */}
                {!allLessonsFree && (
                  <div className="bg-[#1951FC]/5 border border-[#1951FC]/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#1951FC]" />
                      <p className="text-sm text-[#CBE9FD]">
                        <span className="text-[#1951FC] font-medium">Free Preview:</span> Some lessons are available for free.
                        Enroll to access all content.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div className="space-y-2">
                {course.lessons?.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className="flex items-center justify-between p-3 bg-[#000000] rounded-lg hover:bg-[#0B2CB1] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#5BB8FB] min-w-[24px]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-sm text-[#FFFFFF]">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-xs text-[#5BB8FB]">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lesson.isFree && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#1951FC]/20 text-[#1951FC]">
                          Free
                        </span>
                      )}
                      <span className="text-xs text-[#5BB8FB]">{getDurationText(lesson.duration)}</span>
                      <Play className="w-4 h-4 text-[#5BB8FB]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <CourseReviews
                courseId={course._id}
                onReviewChange={() => {
                  // Refresh course data when review changes
                  window.location.reload();
                }}
              />
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#0B2CB1] bg-[#000000]">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1951FC]">{formatPrice(course.price)}</p>
              <p className="text-xs text-[#5BB8FB]">Full course access</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-[#0B2CB1]" />
            <div className="text-xs text-[#5BB8FB]">
              <p>✅ {totalLessons} lessons</p>
              <p>✅ {getDurationText(totalDuration)} of content</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
              Close
            </Button>
            {isEnrolled ? (
              <Button variant="primary" onClick={onEnroll} className="flex-1 sm:flex-none gap-2">
                <Play className="w-4 h-4" />
                Learn Now
              </Button>
            ) : (
              <Button variant="primary" onClick={onEnroll} className="flex-1 sm:flex-none gap-2">
                {course.price === 0 ? 'Enroll Free' : `Enroll ${formatPrice(course.price)}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePreviewModal;