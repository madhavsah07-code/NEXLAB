// packages/frontend/src/pages/admin/AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Eye,
  TrendingUp, DollarSign, Clock, Award,
  ArrowRight, Plus, FileJson
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalLessons: number;
  totalRevenue: number;
  totalEnrollments: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalLessons: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [coursesRes] = await Promise.all([
        api.get('/courses/admin/all'),
      ]);

      const courses = coursesRes.data.data || [];
      const published = courses.filter((c: any) => c.isPublished);
      const totalLessons = courses.reduce((acc: number, c: any) => acc + (c.lessons?.length || 0), 0);
      const totalStudents = courses.reduce((acc: number, c: any) => acc + (c.enrolledStudents?.length || 0), 0);
      const totalRevenue = courses.reduce((acc: number, c: any) => acc + (c.price * (c.enrolledStudents?.length || 0)), 0);
      const totalEnrollments = courses.reduce((acc: number, c: any) => acc + (c.enrolledStudents?.length || 0), 0);

      setStats({
        totalStudents,
        totalCourses: courses.length,
        publishedCourses: published.length,
        totalLessons,
        totalRevenue,
        totalEnrollments,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1951FC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[#0B2CB1]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF]">Admin Overview</h1>
          <p className="text-[#CBE9FD] mt-1">Here's what's happening with your platform</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin/problems/import')}
            className="gap-2"
          >
            <FileJson className="w-4 h-4" />
            Bulk Import
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/courses/create')}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1951FC]" />}
          color="emerald"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB]" />}
          color="info"
        />
        <StatCard
          title="Published"
          value={stats.publishedCourses}
          icon={<Eye className="w-5 h-5 sm:w-6 sm:h-6 text-[#3781FC]" />}
          color="warning"
        />
        <StatCard
          title="Total Lessons"
          value={stats.totalLessons}
          icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB]" />}
          color="error"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
          <p className="text-sm text-[#CBE9FD]">Total Revenue</p>
          <p className="text-2xl font-bold text-[#1951FC]">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-[#5BB8FB] mt-1">From {stats.totalEnrollments} enrollments</p>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
          <p className="text-sm text-[#CBE9FD]">Total Enrollments</p>
          <p className="text-2xl font-bold text-[#5BB8FB]">{stats.totalEnrollments}</p>
          <p className="text-xs text-[#5BB8FB] mt-1">Across {stats.totalCourses} courses</p>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
          <p className="text-sm text-[#CBE9FD]">Completion Rate</p>
          <p className="text-2xl font-bold text-[#3781FC]">
            {stats.totalEnrollments > 0
              ? Math.round((stats.totalStudents / stats.totalEnrollments) * 100)
              : 0}%
          </p>
          <p className="text-xs text-[#5BB8FB] mt-1">Students / Enrollments</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/courses/create')}
            className="gap-2 w-full justify-center text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/problems/create')}
            className="gap-2 w-full justify-center text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Problem
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/problems/import')}
            className="gap-2 w-full justify-center text-sm"
          >
            <FileJson className="w-4 h-4" />
            Bulk Import
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/users')}
            className="gap-2 w-full justify-center text-sm"
          >
            <Users className="w-4 h-4" />
            Manage Students
          </Button>
        </div>
      </div>
    </div>
  );
};