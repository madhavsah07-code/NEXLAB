// packages/frontend/src/pages/admin/CourseForm.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ImageUpload';

// ✅ Setup Monaco only if used in this file
const setupMonaco = () => {
  import('../../lib/monaco-config').then(({ setupMonaco }) => {
    setupMonaco();
  });
};

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0, 'Price must be at least 0'),
  thumbnail: z.string().optional(),
  coverImage: z.string().optional(),
  lessons: z.array(z.object({
    title: z.string().min(1, 'Lesson title is required'),
    description: z.string().optional(),
    videoUrl: z.string().url('Must be a valid URL'),
    duration: z.number().optional(),
    order: z.number(),
    isFree: z.boolean().default(false),
  })),
});

type CourseFormData = z.infer<typeof courseSchema>;

export const CourseForm: React.FC = () => {
  // ✅ Setup Monaco if needed - CourseForm doesn't use Monaco Editor
  useEffect(() => {
    // Monaco Editor is not used in this form, so we don't need to set it up
    // If Monaco is needed in the future, uncomment the line below:
    // setupMonaco();
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');

  const { register, control, handleSubmit, formState: { errors }, reset, setValue } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: 'beginner',
      price: 0,
      thumbnail: '',
      coverImage: '',
      lessons: [{ title: '', videoUrl: '', order: 1, isFree: false }],
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
          setThumbnail(course.thumbnail || '');
          setCoverImage(course.coverImage || '');
          reset({
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            price: course.price,
            thumbnail: course.thumbnail || '',
            coverImage: course.coverImage || '',
            lessons: course.lessons?.length ? course.lessons : [{ title: '', videoUrl: '', order: 1, isFree: false }],
          });
        } catch (error) {
          console.error('Error fetching course:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchCourse();
    }
  }, [id, reset]);

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      if (id) {
        await api.put(`/courses/${id}`, data);
      } else {
        await api.post('/courses', data);
      }
      navigate('/admin/courses');
    } catch (error: any) {
      console.error('Error saving course:', error);
      alert(error.response?.data?.message || 'Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/courses')}
          className="p-2 hover:bg-[#1E2322] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#9CA3A0]" />
        </button>
        <h1 className="text-2xl font-bold text-[#EDEFEE]">
          {id ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EDEFEE] mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Title *
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                placeholder="e.g., React Mastery 2025"
              />
              {errors.title && (
                <p className="text-[#F87171] text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Category *
              </label>
              <input
                {...register('category')}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                placeholder="e.g., Programming, Design"
              />
              {errors.category && (
                <p className="text-[#F87171] text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
              placeholder="Describe what students will learn..."
            />
            {errors.description && (
              <p className="text-[#F87171] text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Level *
              </label>
              <select
                {...register('level')}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] transition-all duration-200"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {errors.level && (
                <p className="text-[#F87171] text-xs mt-1">{errors.level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Price (₹) *
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                placeholder="499"
              />
              {errors.price && (
                <p className="text-[#F87171] text-xs mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
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
              <p className="text-[#F87171] text-xs mt-1">{errors.thumbnail.message}</p>
            )}
          </div>

          {/* Cover Image Upload */}
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
              <p className="text-[#F87171] text-xs mt-1">{errors.coverImage.message}</p>
            )}
          </div>

          <div className="mt-4 p-4 bg-[#0D0F0F] rounded-lg border border-[#2A302E]">
            <p className="text-xs text-[#5C6360]">
              💡 <strong>Pro Tip:</strong> Upload a cover image (16:9 ratio) for the course banner and a thumbnail (square) for course cards. 
              Images will be automatically uploaded to ImageKit CDN.
            </p>
          </div>
        </div>

        {/* Lessons */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#EDEFEE]">Lessons</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ title: '', videoUrl: '', order: fields.length + 1, isFree: false })}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Lesson
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="bg-[#0D0F0F] border border-[#2A302E] rounded-lg p-4 mb-4 relative">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-2 right-2 p-1 text-[#5C6360] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Lesson Title *
                  </label>
                  <input
                    {...register(`lessons.${index}.title`)}
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                    placeholder="Lesson title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Video URL *
                  </label>
                  <input
                    {...register(`lessons.${index}.videoUrl`)}
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    {...register(`lessons.${index}.duration`, { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Order *
                  </label>
                  <input
                    {...register(`lessons.${index}.order`, { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 text-sm text-[#9CA3A0]">
                    <input
                      {...register(`lessons.${index}.isFree`)}
                      type="checkbox"
                      className="w-4 h-4 text-[#10B981] border-[#2A302E] rounded focus:ring-[#10B981] bg-[#0D0F0F]"
                    />
                    Free Lesson
                  </label>
                </div>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <p className="text-[#5C6360] text-sm text-center py-4">
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
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : id ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;