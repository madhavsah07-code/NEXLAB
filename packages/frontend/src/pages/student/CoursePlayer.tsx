// packages/frontend/src/pages/student/CoursePlayer.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, CheckCircle, Lock, BookOpen, Award, Star, Zap,
  ChevronLeft, ChevronRight, Code2, ChevronRight as ChevronRightIcon,
  Video, ClipboardCheck, Clock, Users, Calendar, ThumbsUp, MessageCircle,
  List, FileText, BarChart3, TrendingUp, Check, X, XCircle, AlertCircle,
  Hash, Eye, RotateCcw
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { CourseReviews } from '../../components/CourseReviews';
import { QuizModal } from '../../components/QuizModal';
import { formatISTDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  order: number;
  isFree: boolean;
  problemIds?: string[];
  quizIds?: string[]; // ✅ Changed to array for multiple quizzes
}

interface Problem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublished: boolean;
  acceptanceRate?: number;
  totalSubmissions?: number;
  isSolved?: boolean;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: any[];
  timeLimit?: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
  isCompleted?: boolean;
  completedScore?: number;
  passed?: boolean;
  attemptCount?: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: { name: string };
  lessons: Lesson[];
  enrolledStudents: string[];
  rating?: number;
  totalReviews?: number;
  createdAt: string;
  thumbnail?: string;
  coverImage?: string;
}

interface QuizAttempt {
  _id: string;
  quizId: string;
  score: number;
  passed: boolean;
  completedAt: string;
  attemptNumber: number;
}

export const CoursePlayer: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<'session' | 'practice'>('session');

  // Quiz states - ✅ Multiple quizzes support
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [quizAttempts, setQuizAttempts] = useState<Record<string, QuizAttempt>>({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizStatusMap, setQuizStatusMap] = useState<Record<string, { completed: boolean; score?: number; passed?: boolean }>>({});

  // Problem states
  const [lessonProblems, setLessonProblems] = useState<Record<string, Problem[]>>({});
  const [loadingProblems, setLoadingProblems] = useState<Record<string, boolean>>({});
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());

  const currentLesson = course?.lessons[currentLessonIndex];

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchProgress();
      fetchSubmissions();
    }
  }, [courseId]);

  useEffect(() => {
    if (currentLesson?._id) {
      fetchQuizzes();
      fetchLessonProblems(currentLesson._id);
      fetchAllQuizAttempts();
    }
  }, [currentLesson]);

  // Update solved status when submissions or problems change
  useEffect(() => {
    if (submissions.length > 0 && lessonProblems) {
      const solved = new Set(
        submissions
          .filter(s => s.status === 'accepted')
          .map(s => s.problemId?._id || s.problemId)
      );
      setSolvedProblems(solved);
    }
  }, [submissions, lessonProblems]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/progress`);
      const data = response.data.data;
      setCompletedLessons(data.completedLessonIds || []);
      setProgress(data.percentage || 0);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/problems/submissions');
      setSubmissions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  // ✅ Fetch all quizzes for the current lesson
  const fetchQuizzes = async () => {
    if (!currentLesson?._id) return;

    // Check if the lesson has quiz IDs
    if (!currentLesson.quizIds || currentLesson.quizIds.length === 0) {
      console.log('📚 No quiz IDs found for this lesson');
      setQuizzes([]);
      return;
    }

    setLoadingQuizzes(true);
    try {
      console.log(`📚 Fetching ${currentLesson.quizIds.length} quizzes for lesson ${currentLesson._id}`);

      const quizPromises = currentLesson.quizIds.map(async (quizId: string) => {
        try {
          const response = await api.get(`/quizzes/public/${quizId}`);
          return response.data.data;
        } catch (error) {
          console.error(`Error fetching quiz ${quizId}:`, error);
          return null;
        }
      });

      const quizResults = await Promise.all(quizPromises);
      const validQuizzes = quizResults.filter((q): q is Quiz => q !== null);
      setQuizzes(validQuizzes);
      console.log(`✅ Loaded ${validQuizzes.length} quizzes`);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // ✅ Fetch all quiz attempts for the current user
  const fetchAllQuizAttempts = async () => {
    try {
      const response = await api.get('/quizzes/attempts');
      const attempts = response.data.data || [];

      const statusMap: Record<string, { completed: boolean; score?: number; passed?: boolean }> = {};
      const completedSet = new Set<string>();

      attempts.forEach((attempt: any) => {
        if (attempt.completedAt) {
          const quizId = attempt.quizId?._id || attempt.quizId;
          if (quizId) {
            completedSet.add(quizId);
            statusMap[quizId] = {
              completed: true,
              score: attempt.score,
              passed: attempt.passed,
            };
          }
        }
      });

      setCompletedQuizzes(completedSet);
      setQuizStatusMap(statusMap);

      // Update quiz completion status
      setQuizzes(prev => prev.map(quiz => ({
        ...quiz,
        isCompleted: completedSet.has(quiz._id),
        completedScore: statusMap[quiz._id]?.score,
        passed: statusMap[quiz._id]?.passed,
      })));

    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
    }
  };

  // Fetch problems for a lesson using public endpoint
  const fetchLessonProblems = async (lessonId: string) => {
    if (!course) return;

    const currentLesson = course.lessons.find(l => l._id === lessonId);
    if (!currentLesson || !currentLesson.problemIds || currentLesson.problemIds.length === 0) {
      console.log(`📚 No problem IDs found for lesson ${lessonId}`);
      setLessonProblems(prev => ({ ...prev, [lessonId]: [] }));
      return;
    }

    console.log(`📚 Fetching ${currentLesson.problemIds.length} problems for lesson ${lessonId}`);

    setLoadingProblems(prev => ({ ...prev, [lessonId]: true }));

    try {
      const problemDetails = await Promise.all(
        currentLesson.problemIds.map(async (problemId: string) => {
          try {
            const response = await api.get(`/problems/public/${problemId}`);
            return response.data.data;
          } catch (error: any) {
            if (error.response?.status === 404) {
              console.warn(`Problem ${problemId} not found or not published`);
            } else {
              console.error(`Error fetching problem ${problemId}:`, error);
            }
            return null;
          }
        })
      );

      const validProblems = problemDetails.filter((p): p is Problem => p !== null);
      console.log(`✅ Found ${validProblems.length} valid problems`);
      setLessonProblems(prev => ({ ...prev, [lessonId]: validProblems }));
    } catch (error) {
      console.error('Error fetching lesson problems:', error);
      toast.error('Failed to load practice problems');
    } finally {
      setLoadingProblems(prev => ({ ...prev, [lessonId]: false }));
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      const response = await api.post(`/courses/${courseId}/${lessonId}/complete`);
      setXpEarned(response.data.data.xpEarned || 10);

      await fetchProgress();

      if (course && currentLessonIndex < course.lessons.length - 1) {
        setTimeout(() => {
          setCurrentLessonIndex(currentLessonIndex + 1);
          setActiveTab('session');
        }, 1500);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Failed to complete lesson');
    }
  };

  const handleQuizComplete = (quizId: string, score: number, passed: boolean) => {
    setCompletedQuizzes(prev => new Set(prev).add(quizId));
    setQuizStatusMap(prev => ({
      ...prev,
      [quizId]: { completed: true, score, passed },
    }));

    // Update quiz in the list
    setQuizzes(prev => prev.map(q =>
      q._id === quizId
        ? { ...q, isCompleted: true, completedScore: score, passed }
        : q
    ));

    fetchCourse();
    fetchProgress();
    fetchAllQuizAttempts();

    if (passed) {
      toast.success(`🎉 Quiz passed! Score: ${score}%`);
    } else {
      toast.error(`📝 Quiz score: ${score}%. Keep learning!`);
    }
  };

  const handleOpenQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsQuizModalOpen(true);
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30',
      medium: 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30',
      hard: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
    };
    return colors[difficulty] || colors.easy;
  };

  const getDifficultyIcon = (difficulty: string) => {
    const icons: Record<string, string> = {
      easy: '🟢',
      medium: '🟡',
      hard: '🔴',
    };
    return icons[difficulty] || '⚪';
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading course..." />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-[#CBE9FD]">Course not found</p>
        <Button variant="primary" onClick={() => navigate('/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  const totalLessons = course.lessons.length;
  const completedCount = completedLessons.length;
  const allLessonsCompleted = completedCount === totalLessons && totalLessons > 0;
  const hasProblems = currentLesson?.problemIds && currentLesson.problemIds.length > 0;
  const hasQuizzes = currentLesson?.quizIds && currentLesson.quizIds.length > 0;

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 hover:bg-[#0B2CB1] rounded-lg transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5 text-[#CBE9FD]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#FFFFFF]">{course.title}</h1>
            <p className="text-[#CBE9FD] text-sm">Instructor: {course.instructor?.name || 'Unknown'}</p>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              {course.rating && course.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#3781FC] text-[#3781FC]" />
                  <span className="text-sm font-medium text-[#FFFFFF]">{course.rating.toFixed(1)}</span>
                  <span className="text-xs text-[#5BB8FB]">({course.totalReviews || 0} reviews)</span>
                </div>
              )}
              <span className="text-xs text-[#5BB8FB]">•</span>
              <span className="text-xs text-[#5BB8FB]">
                <Clock className="w-3 h-3 inline mr-1" />
                {course.lessons.reduce((acc, l) => acc + (l.duration || 0), 0)} min total
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="text-sm text-[#5BB8FB]">
              {completedCount} / {totalLessons} lessons
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-[#CBE9FD] mb-2">
            <span>Course Progress</span>
            <span className="text-[#1951FC] font-semibold">{progress}% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-[#000000] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1951FC] to-[#3781FC] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#5BB8FB]">
            <span>{completedCount} of {totalLessons} lessons completed</span>
            {xpEarned > 0 && (
              <span className="text-[#1951FC] font-medium">+{xpEarned} XP earned!</span>
            )}
            {allLessonsCompleted && (
              <span className="text-[#3781FC] font-medium">🎉 Course Complete!</span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex border-b border-[#0B2CB1] mb-4">
              <button
                onClick={() => setActiveTab('session')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'session'
                    ? 'border-[#1951FC] text-[#1951FC]'
                    : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
                }`}
              >
                <Video className="w-4 h-4" />
                Session
                {currentLesson && isLessonCompleted(currentLesson._id) && (
                  <CheckCircle className="w-3 h-3 text-[#1951FC]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'practice'
                    ? 'border-[#1951FC] text-[#1951FC]'
                    : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Practice
                {(hasProblems || hasQuizzes) && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#1951FC]/20 text-[#1951FC]">
                    {hasProblems && (lessonProblems[currentLesson?._id || '']?.length || 0)}
                    {hasProblems && hasQuizzes && ' + '}
                    {hasQuizzes && `${quizzes.length} Quiz${quizzes.length > 1 ? 'zes' : ''}`}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'session' ? (
              <SessionTab
                course={course}
                currentLesson={currentLesson}
                currentLessonIndex={currentLessonIndex}
                isLessonCompleted={isLessonCompleted}
                handleCompleteLesson={handleCompleteLesson}
                xpEarned={xpEarned}
              />
            ) : (
              <PracticeTab
                course={course}
                currentLesson={currentLesson}
                lessonProblems={lessonProblems}
                loadingProblems={loadingProblems}
                solvedProblems={solvedProblems}
                quizzes={quizzes}
                loadingQuizzes={loadingQuizzes}
                quizStatusMap={quizStatusMap}
                onOpenQuiz={handleOpenQuiz}
              />
            )}
          </div>

          {/* Right Panel - Lesson List */}
          <div className="lg:col-span-1">
            <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl shadow-sm sticky top-4">
              <div className="p-4 border-b border-[#0B2CB1]">
                <h3 className="font-semibold text-[#FFFFFF]">Course Content</h3>
                <p className="text-xs text-[#5BB8FB]">{totalLessons} lessons</p>
              </div>
              <div className="divide-y divide-[#0B2CB1] max-h-[600px] overflow-y-auto">
                {course.lessons.map((lesson, index) => {
                  const isCompleted = isLessonCompleted(lesson._id);
                  const isCurrent = index === currentLessonIndex;
                  const hasProblems = lesson.problemIds && lesson.problemIds.length > 0;
                  const hasQuizzes = lesson.quizIds && lesson.quizIds.length > 0;

                  return (
                    <button
                      key={lesson._id}
                      onClick={() => {
                        setCurrentLessonIndex(index);
                        setActiveTab('session');
                      }}
                      className={`
                        w-full text-left p-4 hover:bg-[#0B2CB1] transition-colors flex items-start gap-3
                        ${isCurrent ? 'bg-[#1951FC]/5 border-l-4 border-[#1951FC]' : ''}
                        ${isCompleted ? 'opacity-75' : ''}
                      `}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-[#1951FC]" />
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-[#5BB8FB]">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isCurrent ? 'text-[#1951FC] font-medium' : 'text-[#CBE9FD]'}`}>
                          {lesson.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {lesson.duration && (
                            <span className="text-xs text-[#5BB8FB]">{lesson.duration} min</span>
                          )}
                          {hasProblems && (
                            <span className="text-xs text-[#1951FC] flex items-center gap-1">
                              <Code2 className="w-3 h-3" />
                              {lesson.problemIds?.length}
                            </span>
                          )}
                          {hasQuizzes && (
                            <span className="text-xs text-[#3781FC] flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {lesson.quizIds?.length}
                            </span>
                          )}
                        </div>
                      </div>
                      {isCompleted && (
                        <span className="text-xs text-[#1951FC] font-medium flex-shrink-0">Done</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
            disabled={currentLessonIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Lesson
          </Button>
          <div className="flex gap-2">
            {currentLesson && !isLessonCompleted(currentLesson._id) && activeTab === 'session' && (
              <Button
                variant="primary"
                onClick={() => handleCompleteLesson(currentLesson._id)}
                className="gap-1"
              >
                <Play className="w-4 h-4" />
                Mark Complete & Continue
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setCurrentLessonIndex(Math.min(totalLessons - 1, currentLessonIndex + 1))}
              disabled={currentLessonIndex === totalLessons - 1}
              className="gap-1"
            >
              Next Lesson
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 pt-8 border-t border-[#0B2CB1]">
          <h2 className="text-xl font-bold text-[#FFFFFF] mb-4">Course Reviews</h2>
          <CourseReviews
            courseId={course._id}
            onReviewChange={() => {
              fetchCourse();
            }}
          />
        </div>

        {/* Quiz Modal */}
        {selectedQuizId && currentLesson && (
          <QuizModal
            quizId={selectedQuizId}
            lessonId={currentLesson._id}
            isOpen={isQuizModalOpen}
            onClose={() => {
              setIsQuizModalOpen(false);
              setSelectedQuizId(null);
            }}
            onComplete={(score: number, passed: boolean) => {
              if (selectedQuizId) {
                handleQuizComplete(selectedQuizId, score, passed);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

// ---------- Session Tab Component ----------
interface SessionTabProps {
  course: Course;
  currentLesson: Lesson | undefined;
  currentLessonIndex: number;
  isLessonCompleted: (lessonId: string) => boolean;
  handleCompleteLesson: (lessonId: string) => void;
  xpEarned: number;
}

const SessionTab: React.FC<SessionTabProps> = ({
  course,
  currentLesson,
  currentLessonIndex,
  isLessonCompleted,
  handleCompleteLesson,
  xpEarned,
}) => {
  if (!currentLesson) {
    return (
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-12 text-center">
        <Video className="w-12 h-12 text-[#5BB8FB] mx-auto mb-4 opacity-40" />
        <p className="text-[#CBE9FD]">No lesson selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl overflow-hidden shadow-sm">
        <div className="aspect-video bg-[#000000] flex items-center justify-center relative">
          {currentLesson.videoUrl ? (
            <iframe
              src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="text-center">
              <Play className="w-16 h-16 text-[#5BB8FB] mx-auto" />
              <p className="text-[#5BB8FB] mt-2">Video coming soon</p>
            </div>
          )}

          <div className="absolute top-4 left-4 bg-[#000000]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#0B2CB1]">
            <span className="text-xs text-[#5BB8FB]">
              Lesson {currentLessonIndex + 1} of {course.lessons.length}
            </span>
          </div>

          {isLessonCompleted(currentLesson._id) && (
            <div className="absolute top-4 right-4 bg-[#1951FC]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#1951FC]/30">
              <span className="text-xs font-medium text-white flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completed
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#FFFFFF]">
                {currentLesson.title}
              </h2>
              {currentLesson.description && (
                <p className="text-[#CBE9FD] mt-2 text-sm leading-relaxed">
                  {currentLesson.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#5BB8FB]">
                {currentLesson.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentLesson.duration} minutes
                  </span>
                )}
                {currentLesson.isFree && (
                  <span className="text-[#1951FC]">Free Preview</span>
                )}
              </div>
            </div>
            <Button
              variant={isLessonCompleted(currentLesson._id) ? 'outline' : 'primary'}
              onClick={() => handleCompleteLesson(currentLesson._id)}
              disabled={isLessonCompleted(currentLesson._id)}
              className="flex-shrink-0"
            >
              {isLessonCompleted(currentLesson._id) ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
          {xpEarned > 0 && (
            <div className="mt-3 p-3 bg-[#1951FC]/10 border border-[#1951FC]/20 rounded-lg">
              <p className="text-sm text-[#1951FC] flex items-center gap-2">
                <Zap className="w-4 h-4" />
                +{xpEarned} XP earned!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
          <h4 className="text-sm font-medium text-[#FFFFFF] mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1951FC]" />
            Key Concepts
          </h4>
          <ul className="space-y-1.5 text-sm text-[#CBE9FD]">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#1951FC] mt-0.5 flex-shrink-0" />
              <span>Understand the core concepts covered in this lesson</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#1951FC] mt-0.5 flex-shrink-0" />
              <span>Apply the knowledge in the practice section</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#1951FC] mt-0.5 flex-shrink-0" />
              <span>Complete the quizzes to test your understanding</span>
            </li>
          </ul>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
          <h4 className="text-sm font-medium text-[#FFFFFF] mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3781FC]" />
            Progress
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[#5BB8FB]">
              <span>Lesson Status</span>
              <span className={isLessonCompleted(currentLesson._id) ? 'text-[#1951FC]' : 'text-[#3781FC]'}>
                {isLessonCompleted(currentLesson._id) ? '✅ Completed' : '⏳ In Progress'}
              </span>
            </div>
            <div className="flex justify-between text-sm text-[#5BB8FB]">
              <span>Course Progress</span>
              <span className="text-[#1951FC]">{Math.round((course.lessons.filter(l => isLessonCompleted(l._id)).length / course.lessons.length) * 100)}%</span>
            </div>
            {xpEarned > 0 && (
              <div className="flex justify-between text-sm text-[#5BB8FB]">
                <span>XP Earned This Session</span>
                <span className="text-[#1951FC]">+{xpEarned} XP</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Practice Tab Component ----------
interface PracticeTabProps {
  course: Course;
  currentLesson: Lesson | undefined;
  lessonProblems: Record<string, Problem[]>;
  loadingProblems: Record<string, boolean>;
  solvedProblems: Set<string>;
  quizzes: Quiz[];
  loadingQuizzes: boolean;
  quizStatusMap: Record<string, { completed: boolean; score?: number; passed?: boolean }>;
  onOpenQuiz: (quizId: string) => void;
}

const PracticeTab: React.FC<PracticeTabProps> = ({
  course,
  currentLesson,
  lessonProblems,
  loadingProblems,
  solvedProblems,
  quizzes,
  loadingQuizzes,
  quizStatusMap,
  onOpenQuiz,
}) => {
  const [activePracticeTab, setActivePracticeTab] = useState<'problems' | 'quizzes'>('problems');

  if (!currentLesson) {
    return (
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-12 text-center">
        <ClipboardCheck className="w-12 h-12 text-[#5BB8FB] mx-auto mb-4 opacity-40" />
        <p className="text-[#CBE9FD]">No lesson selected</p>
      </div>
    );
  }

  const problems = lessonProblems[currentLesson._id] || [];
  const hasProblems = problems.length > 0;
  const hasQuizzes = quizzes.length > 0;

  // Determine which tab to show by default
  useEffect(() => {
    if (hasProblems && !hasQuizzes) {
      setActivePracticeTab('problems');
    } else if (hasQuizzes && !hasProblems) {
      setActivePracticeTab('quizzes');
    } else if (hasProblems && hasQuizzes) {
      setActivePracticeTab('problems');
    }
  }, [hasProblems, hasQuizzes]);

  if (!hasProblems && !hasQuizzes) {
    return (
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-12 text-center">
        <ClipboardCheck className="w-12 h-12 text-[#5BB8FB] mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium text-[#FFFFFF]">No Practice Content</p>
        <p className="text-sm text-[#CBE9FD] mt-2">
          This lesson doesn't have any coding problems or quizzes yet.
        </p>
        <p className="text-xs text-[#5BB8FB] mt-1">
          Check back later or explore other lessons.
        </p>
      </div>
    );
  }

  // Count completed quizzes
  const completedQuizCount = quizzes.filter(q => quizStatusMap[q._id]?.completed).length;

  return (
    <div className="space-y-4">
      {/* Practice Tab Navigation */}
      <div className="flex border-b border-[#0B2CB1] bg-[#000000] rounded-t-lg overflow-x-auto">
        {hasProblems && (
          <button
            onClick={() => setActivePracticeTab('problems')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activePracticeTab === 'problems'
                ? 'border-[#1951FC] text-[#1951FC]'
                : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Coding Problems
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#0B2CB1] text-[#5BB8FB]">
              {problems.length}
            </span>
          </button>
        )}
        {hasQuizzes && (
          <button
            onClick={() => setActivePracticeTab('quizzes')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activePracticeTab === 'quizzes'
                ? 'border-[#1951FC] text-[#1951FC]'
                : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
            }`}
          >
            <Zap className="w-4 h-4" />
            Quizzes
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#0B2CB1] text-[#5BB8FB]">
              {completedQuizCount}/{quizzes.length}
            </span>
          </button>
        )}
      </div>

      {/* Practice Content */}
      {activePracticeTab === 'problems' && hasProblems && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#FFFFFF]">Practice Problems</h3>
              <p className="text-xs text-[#5BB8FB]">
                Solve these problems to reinforce what you learned
              </p>
            </div>
            <span className="text-xs text-[#5BB8FB]">
              {problems.filter(p => solvedProblems.has(p._id)).length} / {problems.length} solved
            </span>
          </div>

          {loadingProblems[currentLesson._id] ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="space-y-2">
              {problems.map((problem) => {
                const isSolved = solvedProblems.has(problem._id);
                return (
                  <Link
                    key={problem._id}
                    to={`/problems/${problem.slug}`}
                    target="_blank"
                    className="block p-4 bg-[#03195B] border border-[#0B2CB1] rounded-lg hover:border-[#1951FC]/30 hover:bg-[#0B2CB1] transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-[#5BB8FB] font-mono flex-shrink-0 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {problem.problemNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#FFFFFF] group-hover:text-[#1951FC] transition-colors truncate">
                              {problem.title}
                            </span>
                            {isSolved && (
                              <span className="text-xs text-[#1951FC] flex-shrink-0">✅ Solved</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded-full border ${getDifficultyBadge(problem.difficulty)}`}>
                              {getDifficultyIcon(problem.difficulty)} {problem.difficulty}
                            </span>
                            {problem.tags?.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[#5BB8FB]">
                                {tag}
                              </span>
                            ))}
                            {problem.acceptanceRate && (
                              <span className="text-[#5BB8FB]">
                                • {problem.acceptanceRate}% acceptance
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant={isSolved ? 'secondary' : 'primary'}
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`/problems/${problem.slug}`, '_blank');
                          }}
                        >
                          {isSolved ? 'Review' : 'Solve'}
                        </Button>
                        <ChevronRightIcon className="w-4 h-4 text-[#5BB8FB] group-hover:text-[#1951FC] transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activePracticeTab === 'quizzes' && hasQuizzes && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#FFFFFF]">Quizzes</h3>
              <p className="text-xs text-[#5BB8FB]">
                Test your knowledge with these quizzes
              </p>
            </div>
            <span className="text-xs text-[#5BB8FB]">
              {completedQuizCount} / {quizzes.length} completed
            </span>
          </div>

          {loadingQuizzes ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => {
                const status = quizStatusMap[quiz._id];
                const isCompleted = status?.completed || false;
                const score = status?.score;
                const passed = status?.passed;

                return (
                  <div key={quiz._id} className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-5 h-5 text-[#3781FC]" />
                          <h4 className="text-base font-semibold text-[#FFFFFF]">{quiz.title}</h4>
                          {isCompleted && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              passed
                                ? 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30'
                                : 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30'
                            }`}>
                              {passed ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {passed ? 'Passed' : 'Failed'} ({score}%)
                            </span>
                          )}
                        </div>
                        {quiz.description && (
                          <p className="text-sm text-[#CBE9FD] mb-3">{quiz.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5BB8FB]">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {quiz.questions.length} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Pass: {quiz.passingScore}%
                          </span>
                          {quiz.timeLimit && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {quiz.timeLimit} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {quiz.maxAttempts} attempt{quiz.maxAttempts > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant={isCompleted ? 'secondary' : 'primary'}
                          onClick={() => onOpenQuiz(quiz._id)}
                          className="gap-2"
                        >
                          {isCompleted ? (
                            <>
                              <Eye className="w-4 h-4" />
                              Review
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Start Quiz
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getDifficultyBadge = (difficulty: string) => {
  const colors: Record<string, string> = {
    easy: 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30',
    medium: 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30',
    hard: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
  };
  return colors[difficulty] || colors.easy;
};

const getDifficultyIcon = (difficulty: string) => {
  const icons: Record<string, string> = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴',
  };
  return icons[difficulty] || '⚪';
};

export default CoursePlayer;