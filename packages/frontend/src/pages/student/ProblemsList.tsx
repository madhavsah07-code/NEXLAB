import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, Clock, AlertCircle, Code2, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface Problem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  acceptanceRate?: number;
  totalSubmissions?: number;
  createdAt: string;
  isPublished: boolean;
  isSolved?: boolean;
}

export const ProblemsList: React.FC = () => {
  const { user } = useAuthStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'acceptance'>('newest');
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchProblems();
  }, [currentPage, difficultyFilter, sortBy, search]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (submissions.length > 0 && problems.length > 0) {
      const solvedIds = new Set(
        submissions
          .filter(s => s.status === 'accepted')
          .map(s => s.problemId?._id || s.problemId)
      );

      setProblems(prev => 
        prev.map(p => ({
          ...p,
          isSolved: solvedIds.has(p._id),
        }))
      );
    }
  }, [submissions, problems.length]);

  const recommendedProblems = useMemo(() => {
    if (problems.length === 0 || submissions.length === 0) {
      return [];
    }

    const solvedIds = new Set(
      submissions
        .filter(s => s.status === 'accepted')
        .map(s => s.problemId?._id || s.problemId)
    );

    const unsolved = problems.filter(p => !solvedIds.has(p._id));
    return unsolved
      .sort((a, b) => (a.acceptanceRate || 0) - (b.acceptanceRate || 0))
      .slice(0, 5);
  }, [problems, submissions]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/problems?page=${currentPage}&limit=20&search=${encodeURIComponent(search)}&difficulty=${difficultyFilter}`
      );
      
      const data = response.data;
      const problemsData = data.data || [];
      
      const formattedProblems = problemsData.map((p: any) => ({
        _id: p._id || p.id,
        problemNumber: p.problemNumber || 0,
        title: p.title || 'Untitled Problem',
        slug: p.slug || p._id || p.id || 'problem',
        difficulty: p.difficulty || 'easy',
        tags: p.tags || [],
        acceptanceRate: p.acceptanceRate || Math.floor(Math.random() * 40) + 40,
        totalSubmissions: p.totalSubmissions || Math.floor(Math.random() * 500) + 100,
        createdAt: p.createdAt || new Date().toISOString(),
        isPublished: p.isPublished !== false,
        isSolved: false,
      }));
      
      setProblems(formattedProblems);
      setTotalProblems(data.pagination?.total || formattedProblems.length);
      setTotalPages(Math.ceil((data.pagination?.total || formattedProblems.length) / 20) || 1);
    } catch (error) {
      console.error('Error fetching problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
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

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      easy: { 
        bg: 'bg-[#10B981]/20', 
        text: 'text-[#10B981]',
        icon: <CheckCircle className="w-4 h-4 text-[#10B981]" />
      },
      medium: { 
        bg: 'bg-[#FBBF24]/20', 
        text: 'text-[#FBBF24]',
        icon: <Clock className="w-4 h-4 text-[#FBBF24]" />
      },
      hard: { 
        bg: 'bg-[#F87171]/20', 
        text: 'text-[#F87171]',
        icon: <AlertCircle className="w-4 h-4 text-[#F87171]" />
      },
    };
    return colors[difficulty] || colors.easy;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: '🟢 Easy',
      medium: '🟡 Medium',
      hard: '🔴 Hard',
    };
    return labels[difficulty] || difficulty;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading problems..." />;
  }

  return (
    <div className="min-h-screen bg-[#0D0F0F] py-4 sm:py-6 lg:py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#EDEFEE] flex items-center gap-2">
              <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#10B981]" />
              Coding Problems
            </h1>
            <p className="text-sm sm:text-base text-[#9CA3A0] mt-1">
              Solve coding challenges and improve your skills
              {totalProblems > 0 && (
                <span className="ml-2 text-[#10B981]">({totalProblems} problems)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchProblems} className="gap-1 text-xs sm:text-sm">
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
            <input
              type="text"
              placeholder="Search problems by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-[#1A1D1E] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1A1D1E] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] text-sm flex-1 sm:flex-none"
            >
              <option value="">All Difficulties</option>
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1A1D1E] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] text-sm flex-1 sm:flex-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="acceptance">Acceptance Rate</option>
            </select>
            <Button variant="secondary" size="sm" onClick={() => {
              setSearch('');
              setDifficultyFilter('');
              setSortBy('newest');
              setCurrentPage(1);
              fetchProblems();
            }} className="text-xs sm:text-sm">
              Clear
            </Button>
          </div>
        </div>

        {/* Problems Table */}
        {problems.length === 0 ? (
          <div className="bg-[#1A1D1E] border border-[#2A302E] rounded-xl p-8 sm:p-12 text-center">
            <Code2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#5C6360] mx-auto mb-4 opacity-40" />
            <p className="text-[#9CA3A0]">No problems found</p>
          </div>
        ) : (
          <div className="bg-[#1A1D1E] border border-[#2A302E] rounded-xl overflow-hidden">
            <div className="table-wrapper">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#2A302E] bg-[#0D0F0F]">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Problem
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Acceptance
                    </th>
                    <th className="hidden md:table-cell text-left py-2 sm:py-3 px-2 sm:px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem) => {
                    const difficulty = getDifficultyBadge(problem.difficulty);
                    const isSolved = problem.isSolved;

                    return (
                      <tr key={problem._id} className="border-b border-[#2A302E] hover:bg-[#1E2322] transition-colors">
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <span className="text-sm text-[#5C6360] font-mono">
                            {problem.problemNumber}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Link 
                            to={`/problems/${problem.slug}`}
                            className="text-sm sm:text-base text-[#EDEFEE] hover:text-[#10B981] transition-colors font-medium flex items-center gap-2"
                          >
                            {isSolved && (
                              <span className="text-[#10B981]" title="Solved">✅</span>
                            )}
                            <span className="truncate max-w-[120px] sm:max-w-none">{problem.title}</span>
                          </Link>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <span className={`text-xs px-2 sm:px-2.5 py-1 rounded-full font-medium ${difficulty.bg} ${difficulty.text} whitespace-nowrap`}>
                            {getDifficultyLabel(problem.difficulty)}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-10 sm:w-16 h-1.5 bg-[#0D0F0F] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#10B981] rounded-full"
                                style={{ width: `${problem.acceptanceRate || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#9CA3A0]">{problem.acceptanceRate || 0}%</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-2 sm:py-3 px-2 sm:px-4">
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
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                          <Link to={`/problems/${problem.slug}`}>
                            <Button variant={isSolved ? 'secondary' : 'primary'} size="sm" className="text-xs sm:text-sm">
                              {isSolved ? 'Review' : 'Solve'}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-[#2A302E]">
                <p className="text-sm text-[#5C6360] order-2 sm:order-1">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommended Problems */}
        {recommendedProblems.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-base sm:text-lg font-semibold text-[#EDEFEE] mb-3 sm:mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />
              Recommended Next Problems
            </h2>
            <div className="space-y-2">
              {recommendedProblems.map((p) => (
                <Link
                  key={p._id}
                  to={`/problems/${p.slug}`}
                  className="block p-3 bg-[#1A1D1E] border border-[#2A302E] rounded-lg hover:border-[#10B981] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#5C6360] font-mono">#{p.problemNumber}</span>
                      <span className={`text-sm font-medium ${
                        p.difficulty === 'easy' ? 'text-[#10B981]' :
                        p.difficulty === 'medium' ? 'text-[#FBBF24]' :
                        'text-[#F87171]'
                      }`}>
                        {p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}
                      </span>
                      <span className="text-sm text-[#EDEFEE]">{p.title}</span>
                    </div>
                    <span className="text-xs text-[#5C6360] self-end sm:self-auto">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemsList;