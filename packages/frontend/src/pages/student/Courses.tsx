// packages/frontend/src/pages/student/Courses.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Play, Search, Star, Eye, Filter, X, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import CoursePreviewModal from '../../components/CoursePreviewModal';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface Course {
  _id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: any[];
  enrolledStudents: string[];
  isPublished: boolean;
  price: number;
  instructor?: { name: string; email: string };
  category: string;
  createdAt: string;
  rating?: number;
  totalReviews?: number;
  thumbnail?: string;
  coverImage?: string;
}

export const StudentCourses: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses/published');
      const courseData = response.data.data || [];
      setCourses(courseData);
      
      const uniqueCategories: string[] = [
        ...new Set<string>(
          courseData
            .map((c: Course) => c.category)
            .filter((category: unknown): category is string => typeof category === 'string' && category.length > 0)
        ),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      await checkAuth();
      await fetchCourses();
      setIsModalOpen(false);
      toast.success('✅ Successfully enrolled in course! 🎉');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const handleLearnMore = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleCourseClick = (course: Course) => {
    if (isUserEnrolled(course)) {
      navigate(`/course/${course._id}`);
    }
  };

  const isUserEnrolled = (course: Course): boolean => {
    const userId = user?._id || user?.id;
    return (userId ? course.enrolledStudents?.includes(userId) : false) || 
           user?.enrolledCourses?.includes(course._id) || false;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
      intermediate: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
      advanced: 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20',
    };
    return colors[level] || 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
  };

  const formatPrice = (amount: number): string => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel ? c.level === filterLevel : true;
    const matchesCategory = filterCategory ? c.category === filterCategory : true;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterLevel('');
    setFilterCategory('');
  };

  const hasActiveFilters = searchTerm || filterLevel || filterCategory;

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading courses..." />;
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#EDEFEE] flex items-center gap-2">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#10B981]" />
            Browse Courses
          </h1>
          <p className="text-[#9CA3A0] mt-1">Expand your skills with our curated content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCourses}
            className="gap-1"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
          <input
            type="text"
            placeholder="Search courses by title, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] min-w-[130px]"
          >
            <option value="">All Levels</option>
            <option value="beginner">🟢 Beginner</option>
            <option value="intermediate">🟡 Intermediate</option>
            <option value="advanced">🔴 Advanced</option>
          </select>

          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] min-w-[130px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-[#F87171] hover:text-[#F87171] hover:bg-[#F87171]/10"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#5C6360]">
          Showing <span className="text-[#EDEFEE] font-medium">{filteredCourses.length}</span> courses
        </p>
        {filteredCourses.length > 0 && (
          <p className="text-xs text-[#5C6360]">
            {filteredCourses.filter(c => isUserEnrolled(c)).length} enrolled
          </p>
        )}
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-[#10B981] mx-auto mb-4 opacity-40" />
          <p className="text-[#9CA3A0]">No courses found</p>
          {hasActiveFilters ? (
            <>
              <p className="text-[#5C6360] text-sm mt-1">Try adjusting your filters</p>
              <Button
                variant="primary"
                onClick={clearFilters}
                className="mt-4 gap-2"
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <p className="text-[#5C6360] text-sm mt-1">Check back soon for new courses!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = isUserEnrolled(course);
            const lessonCount = course.lessons?.length || 0;
            const studentCount = course.enrolledStudents?.length || 0;

            return (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course)}
                className={`bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm hover:shadow-[#10B981]/5 hover:shadow-lg transition-shadow flex flex-col group ${
                  isEnrolled ? 'cursor-pointer hover:border-[#10B981]/30' : 'cursor-default'
                }`}
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/10 flex items-center justify-center relative overflow-hidden">
                  {(course.coverImage || course.thumbnail) ? (
                    <img
                      src={course.coverImage || course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-[#10B981]/20', 'to-[#059669]/10');
                        e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-[#10B981] opacity-40 fallback-icon" />
                  )}
                  
                  {/* Rating Badge */}
                  {course.rating && course.rating > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0D0F0F]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#2A302E]">
                      <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                      <span className="text-xs font-medium text-[#EDEFEE]">{course.rating.toFixed(1)}</span>
                      <span className="text-xs text-[#5C6360]">({course.totalReviews || 0})</span>
                    </div>
                  )}

                  {/* Price Badge */}
                  {course.price > 0 && (
                    <div className="absolute bottom-3 left-3 bg-[#0D0F0F]/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-[#2A302E]">
                      <span className="text-sm font-bold text-[#10B981]">{formatPrice(course.price)}</span>
                    </div>
                  )}
                  
                  {course.price === 0 && !isEnrolled && (
                    <div className="absolute bottom-3 left-3 bg-[#0D0F0F]/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-[#2A302E]">
                      <span className="text-sm font-medium text-[#10B981]">Free</span>
                    </div>
                  )}

                  {/* Enrolled Badge */}
                  {isEnrolled && (
                    <div className="absolute top-3 left-3 bg-[#10B981]/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#10B981]/30">
                      <span className="text-xs font-medium text-white flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        Enrolled
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="text-xs text-[#5C6360]">• {lessonCount} lessons</span>
                    {course.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#2A302E] text-[#5C6360] border border-[#2A302E]">
                        {course.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-[#EDEFEE] line-clamp-1 group-hover:text-[#10B981] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#9CA3A0] mt-1 line-clamp-2 flex-1">{course.description}</p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-[#5C6360]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {studentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lessonCount} lessons
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#2A302E]">
                    {isEnrolled ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/course/${course._id}`);
                          }}
                          className="flex-1 gap-1 text-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Learn
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLearnMore(course);
                          }}
                          className="flex-1 gap-1 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          More
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnroll(course._id);
                          }}
                          disabled={enrolling === course._id}
                          className="flex-1 gap-1 text-xs"
                        >
                          {enrolling === course._id ? 'Enrolling...' : `Enroll ${course.price > 0 ? formatPrice(course.price) : 'Free'}`}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLearnMore(course);
                          }}
                          className="flex-1 gap-1 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          More
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Preview Modal */}
      {selectedCourse && (
        <CoursePreviewModal
          course={selectedCourse}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCourse(null);
          }}
          onEnroll={() => handleEnroll(selectedCourse._id)}
          isEnrolled={isUserEnrolled(selectedCourse)}
        />
      )}
    </div>
  );
};

export default StudentCourses;