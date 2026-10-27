// packages/frontend/src/pages/admin/AdminCourses.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Search,
  BookOpen, Users, Clock, CheckCircle, XCircle,
  RefreshCw, Filter
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useConfirm } from '../../hooks/useConfirm';
import { addToast } from '../../components/ui/Toast';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isPublished: boolean;
  enrolledStudents: string[];
  lessons: any[];
  createdAt: string;
  instructor?: { name: string };
}

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses/admin/all');
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const response = await api.patch(`/courses/${id}/publish`);
      setCourses(courses.map(c => c._id === id ? response.data.data : c));
      const newStatus = !currentStatus;
      addToast(`Course ${newStatus ? 'published' : 'unpublished'} successfully!`, 'success');
    } catch (error) {
      console.error('Error toggling publish:', error);
      addToast('Failed to update course status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone. All lessons and student enrollments will be permanently removed.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    setActionLoading(id);
    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c._id !== id));
      addToast('Course deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting course:', error);
      addToast('Failed to delete course', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#1951FC]/10 text-[#1951FC] border-[#1951FC]/20',
      intermediate: 'bg-[#5BB8FB]/10 text-[#5BB8FB] border-[#5BB8FB]/20',
      advanced: 'bg-[#3781FC]/10 text-[#3781FC] border-[#3781FC]/20',
    };
    return colors[level] || 'bg-[#1951FC]/10 text-[#1951FC] border-[#1951FC]/20';
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1951FC] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialogComponent />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[#0B2CB1]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] flex items-center gap-2">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#1951FC]" />
              Manage Courses
            </h1>
            <p className="text-[#CBE9FD] mt-1">Create, edit, and publish your course content</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCourses}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/courses/create')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5BB8FB]" />
            <input
              type="text"
              placeholder="Search courses by title, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
            <p className="text-sm text-[#CBE9FD]">Total Courses</p>
            <p className="text-2xl font-bold text-[#FFFFFF]">{courses.length}</p>
          </div>
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
            <p className="text-sm text-[#CBE9FD]">Published</p>
            <p className="text-2xl font-bold text-[#1951FC]">{courses.filter(c => c.isPublished).length}</p>
          </div>
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
            <p className="text-sm text-[#CBE9FD]">Drafts</p>
            <p className="text-2xl font-bold text-[#3781FC]">{courses.filter(c => !c.isPublished).length}</p>
          </div>
        </div>

        {/* Course List */}
        {filteredCourses.length === 0 ? (
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#1951FC] mx-auto mb-4 opacity-40" />
            <p className="text-[#CBE9FD]">No courses found. Create your first course!</p>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/courses/create')}
              className="mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-[#1951FC]/5 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] truncate">
                        {course.title}
                      </h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getLevelBadge(course.level)}`}>
                        {course.level}
                      </span>
                      {course.isPublished ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1951FC]/20 text-[#1951FC] font-medium border border-[#1951FC]/20 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#3781FC]/20 text-[#3781FC] font-medium border border-[#3781FC]/20 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#CBE9FD] line-clamp-1">{course.description}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-[#5BB8FB]">
                      <span>Category: {course.category}</span>
                      <span>•</span>
                      <span>₹{course.price}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.enrolledStudents?.length || 0} students
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.lessons?.length || 0} lessons
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(course._id, course.isPublished)}
                      disabled={actionLoading === course._id}
                      className={`p-2 rounded-lg transition-colors ${
                        course.isPublished
                          ? 'text-[#3781FC] hover:bg-[#3781FC]/10'
                          : 'text-[#1951FC] hover:bg-[#1951FC]/10'
                      }`}
                      title={course.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {actionLoading === course._id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : course.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/courses/edit/${course._id}`)}
                      className="p-2 text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course._id, course.title)}
                      disabled={actionLoading === course._id}
                      className="p-2 text-[#CBE9FD] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminCourses;