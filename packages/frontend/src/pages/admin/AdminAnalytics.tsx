// packages/frontend/src/pages/admin/AdminAnalytics.tsx

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, BookOpen, DollarSign,
  BarChart3, RefreshCw, GraduationCap, Eye,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { formatISTDate } from '../../utils/dateUtils';

interface OverviewData {
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalRevenue: number;
}

interface GrowthData {
  date: string;
  label: string;
  newUsers: number;
  newEnrollments: number;
}

interface PopularCourse {
  title: string;
  level: string;
  enrolledStudents: number;
  lessons: number;
  isPublished: boolean;
  price: number;
  rating: number;
}

export const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'revenue'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, coursesRes] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/courses'),
      ]);

      setOverview(overviewRes.data.data.overview);
      setGrowthData(overviewRes.data.data.growth || []);
      setPopularCourses(coursesRes.data.data.popularCourses || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-[#1951FC] bg-[#1951FC]/10',
      intermediate: 'text-[#5BB8FB] bg-[#5BB8FB]/10',
      advanced: 'text-[#3781FC] bg-[#3781FC]/10',
    };
    return colors[level] || 'text-[#CBE9FD] bg-[#0B2CB1]';
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] flex items-center gap-2">
            <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-[#1951FC]" />
            Analytics
          </h1>
          <p className="text-[#CBE9FD] mt-1">Monitor platform performance and insights</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          className="gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#1951FC] text-white'
              : 'bg-[#03195B] text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'courses'
              ? 'bg-[#1951FC] text-white'
              : 'bg-[#03195B] text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Courses
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-[#1951FC] text-white'
              : 'bg-[#03195B] text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Students
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'revenue'
              ? 'bg-[#1951FC] text-white'
              : 'bg-[#03195B] text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Revenue
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Overview Stats */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title="Total Students"
                value={overview?.totalStudents || 0}
                icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1951FC]" />}
                color="emerald"
              />
              <StatCard
                title="Total Courses"
                value={overview?.totalCourses || 0}
                icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB]" />}
                color="info"
              />
              <StatCard
                title="Total Enrollments"
                value={overview?.totalEnrollments || 0}
                icon={<GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#3781FC]" />}
                color="warning"
              />
              <StatCard
                title="Revenue"
                value={`$${overview?.totalRevenue || 0}`}
                icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#1951FC]" />}
                color="emerald"
              />
            </div>

            {/* Growth Chart */}
            <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] mb-4">Growth (Last 7 Days)</h3>
              <div className="h-48 sm:h-64 flex items-end justify-between gap-2">
                {growthData.map((day, index) => {
                  const maxValue = Math.max(...growthData.map(d => d.newUsers), 1);
                  const height = (day.newUsers / maxValue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center">
                        <div
                          className="w-full max-w-[30px] sm:max-w-[40px] bg-gradient-to-t from-[#1951FC] to-[#3781FC] rounded-t transition-all duration-500"
                          style={{ height: `${Math.max(height * 0.8, 4)}px` }}
                        />
                        <div className="text-[10px] sm:text-xs text-[#5BB8FB] mt-2">{day.label}</div>
                        <div className="text-[10px] sm:text-xs font-medium text-[#FFFFFF]">{day.newUsers}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#5BB8FB] text-center mt-4">New users per day (IST)</p>
            </div>

            {/* Popular Courses Preview */}
            <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] mb-4">Popular Courses</h3>
              <div className="space-y-3">
                {popularCourses.slice(0, 5).map((course, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-[#0B2CB1] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-[#5BB8FB]">#{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#FFFFFF] truncate">{course.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          <span className="text-[#5BB8FB]">{course.enrolledStudents} students</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#1951FC]">{course.enrolledStudents}</p>
                      <p className="text-xs text-[#5BB8FB]">enrolled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] mb-4">All Courses Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#FFFFFF]">{overview?.totalCourses || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Total Courses</p>
              </div>
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#1951FC]">{overview?.publishedCourses || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Published</p>
              </div>
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#3781FC]">{overview?.totalLessons || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Total Lessons</p>
              </div>
            </div>

            <h4 className="font-medium text-[#FFFFFF] mb-3">Top Courses by Enrollment</h4>
            <div className="space-y-3">
              {popularCourses.map((course, index) => (
                <div key={index} className="flex items-center justify-between border-b border-[#0B2CB1] pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#FFFFFF] truncate">{course.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5BB8FB]">
                      <span className={`px-1.5 py-0.5 rounded ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                      <span>{course.lessons} lessons</span>
                      <span>{course.enrolledStudents} students</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#1951FC]">{course.enrolledStudents}</p>
                    <p className="text-xs text-[#5BB8FB]">enrollments</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] mb-4">Student Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#FFFFFF]">{overview?.totalStudents || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Total Students</p>
              </div>
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#1951FC]">Coming Soon</p>
                <p className="text-xs text-[#5BB8FB]">Active Students</p>
              </div>
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#3781FC]">{overview?.totalEnrollments || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Total Enrollments</p>
              </div>
            </div>
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-[#5BB8FB] mx-auto mb-3 opacity-40" />
              <p className="text-[#CBE9FD]">Detailed student analytics coming soon</p>
              <p className="text-xs text-[#5BB8FB] mt-1">Check back for more insights</p>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] mb-4">Revenue Analytics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#1951FC]">${overview?.totalRevenue || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Total Revenue</p>
              </div>
              <div className="bg-[#000000] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#FFFFFF]">{overview?.totalCourses || 0}</p>
                <p className="text-xs text-[#5BB8FB]">Total Courses</p>
              </div>
            </div>

            <h4 className="font-medium text-[#FFFFFF] mb-3">Revenue by Course</h4>
            <div className="space-y-3">
              {popularCourses.slice(0, 5).map((course, index) => (
                <div key={index} className="flex items-center justify-between border-b border-[#0B2CB1] pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#FFFFFF] truncate">{course.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5BB8FB]">
                      <span>${course.price}</span>
                      <span>{course.enrolledStudents} students</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#1951FC]">${(course.price * course.enrolledStudents).toFixed(2)}</p>
                    <p className="text-xs text-[#5BB8FB]">revenue</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center py-4 bg-[#000000] rounded-lg">
              <p className="text-sm text-[#5BB8FB]">💡 Tip: Create more premium courses to increase revenue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;