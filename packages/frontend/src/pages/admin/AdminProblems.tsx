// packages/frontend/src/pages/admin/AdminProblems.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search,
  Code2, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, FileJson, Download,
  Upload, Filter, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useConfirm } from '../../hooks/useConfirm';
import { addToast } from '../../components/ui/Toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface Problem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  createdBy?: { name: string };
  testCases?: any[];
  submissions?: number;
  acceptanceRate?: number;
}

export const AdminProblems: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  useEffect(() => {
    fetchProblems();
  }, [currentPage, difficultyFilter]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/problems/admin/all?page=${currentPage}&limit=20&search=${encodeURIComponent(search)}&difficulty=${difficultyFilter}`
      );
      const data = response.data;
      setProblems(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalProblems(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching problems:', error);
      addToast('Failed to load problems', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const response = await api.patch(`/problems/${id}/publish`);
      setProblems(problems.map(p => p._id === id ? response.data.data : p));
      addToast(`Problem ${currentStatus ? 'unpublished' : 'published'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling publish:', error);
      addToast('Failed to update problem status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Problem',
      message: `Are you sure you want to delete "${title}"? This will permanently remove the problem and all submissions.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    setActionLoading(id);
    try {
      await api.delete(`/problems/${id}`);
      setProblems(problems.filter(p => p._id !== id));
      addToast('Problem deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting problem:', error);
      addToast('Failed to delete problem', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.post('/problems/export', {
        problemIds: problems.map(p => p._id),
      });
      
      const data = response.data.data;
      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `problems_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Problems exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting problems:', error);
      addToast('Failed to export problems', 'error');
    } finally {
      setExporting(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; label: string }> = {
      easy: { 
        bg: 'bg-[#10B981]/20', 
        text: 'text-[#10B981]', 
        border: 'border-[#10B981]/30',
        label: '🟢 Easy'
      },
      medium: { 
        bg: 'bg-[#FBBF24]/20', 
        text: 'text-[#FBBF24]', 
        border: 'border-[#FBBF24]/30',
        label: '🟡 Medium'
      },
      hard: { 
        bg: 'bg-[#F87171]/20', 
        text: 'text-[#F87171]', 
        border: 'border-[#F87171]/30',
        label: '🔴 Hard'
      },
    };
    return colors[difficulty] || colors.easy;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProblems();
  };

  const handleClearFilters = () => {
    setSearch('');
    setDifficultyFilter('');
    setCurrentPage(1);
    fetchProblems();
  };

  const getDifficultyCount = (difficulty: string) => {
    return problems.filter(p => p.difficulty === difficulty).length;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading problems..." />;
  }

  return (
    <>
      <ConfirmDialogComponent />
      <div className="py-8 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2A302E]">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#EDEFEE] flex items-center gap-2">
              <Code2 className="w-8 h-8 text-[#10B981]" />
              Coding Problems
            </h1>
            <p className="text-[#9CA3A0] mt-1">
              Create, edit, and manage coding challenges
              {totalProblems > 0 && (
                <span className="ml-2 text-[#10B981]">({totalProblems} total)</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={exporting || problems.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
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
              onClick={() => navigate('/admin/problems/create')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Problem
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
            <p className="text-sm text-[#9CA3A0]">Total</p>
            <p className="text-2xl font-bold text-[#EDEFEE]">{problems.length}</p>
          </div>
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
            <p className="text-sm text-[#9CA3A0]">Published</p>
            <p className="text-2xl font-bold text-[#10B981]">
              {problems.filter(p => p.isPublished).length}
            </p>
          </div>
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
            <p className="text-sm text-[#9CA3A0]">Drafts</p>
            <p className="text-2xl font-bold text-[#FBBF24]">
              {problems.filter(p => !p.isPublished).length}
            </p>
          </div>
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
            <p className="text-sm text-[#9CA3A0]">Difficulty</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#10B981]">🟢 {getDifficultyCount('easy')}</span>
              <span className="text-xs text-[#FBBF24]">🟡 {getDifficultyCount('medium')}</span>
              <span className="text-xs text-[#F87171]">🔴 {getDifficultyCount('hard')}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
            <input
              type="text"
              placeholder="Search problems by title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
            >
              <option value="">All Difficulties</option>
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
            <Button type="submit" variant="primary" size="sm" className="gap-1">
              <Search className="w-4 h-4" />
              Search
            </Button>
            {(search || difficultyFilter) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1"
              >
                <Filter className="w-4 h-4" />
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchProblems}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </form>

        {/* Problems Table */}
        {problems.length === 0 ? (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-12 text-center">
            <Code2 className="w-12 h-12 text-[#5C6360] mx-auto mb-4 opacity-40" />
            <p className="text-[#9CA3A0]">No problems found</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <Button
                variant="primary"
                onClick={() => navigate('/admin/problems/create')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Problem
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/problems/import')}
                className="gap-2"
              >
                <FileJson className="w-4 h-4" />
                Bulk Import
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#2A302E] bg-[#0D0F0F]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Problem
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Test Cases
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem) => {
                    const difficulty = getDifficultyBadge(problem.difficulty);
                    const testCaseCount = problem.testCases?.length || 0;

                    return (
                      <tr
                        key={problem._id}
                        className="border-b border-[#2A302E] hover:bg-[#1E2322] transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#5C6360] font-mono">
                            #{problem.problemNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-[#EDEFEE] group-hover:text-[#10B981] transition-colors">
                              {problem.title}
                            </p>
                            <p className="text-xs text-[#5C6360]">/{problem.slug}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${difficulty.bg} ${difficulty.text} ${difficulty.border}`}>
                            {difficulty.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags?.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs px-2 py-0.5 rounded bg-[#2A302E] text-[#5C6360]">
                                {tag}
                              </span>
                            ))}
                            {problem.tags?.length > 2 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#2A302E] text-[#5C6360]">
                                +{problem.tags.length - 2}
                              </span>
                            )}
                            {(!problem.tags || problem.tags.length === 0) && (
                              <span className="text-xs text-[#5C6360]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-[#EDEFEE]">{testCaseCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {problem.isPublished ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Published
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] flex items-center justify-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs text-[#5C6360]">
                            {new Date(problem.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleTogglePublish(problem._id, problem.isPublished)}
                              disabled={actionLoading === problem._id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                problem.isPublished 
                                  ? 'text-[#FBBF24] hover:bg-[#FBBF24]/10' 
                                  : 'text-[#10B981] hover:bg-[#10B981]/10'
                              }`}
                              title={problem.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {actionLoading === problem._id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : problem.isPublished ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => navigate(`/admin/problems/edit/${problem._id}`)}
                              className="p-1.5 text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(problem._id, problem.title)}
                              disabled={actionLoading === problem._id}
                              className="p-1.5 text-[#9CA3A0] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#2A302E]">
                <p className="text-sm text-[#5C6360] order-2 sm:order-1">
                  Showing {problems.length} of {totalProblems} problems
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-[#9CA3A0]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#5C6360]">
          <div className="flex items-center gap-2">
            <span className="text-[#10B981]">🟢</span>
            <span>Easy</span>
            <span className="text-[#FBBF24]">🟡</span>
            <span>Medium</span>
            <span className="text-[#F87171]">🔴</span>
            <span>Hard</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-[#10B981]" />
            <span>Published</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-[#FBBF24]" />
            <span>Draft</span>
          </div>
          <span>•</span>
          <span>{totalProblems} problems total</span>
        </div>
      </div>
    </>
  );
};

export default AdminProblems;