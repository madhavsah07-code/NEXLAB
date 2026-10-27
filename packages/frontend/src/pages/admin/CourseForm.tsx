// packages/frontend/src/pages/admin/CourseForm.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, BookOpen, Hash, X, List, Code2, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ImageUpload';
import { ProblemSearch } from '../../components/ProblemSearch';
import { QuizManagement } from '../../components/QuizManagement';
import { useConfirm } from '../../hooks/useConfirm';
import { addToast } from '../../components/ui/Toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Setup Monaco
const setupMonaco = () => {
  import('../../lib/monaco-config').then(({ setupMonaco }) => {
    setupMonaco();
  });
};

interface Problem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublished: boolean;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0, 'Price must be at least 0'),
  thumbnail: z.string().optional(),
  coverImage: z.string().optional(),
  lessons: z.array(z.object({
    _id: z.string().optional(),
    title: z.string().min(1, 'Lesson title is required'),
    description: z.string().optional(),
    videoUrl: z.string().url('Must be a valid URL'),
    duration: z.number().optional(),
    order: z.number(),
    isFree: z.boolean().default(false),
    problemIds: z.array(z.string()).default([]),
    quizIds: z.array(z.string()).default([]), // ✅ Array of quiz IDs
  })),
});

type CourseFormData = z.infer<typeof courseSchema>;

export const CourseForm: React.FC = () => {
  useEffect(() => {
    setupMonaco();
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [selectedProblems, setSelectedProblems] = useState<Record<number, Problem[]>>({});
  const [quizCount, setQuizCount] = useState<Record<number, number>>({});
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const { register, control, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: 'beginner',
      price: 0,
      thumbnail: '',
      coverImage: '',
      lessons: [{
        title: '',
        videoUrl: '',
        order: 1,
        isFree: false,
        problemIds: [],
        quizIds: []
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lessons',
  });

  // Fetch course if editing
  useEffect(() => {
    if (id) {
      const fetchCourse = async () => {
        try {
          const response = await api.get(`/courses/${id}`);
          const course = response.data.data;
          console.log('📚 Fetched course:', course);
          console.log('📚 Lessons:', course.lessons);

          setThumbnail(course.thumbnail || '');
          setCoverImage(course.coverImage || '');

          const lessonData = course.lessons?.length ? course.lessons : [{
            title: '',
            videoUrl: '',
            order: 1,
            isFree: false,
            problemIds: [],
            quizId: ''
          }];

          // Load selected problems for each lesson
          if (course.lessons) {
            const problemsMap: Record<number, Problem[]> = {};
            for (let i = 0; i < course.lessons.length; i++) {
              const lesson = course.lessons[i];
              // Load problems
              if (lesson.problemIds && lesson.problemIds.length > 0) {
                try {
                  const problemDetails = await Promise.all(
                    lesson.problemIds.map(async (problemId: string) => {
                      const res = await api.get(`/problems/admin/${problemId}`);
                      return res.data.data;
                    })
                  );
                  problemsMap[i] = problemDetails;
                } catch (error) {
                  console.error('Error fetching problem details:', error);
                }
              }

              // Load quiz count
              if (lesson.quizId) {
                try {
                  const quizRes = await api.get(`/quizzes/${lesson.quizId}`);
                  if (quizRes.data.data) {
                    setQuizCount(prev => ({ ...prev, [i]: 1 }));
                  }
                } catch (error) {
                  console.error('Error fetching quiz:', error);
                }
              }
            }
            setSelectedProblems(problemsMap);
          }

          reset({
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            price: course.price,
            thumbnail: course.thumbnail || '',
            coverImage: course.coverImage || '',
            lessons: lessonData,
          });
        } catch (error) {
          console.error('Error fetching course:', error);
          addToast('Failed to load course', 'error');
        } finally {
          setFetching(false);
        }
      };
      fetchCourse();
    }
  }, [id, reset]);

  // Handle removing a lesson with confirmation
  const handleRemoveLesson = async (index: number) => {
    if (fields.length === 1) {
      addToast('You need at least one lesson', 'warning');
      return;
    }

    const confirmed = await confirm({
      title: 'Remove Lesson',
      message: 'Are you sure you want to remove this lesson? This action cannot be undone.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (confirmed) {
      remove(index);
      // Clean up selected problems and quiz count for this lesson
      const newSelectedProblems = { ...selectedProblems };
      delete newSelectedProblems[index];
      setSelectedProblems(newSelectedProblems);

      const newQuizCount = { ...quizCount };
      delete newQuizCount[index];
      setQuizCount(newQuizCount);

      addToast('Lesson removed successfully', 'success');
    }
  };

  // DIRECT SAVE FUNCTION
  const handleSave = async () => {
    console.log('🚀 Save button clicked');

    // Get form data directly
    const data = getValues();
    console.log('📋 Form data:', data);

    // Validate required fields
    if (!data.title || data.title.trim().length < 3) {
      addToast('Title must be at least 3 characters', 'error');
      return;
    }

    if (!data.description || data.description.trim().length < 10) {
      addToast('Description must be at least 10 characters', 'error');
      return;
    }

    if (!data.category || data.category.trim().length < 1) {
      addToast('Category is required', 'error');
      return;
    }

    // Validate lessons
    for (let i = 0; i < data.lessons.length; i++) {
      const lesson = data.lessons[i];
      if (!lesson.title || lesson.title.trim().length < 1) {
        addToast(`Lesson ${i + 1}: Title is required`, 'error');
        return;
      }
      if (!lesson.videoUrl || lesson.videoUrl.trim().length < 1) {
        addToast(`Lesson ${i + 1}: Video URL is required`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      // Build course data
      const lessonsWithData = data.lessons.map((lesson, index) => {
        const lessonData: any = {
          title: lesson.title,
          description: lesson.description || '',
          videoUrl: lesson.videoUrl,
          duration: lesson.duration || 0,
          order: lesson.order || index + 1,
          isFree: lesson.isFree || false,
          problemIds: selectedProblems[index]?.map(p => p._id) || [],
          quizIds: lesson.quizIds || [],
        };

        // Only include _id if it exists and is a string
        if (lesson._id && typeof lesson._id === 'string') {
          lessonData._id = lesson._id;
        }

        return lessonData;
      });

      const courseData = {
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level,
        price: data.price || 0,
        thumbnail: data.thumbnail || '',
        coverImage: data.coverImage || '',
        lessons: lessonsWithData,
      };

      console.log('📦 Sending course data:', JSON.stringify(courseData, null, 2));

      let response;
      if (id) {
        console.log(`🔄 Updating course ${id}...`);
        response = await api.put(`/courses/${id}`, courseData);
        console.log('✅ Update response:', response.data);
        addToast('Course updated successfully!', 'success');
      } else {
        console.log('🔄 Creating new course...');
        response = await api.post('/courses', courseData);
        console.log('✅ Create response:', response.data);
        addToast('Course created successfully!', 'success');
      }

      // Navigate after successful save
      setTimeout(() => {
        navigate('/admin/courses');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Error saving course:', error);
      console.error('❌ Error response:', error.response?.data);
      addToast(error.response?.data?.message || 'Failed to save course. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = (lessonIndex: number, problem: Problem) => {
    setSelectedProblems(prev => {
      const current = prev[lessonIndex] || [];
      if (current.some(p => p._id === problem._id)) {
        addToast('Problem already added to this lesson', 'warning');
        return prev;
      }
      return {
        ...prev,
        [lessonIndex]: [...current, problem],
      };
    });
    addToast(`Added problem #${problem.problemNumber} to lesson`, 'success');
  };

  const handleRemoveProblem = async (lessonIndex: number, problemId: string, problemTitle: string) => {
    const confirmed = await confirm({
      title: 'Remove Problem',
      message: `Are you sure you want to remove "${problemTitle}" from this lesson?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (!confirmed) return;

    setSelectedProblems(prev => {
      const current = prev[lessonIndex] || [];
      return {
        ...prev,
        [lessonIndex]: current.filter(p => p._id !== problemId),
      };
    });
    addToast('Problem removed from lesson', 'success');
  };

  const getSelectedProblemIds = (lessonIndex: number) => {
    return (selectedProblems[lessonIndex] || []).map(p => p._id);
  };

  const handleQuizCreated = (lessonIndex: number, quizId?: string) => {
    setQuizCount(prev => ({ ...prev, [lessonIndex]: (prev[lessonIndex] || 0) + 1 }));

    if (quizId) {
      const currentLessons = getValues('lessons');
      if (currentLessons && currentLessons[lessonIndex]) {
        const quizIds = currentLessons[lessonIndex].quizIds || [];
        if (!quizIds.includes(quizId)) {
          setValue(`lessons.${lessonIndex}.quizIds`, [...quizIds, quizId]);
        }
      }
    }

    addToast('Quiz added to lesson!', 'success');
  };

  if (fetching) {
    return <LoadingSpinner fullScreen text="Loading course..." />;
  }

  return (
    <>
      <ConfirmDialogComponent />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/courses')}
            className="p-2 hover:bg-[#0B2CB1] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#CBE9FD]" />
          </button>
          <h1 className="text-2xl font-bold text-[#FFFFFF]">
            {id ? 'Edit Course' : 'Create New Course'}
          </h1>
        </div>

        <form className="space-y-6">
          {/* Basic Info - Same as before */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#FFFFFF] mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Title *
                </label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                  placeholder="e.g., React Mastery 2025"
                />
                {errors.title && (
                  <p className="text-[#5BB8FB] text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Category *
                </label>
                <input
                  {...register('category')}
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                  placeholder="e.g., Programming, Design"
                />
                {errors.category && (
                  <p className="text-[#5BB8FB] text-xs mt-1">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                placeholder="Describe what students will learn..."
              />
              {errors.description && (
                <p className="text-[#5BB8FB] text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Level *
                </label>
                <select
                  {...register('level')}
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] transition-all duration-200"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.level && (
                  <p className="text-[#5BB8FB] text-xs mt-1">{errors.level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Price (₹) *
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                  placeholder="499"
                />
                {errors.price && (
                  <p className="text-[#5BB8FB] text-xs mt-1">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <ImageUpload
                value={thumbnail}
                onChange={(value) => {
                  setThumbnail(value);
                  setValue('thumbnail', value);
                }}
                label="Course Thumbnail (Square, 512x512)"
                placeholder="Upload a course thumbnail..."
                aspectRatio="square"
              />
              {errors.thumbnail && (
                <p className="text-[#5BB8FB] text-xs mt-1">{errors.thumbnail.message}</p>
              )}
            </div>

            <div className="mt-4">
              <ImageUpload
                value={coverImage}
                onChange={(value) => {
                  setCoverImage(value);
                  setValue('coverImage', value);
                }}
                label="Cover Image (16:9, 1920x1080)"
                placeholder="Upload a cover image for the course..."
                aspectRatio="16:9"
              />
              {errors.coverImage && (
                <p className="text-[#5BB8FB] text-xs mt-1">{errors.coverImage.message}</p>
              )}
            </div>

            <div className="mt-4 p-4 bg-[#000000] rounded-lg border border-[#0B2CB1]">
              <p className="text-xs text-[#5BB8FB]">
                💡 <strong>Pro Tip:</strong> Upload a cover image (16:9 ratio) for the course banner and a thumbnail (square) for course cards.
                Images will be automatically uploaded to ImageKit CDN.
              </p>
            </div>
          </div>

          {/* Lessons */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#FFFFFF]">Lessons</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({
                  title: '',
                  videoUrl: '',
                  order: fields.length + 1,
                  isFree: false,
                  problemIds: [],
                  quizIds: []
                })}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Lesson
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="bg-[#000000] border border-[#0B2CB1] rounded-lg p-4 mb-4 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveLesson(index)}
                  className="absolute top-2 right-2 p-1 text-[#5BB8FB] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                      Lesson Title *
                    </label>
                    <input
                      {...register(`lessons.${index}.title`)}
                      className="w-full px-4 py-2.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                      placeholder="Lesson title"
                    />
                    {errors.lessons?.[index]?.title && (
                      <p className="text-[#5BB8FB] text-xs mt-1">{errors.lessons?.[index]?.title?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                      Video URL *
                    </label>
                    <input
                      {...register(`lessons.${index}.videoUrl`)}
                      className="w-full px-4 py-2.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                      placeholder="https://youtube.com/..."
                    />
                    {errors.lessons?.[index]?.videoUrl && (
                      <p className="text-[#5BB8FB] text-xs mt-1">{errors.lessons?.[index]?.videoUrl?.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                      Duration (minutes)
                    </label>
                    <input
                      {...register(`lessons.${index}.duration`, { valueAsNumber: true })}
                      type="number"
                      className="w-full px-4 py-2.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                      Order *
                    </label>
                    <input
                      {...register(`lessons.${index}.order`, { valueAsNumber: true })}
                      type="number"
                      className="w-full px-4 py-2.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
                      placeholder="1"
                    />
                    {errors.lessons?.[index]?.order && (
                      <p className="text-[#5BB8FB] text-xs mt-1">{errors.lessons?.[index]?.order?.message}</p>
                    )}
                  </div>

                  <div className="flex items-center mt-6">
                    <label className="flex items-center gap-2 text-sm text-[#CBE9FD]">
                      <input
                        {...register(`lessons.${index}.isFree`)}
                        type="checkbox"
                        className="w-4 h-4 text-[#1951FC] border-[#0B2CB1] rounded focus:ring-[#1951FC] bg-[#000000]"
                      />
                      Free Lesson
                    </label>
                  </div>
                </div>

                {/* Coding Problems Section */}
                <div className="mt-4 pt-4 border-t border-[#0B2CB1]">
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="w-4 h-4 text-[#1951FC]" />
                    <h4 className="text-sm font-medium text-[#FFFFFF]">Coding Problems</h4>
                    <span className="text-xs text-[#5BB8FB]">
                      ({selectedProblems[index]?.length || 0} added)
                    </span>
                  </div>

                  <ProblemSearch
                    onAddProblem={(problem) => handleAddProblem(index, problem)}
                    selectedProblemIds={getSelectedProblemIds(index)}
                    placeholder="Search coding problems by name or ID..."
                  />

                  {(selectedProblems[index] || []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedProblems[index]?.map((problem) => (
                        <div
                          key={problem._id}
                          className="flex items-center justify-between p-3 bg-[#03195B] border border-[#0B2CB1] rounded-lg hover:border-[#1951FC]/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-[#5BB8FB] font-mono flex-shrink-0">
                              #{problem.problemNumber}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#FFFFFF] truncate">
                                {problem.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-1.5 py-0.5 rounded-full border ${problem.difficulty === 'easy' ? 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30' :
                                    problem.difficulty === 'medium' ? 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30' :
                                      'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30'
                                  }`}>
                                  {problem.difficulty}
                                </span>
                                {problem.tags?.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-[#5BB8FB]">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProblem(index, problem._id, problem.title)}
                            className="p-1 text-[#5BB8FB] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quiz Management Section */}
                <div className="mt-4 pt-4 border-t border-[#0B2CB1]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#3781FC]" />
                    <h4 className="text-sm font-medium text-[#FFFFFF]">Quiz</h4>
                    <span className="text-xs text-[#5BB8FB]">
                      {quizCount[index] ? '✅ Added' : 'Not added'}
                    </span>
                  </div>

                  <QuizManagement
                    courseId={id || 'new'}
                    lessonId={field._id || field.id || `lesson-${index}`}
                    onQuizChange={(quizId) => handleQuizCreated(index, quizId)}
                  />
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <p className="text-[#5BB8FB] text-sm text-center py-4">
                No lessons yet. Click "Add Lesson" to get started.
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/courses')}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={loading}
              className="gap-2"
              onClick={handleSave}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                id ? 'Update Course' : 'Create Course'
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CourseForm;