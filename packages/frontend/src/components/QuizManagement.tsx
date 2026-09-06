// packages/frontend/src/components/QuizManagement.tsx

import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Edit, Trash2, Eye, EyeOff, 
  ChevronRight, X, Clock, Award, Users,
  BarChart3, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/Button';
import { QuizForm } from './QuizForm';
import toast from 'react-hot-toast';
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
}

interface QuizManagementProps {
  courseId: string;
  lessonId: string;
  onQuizChange?: () => void;
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
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (data: any) => {
    setSubmitting(true);
    try {
      const response = await api.post('/quizzes', {
        ...data,
        courseId,
        lessonId,
        isPublished: false,
      });
      toast.success('Quiz created successfully!');
      setShowForm(false);
      await fetchQuizzes();
      onQuizChange?.();
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuiz = async (data: any) => {
    if (!editingQuiz) return;
    setSubmitting(true);
    try {
      await api.put(`/quizzes/${editingQuiz._id}`, data);
      toast.success('Quiz updated successfully!');
      setShowForm(false);
      setEditingQuiz(null);
      await fetchQuizzes();
      onQuizChange?.();
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to update quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted successfully!');
      await fetchQuizzes();
      onQuizChange?.();
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleTogglePublish = async (quizId: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/quizzes/${quizId}/publish`);
      toast.success(`Quiz ${response.data.data.isPublished ? 'published' : 'unpublished'} successfully`);
      await fetchQuizzes();
      onQuizChange?.();
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      toast.error(error.response?.data?.message || 'Failed to update quiz status');
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
      toast.error('Failed to load quiz statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#10B981]" />
          <h4 className="text-sm font-semibold text-[#EDEFEE]">Quizzes</h4>
          <span className="text-xs text-[#5C6360]">({quizzes.length})</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingQuiz(null);
            setShowForm(true);
          }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Quiz
        </Button>
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="text-center py-6 text-[#5C6360] bg-[#0D0F0F] rounded-lg border border-[#2A302E] border-dashed">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No quizzes for this lesson yet</p>
          <p className="text-xs">Create a quiz to test your students' knowledge</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-[#0D0F0F] border border-[#2A302E] rounded-lg p-3 hover:border-[#10B981]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#EDEFEE] truncate">
                      {quiz.title}
                    </span>
                    {quiz.isPublished ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex-shrink-0">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30 flex-shrink-0">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#5C6360] mt-0.5">
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
                    onClick={() => handleViewStats(quiz._id)}
                    className="p-1.5 text-[#5C6360] hover:text-[#60A5FA] hover:bg-[#60A5FA]/10 rounded-lg transition-colors"
                    title="View Statistics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}
                    className="p-1.5 text-[#5C6360] hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-colors"
                    title={quiz.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {quiz.isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuiz(quiz);
                      setShowForm(true);
                    }}
                    className="p-1.5 text-[#5C6360] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                    className="p-1.5 text-[#5C6360] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Panel */}
              {showStats === quiz._id && (
                <div className="mt-3 pt-3 border-t border-[#2A302E]">
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#EDEFEE]">{stats.totalAttempts || 0}</p>
                        <p className="text-xs text-[#5C6360]">Total Attempts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#10B981]">{stats.passRate || 0}%</p>
                        <p className="text-xs text-[#5C6360]">Pass Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#60A5FA]">{stats.averageScore || 0}%</p>
                        <p className="text-xs text-[#5C6360]">Avg Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#FBBF24]">{stats.passedAttempts || 0}</p>
                        <p className="text-xs text-[#5C6360]">Passed</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5C6360] text-center">No attempts yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quiz Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0F0F]/80 backdrop-blur-sm">
          <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#EDEFEE]">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingQuiz(null);
                }}
                className="p-2 hover:bg-[#1E2322] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#9CA3A0]" />
              </button>
            </div>

            <QuizForm
              initialData={editingQuiz || undefined}
              onSubmit={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
              onCancel={() => {
                setShowForm(false);
                setEditingQuiz(null);
              }}
              loading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;