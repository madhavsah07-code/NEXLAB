// packages/frontend/src/components/ProblemSearch.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Hash, Loader2, Check, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/Button';

interface Problem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublished: boolean;
}

interface ProblemSearchProps {
  onAddProblem: (problem: Problem) => void;
  selectedProblemIds?: string[];
  placeholder?: string;
  className?: string;
}

export const ProblemSearch: React.FC<ProblemSearchProps> = ({
  onAddProblem,
  selectedProblemIds = [],
  placeholder = 'Search coding problems by name or ID...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProblems = async () => {
      if (query.trim().length < 1) {
        setProblems([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/problems/search?query=${encodeURIComponent(query)}&limit=10`);
        const data = response.data.data || [];
        
        // Filter out already selected problems
        const filtered = data.filter(
          (p: Problem) => !selectedProblemIds.includes(p._id)
        );
        
        setProblems(filtered);
        setIsOpen(filtered.length > 0);
      } catch (error) {
        console.error('Error searching problems:', error);
        setProblems([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProblems, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedProblemIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, problems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < problems.length) {
        handleSelectProblem(problems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectProblem = (problem: Problem) => {
    onAddProblem(problem);
    setQuery('');
    setProblems([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setProblems([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
      medium: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
      hard: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30',
    };
    return colors[difficulty] || colors.easy;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 1 && problems.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6360] hover:text-[#EDEFEE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-[#10B981] animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && problems.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#161A19] border border-[#2A302E] rounded-lg shadow-xl max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-[#2A302E]">
            <span className="text-xs text-[#5C6360]">
              Found {problems.length} problem{problems.length > 1 ? 's' : ''}
            </span>
          </div>
          {problems.map((problem, index) => (
            <div
              key={problem._id}
              onClick={() => handleSelectProblem(problem)}
              className={`w-full text-left px-4 py-3 hover:bg-[#1E2322] transition-colors flex items-center justify-between group cursor-pointer ${
                index === selectedIndex ? 'bg-[#1E2322]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-[#5C6360] font-mono flex-shrink-0">
                  #{problem.problemNumber}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#EDEFEE] truncate group-hover:text-[#10B981] transition-colors">
                    {problem.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded-full border ${getDifficultyBadge(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {problem.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[#5C6360]">
                        {tag}
                      </span>
                    ))}
                    {problem.tags?.length > 2 && (
                      <span className="text-[#5C6360]">+{problem.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* ✅ FIXED: Using div instead of button to prevent nesting warning */}
              <div
                className="flex-shrink-0 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-3 py-1.5 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectProblem(problem);
                }}
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Add
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.trim().length >= 1 && problems.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full bg-[#161A19] border border-[#2A302E] rounded-lg shadow-xl p-6 text-center">
          <p className="text-sm text-[#5C6360]">No problems found for "{query}"</p>
          <p className="text-xs text-[#5C6360] mt-1">Try searching with a different keyword or problem ID</p>
        </div>
      )}
    </div>
  );
};

export default ProblemSearch;