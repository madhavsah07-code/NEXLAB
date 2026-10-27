// packages/frontend/src/components/QuizManagement.tsx

import React, { useState, useEffect } from 'react';
import {
  Zap, Plus, Edit, Trash2, Eye, EyeOff,
  ChevronRight, X, Clock, Award, Users,
  BarChart3, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/Button';
import { QuizForm } from './QuizForm';
import { useConfirm } from '../hooks/useConfirm';
import { addToast } from './ui/Toast';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts: number;
  questions: any[];
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  courseId?: string | null;
}

interface QuizManagementProps {
  courseId: string;
  lessonId: string;
  onQuizChange?: (quizId?: string) => void;
}

export const QuizManagement: React.FC<QuizManagementProps> = ({
  courseId,
  lessonId,
  onQuizChange,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showStats, setShowStats] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Check if this is a new course
  const isNewCourse = courseId === 'new' || !courseId;

  useEffect(() => {
    fetchQuizzes();
  }, [lessonId]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/quizzes/lesson/${lessonId}`);
      setQuizzes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      addToast('Failed to load quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Update the lesson with the quizId in the course's quizIds array
  const updateLessonWithQuizId = async (quizId: string) => {
    // Skip if this is a new course
    if (isNewCourse) {
      console.log('📝 New course detected - skipping lesson update');
      return;
    }

    try {
      console.log(`🔄 Attempting to add quiz ${quizId} to lesson ${lessonId}`);

      // First, get the current course data
      const courseResponse = await api.get(`/courses/${courseId}`);
      const course = courseResponse.data.data;

      console.log('📚 Current course data:', {
        courseId: course._id,
        courseTitle: course.title,
        totalLessons: course.lessons?.length || 0
      });

      // Find the lesson and update its quizIds array
      let lessonFound = false;
      let updatedLessonRecord = null;

      const updatedLessons = course.lessons.map((lesson: any) => {
        // Match by _id (string comparison)
        const lessonIdStr = lesson._id?.toString();
        const targetLessonId = lessonId.toString();

        console.log(`📚 Checking lesson: ${lesson.title} (${lessonIdStr}) against target: ${targetLessonId}`);

        if (lessonIdStr === targetLessonId || lesson._id === lessonId) {
          lessonFound = true;
          // Initialize quizIds array if it doesn't exist
          const currentQuizIds = lesson.quizIds || [];
          // Add the new quizId if it's not already in the array
          if (!currentQuizIds.includes(quizId)) {
            console.log(`✅ Adding quiz ${quizId} to lesson "${lesson.title}"`);
            updatedLessonRecord = {
              ...lesson,
              quizIds: [...currentQuizIds, quizId],
            };
            return updatedLessonRecord;
          } else {
            console.log(`⚠️ Quiz ${quizId} already exists in lesson`);
            updatedLessonRecord = lesson;
            return lesson;
          }
        }
        return lesson;
      });

      if (!lessonFound) {
        console.error(`❌ Lesson with ID ${lessonId} not found in course`);
        console.log('📚 Available lessons:', course.lessons.map((l: any) => ({
          id: l._id?.toString(),
          title: l.title
        })));

        // Try to find by id property instead of _id
        const lessonByStringId = course.lessons.find((l: any) => l.id === lessonId);
        if (lessonByStringId) {
          console.log(`✅ Found lesson by string ID: ${lessonByStringId.title}`);
          lessonFound = true;
          const currentQuizIds = lessonByStringId.quizIds || [];
          if (!currentQuizIds.includes(quizId)) {
            const updatedLessonData = {
              ...lessonByStringId,
              quizIds: [...currentQuizIds, quizId],
            };
            // Update the lesson in the array
            const index = course.lessons.indexOf(lessonByStringId);
            updatedLessons[index] = updatedLessonData;
          }
        }
      }

      if (!lessonFound) {
        console.error(`❌ Lesson with ID ${lessonId} not found in course after all attempts`);
        addToast('Failed to link quiz to lesson - lesson not found', 'error');
        return;
      }

      // ✅ IMPORTANT: Make sure we include all course data
      const updateData = {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        thumbnail: course.thumbnail || '',
        coverImage: course.coverImage || '',
        isPublished: course.isPublished,
        lessons: updatedLessons,
      };

      console.log('📤 Updating course with new quizId:', JSON.stringify(updateData, null, 2));

      // Update the course
      const response = await api.put(`/courses/${courseId}`, updateData);
      console.log('✅ Course updated successfully:', response.data);

      // Verify the quiz was added
      const updatedCourse = response.data.data;
      const updatedLesson = updatedCourse.lessons.find((l: any) =>
        l._id?.toString() === lessonId.toString() || l._id === lessonId || l.id === lessonId
      );

      if (updatedLesson) {
        console.log(`✅ Verified: Lesson "${updatedLesson.title}" now has quizIds:`, updatedLesson.quizIds || []);
        if (updatedLesson.quizIds?.includes(quizId)) {
          console.log(`✅ Quiz ${quizId} successfully linked to lesson!`);
          addToast('Quiz linked to lesson successfully!', 'success');
        } else {
          console.warn(`⚠️ Quiz ${quizId} was not found in lesson's quizIds after update`);
          addToast('Quiz created but may not be linked to lesson. Please check.', 'warning');
        }
      }
    } catch (error: any) {
      console.error('❌ Error updating lesson with quizId:', error);
      console.error('❌ Error response:', error.response?.data);
      addToast(error.response?.data?.message || 'Failed to link quiz to lesson', 'error');
      throw error;
    }
  };

  const handleCreateQuiz = async (data: any) => {
    setSubmitting(true);
    try {
      // Remove isPublished from the data to let backend handle it
      const { isPublished, ...quizData } = data;

      console.log('📤 Creating quiz with data:', {
        ...quizData,
        courseId,
        lessonId,
      });

      // ✅ Create the quiz first
      const response = await api.post('/quizzes', {
        ...quizData,
        isPublished: true,
        courseId: isNewCourse ? null : courseId,
        lessonId,
      });

      console.log('✅ Quiz created:', response.data);
      const quizId = response.data.data._id;

      // ✅ CRITICAL: Update the lesson with the quizId
      if (!isNewCourse) {
        console.log(`📝 Attempting to add quiz ${quizId} to lesson ${lessonId}`);
        await updateLessonWithQuizId(quizId);
        console.log(`✅ Successfully added quiz ${quizId} to lesson`);
      } else {
        console.log('📝 New course - quiz will be linked when course is saved');
        addToast('Quiz created! Please save the course to link this quiz.', 'info');
      }

      addToast('Quiz created successfully!', 'success');
      setShowForm(false);
      await fetchQuizzes();

      if (onQuizChange) {
        onQuizChange(quizId);
      }
    } catch (error: any) {
      console.error('❌ Error creating quiz:', error);
      console.error('❌ Error response:', error.response?.data);
      addToast(error.response?.data?.message || 'Failed to create quiz', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuiz = async (data: any) => {
    if (!editingQuiz) return;
    setSubmitting(true);
    try {
      await api.put(`/quizzes/${editingQuiz._id}`, data);
      addToast('Quiz updated successfully!', 'success');
      setShowForm(false);
      setEditingQuiz(null);
      await fetchQuizzes();
      if (onQuizChange) {
        onQuizChange(editingQuiz._id);
      }
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      addToast(error.response?.data?.message || 'Failed to update quiz', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Quiz',
      message: `Are you sure you want to delete "${title}"? This will permanently remove all questions and attempts.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/quizzes/${quizId}`);
      addToast('Quiz deleted successfully!', 'success');
      await fetchQuizzes();
      if (onQuizChange) {
        onQuizChange(undefined);
      }
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      addToast(error.response?.data?.message || 'Failed to delete quiz', 'error');
    }
  };

  const handleTogglePublish = async (quizId: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/quizzes/${quizId}/publish`);
      const updatedQuiz = response.data.data;

      // Update the quiz in the local state immediately
      setQuizzes(prevQuizzes =>
        prevQuizzes.map(quiz =>
          quiz._id === quizId
            ? { ...quiz, isPublished: updatedQuiz.isPublished }
            : quiz
        )
      );

      const newStatus = updatedQuiz.isPublished;
      addToast(`Quiz ${newStatus ? 'published' : 'unpublished'} successfully`, 'success');

      if (onQuizChange) {
        onQuizChange(quizId);
      }
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      addToast(error.response?.data?.message || 'Failed to update quiz status', 'error');
    }
  };

  const handleViewStats = async (quizId: string) => {
    if (showStats === quizId) {
      setShowStats(null);
      setStats(null);
      return;
    }

    setLoadingStats(true);
    setShowStats(quizId);
    try {
      const response = await api.get(`/quizzes/${quizId}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      addToast('Failed to load quiz statistics', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAddQuizClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingQuiz(null);
    setShowForm(true);
  };

  const handleCloseForm = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowForm(false);
    setEditingQuiz(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialogComponent />
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#1951FC]" />
            <h4 className="text-sm font-semibold text-[#FFFFFF]">Quizzes</h4>
            <span className="text-xs text-[#5BB8FB]">({quizzes.length})</span>
            {isNewCourse && (
              <span className="text-xs text-[#3781FC] bg-[#3781FC]/10 px-2 py-0.5 rounded-full">
                New Course
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddQuizClick}
            className="gap-1"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add Quiz
          </Button>
        </div>

        {/* Quiz List */}
        {quizzes.length === 0 ? (
          <div className="text-center py-6 text-[#5BB8FB] bg-[#000000] rounded-lg border border-[#0B2CB1] border-dashed">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No quizzes for this lesson yet</p>
            <p className="text-xs">Create a quiz to test your students' knowledge</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quizzes.map((quiz) => {
              const isLinked = !isNewCourse && quiz.courseId !== null;

              return (
                <div
                  key={quiz._id}
                  className="bg-[#000000] border border-[#0B2CB1] rounded-lg p-3 hover:border-[#1951FC]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#FFFFFF] truncate">
                          {quiz.title}
                        </span>
                        {quiz.isPublished ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1951FC]/20 text-[#1951FC] border border-[#1951FC]/30 flex items-center gap-1 flex-shrink-0">
                            <Eye className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#3781FC]/20 text-[#3781FC] border border-[#3781FC]/30 flex items-center gap-1 flex-shrink-0">
                            <EyeOff className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                        {!isLinked && !isNewCourse && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#5BB8FB]/20 text-[#5BB8FB] border border-[#5BB8FB]/30 flex-shrink-0">
                            Not Linked
                          </span>
                        )}
                        {isNewCourse && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#5BB8FB]/20 text-[#5BB8FB] border border-[#5BB8FB]/30 flex-shrink-0">
                            Pending Save
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5BB8FB] mt-0.5">
                        <span>{quiz.questions.length} questions</span>
                        <span>•</span>
                        <span>Pass: {quiz.passingScore}%</span>
                        {quiz.timeLimit && (
                          <>
                            <span>•</span>
                            <span>{quiz.timeLimit} min</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{quiz.maxAttempts} attempt{quiz.maxAttempts > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTogglePublish(quiz._id, quiz.isPublished);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          quiz.isPublished
                            ? 'text-[#1951FC] hover:bg-[#1951FC]/10'
                            : 'text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
                        }`}
                        title={quiz.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {quiz.isPublished ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewStats(quiz._id);
                        }}
                        className="p-1.5 text-[#5BB8FB] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors"
                        title="View Statistics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingQuiz(quiz);
                          setShowForm(true);
                        }}
                        className="p-1.5 text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#0B2CB1] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteQuiz(quiz._id, quiz.title);
                        }}
                        className="p-1.5 text-[#5BB8FB] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Panel */}
                  {showStats === quiz._id && (
                    <div className="mt-3 pt-3 border-t border-[#0B2CB1]">
                      {loadingStats ? (
                        <div className="flex items-center justify-center py-4">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : stats ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#FFFFFF]">{stats.totalAttempts || 0}</p>
                            <p className="text-xs text-[#5BB8FB]">Total Attempts</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#1951FC]">{stats.passRate || 0}%</p>
                            <p className="text-xs text-[#5BB8FB]">Pass Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#5BB8FB]">{stats.averageScore || 0}%</p>
                            <p className="text-xs text-[#5BB8FB]">Avg Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#3781FC]">{stats.passedAttempts || 0}</p>
                            <p className="text-xs text-[#5BB8FB]">Passed</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#5BB8FB] text-center">No attempts yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quiz Form Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false);
                setEditingQuiz(null);
              }
            }}
          >
            <div
              className="bg-[#03195B] border border-[#0B2CB1] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#FFFFFF]">
                  {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-[#0B2CB1] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#CBE9FD]" />
                </button>
              </div>

              <QuizForm
                initialData={editingQuiz || undefined}
                onSubmit={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
                onCancel={handleCloseForm}
                loading={submitting}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizManagement;