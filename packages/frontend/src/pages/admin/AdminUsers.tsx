// packages/frontend/src/pages/admin/AdminUsers.tsx

import React, { useState, useEffect } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight,
  Edit2, Trash2, Eye, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Student {
  _id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  enrolledCourses: string[];
  enrolledCoursesCount: number;
  rank: number | null;
  createdAt: string;
  updatedAt: string;
}

export const AdminUsers: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    newStudents: 0,
  });
  const pageSize = 10;

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [currentPage, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students?page=${currentPage}&limit=${pageSize}&search=${search}`);
      const data = response.data.data;
      setStudents(data.students || []);
      setTotalPages(data.pagination.totalPages);
      setTotalStudents(data.pagination.total);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/students/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/students/${id}`);
      await fetchStudents();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'text-[#1951FC]';
    if (level <= 6) return 'text-[#5BB8FB]';
    if (level <= 10) return 'text-[#3781FC]';
    return 'text-[#5BB8FB]';
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-xs text-[#5BB8FB]">#{rank}</span>;
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
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#1951FC]" />
            Students
          </h1>
          <p className="text-[#CBE9FD] mt-1">Manage and monitor all students on the platform</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { fetchStudents(); fetchStats(); }}
          className="gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
          <p className="text-sm text-[#CBE9FD]">Total Students</p>
          <p className="text-2xl font-bold text-[#1951FC]">{stats.totalStudents}</p>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
          <p className="text-sm text-[#CBE9FD]">Active (30 days)</p>
          <p className="text-2xl font-bold text-[#5BB8FB]">{stats.activeStudents}</p>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4">
          <p className="text-sm text-[#CBE9FD]">New (7 days)</p>
          <p className="text-2xl font-bold text-[#3781FC]">{stats.newStudents}</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5BB8FB]" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB] transition-all duration-200"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
                fetchStudents();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Students Table */}
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#0B2CB1] bg-[#000000]">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Level
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  XP
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Courses
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Streak
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#CBE9FD]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student._id}
                    className="border-b border-[#0B2CB1] hover:bg-[#0B2CB1] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1951FC]/20 text-[#1951FC] flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[#FFFFFF]">{student.name}</p>
                          <p className="text-xs text-[#5BB8FB]">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {getRankBadge(student.rank)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${getLevelColor(student.level || 1)}`}>
                        {student.level || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-[#1951FC]">{student.xp || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[#FFFFFF]">{student.enrolledCoursesCount || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[#3781FC]">{student.streak || 0}🔥</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => alert(`View details for ${student.name}`)}
                          className="p-1.5 text-[#CBE9FD] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert(`Edit ${student.name}`)}
                          className="p-1.5 text-[#CBE9FD] hover:text-[#3781FC] hover:bg-[#3781FC]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id, student.name)}
                          className="p-1.5 text-[#CBE9FD] hover:text-[#5BB8FB] hover:bg-[#5BB8FB]/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#0B2CB1]">
            <p className="text-sm text-[#5BB8FB] order-2 sm:order-1">
              Showing {students.length} of {totalStudents} students
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#CBE9FD]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-[#CBE9FD] hover:text-[#FFFFFF] hover:bg-[#0B2CB1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};