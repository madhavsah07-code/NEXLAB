// packages/frontend/src/pages/student/Leaderboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import {
  Crown, Medal, Trophy, Star,
  TrendingUp, Users, Award,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  badges: string[];
}

interface UserRank {
  rank: number;
  xp: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard?limit=${pageSize * currentPage}`);
      const data = response.data.data;
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank || null);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-[#3781FC]" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-[#CBE9FD]" />;
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-[#CBE9FD]" />;
    } else {
      return <span className="text-sm font-medium text-[#5BB8FB]">#{rank}</span>;
    }
  };

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'text-[#1951FC]';
    if (level <= 6) return 'text-[#5BB8FB]';
    if (level <= 10) return 'text-[#3781FC]';
    return 'text-[#5BB8FB]';
  };

  const getBadgeIcon = (badge: string) => {
    const badgeMap: Record<string, string> = {
      'First Steps': '🎓',
      'Dedicated Learner': '📚',
      'Master Student': '🏆',
      'Streak Starter': '🔥',
      'Code Warrior': '⚔️',
      'Quick Learner': '⚡',
    };
    return badgeMap[badge] || '🏅';
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

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
            <Trophy className="w-8 h-8 text-[#3781FC]" />
            Leaderboard
          </h1>
          <p className="text-[#CBE9FD] mt-1">Top students ranked by experience points</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchLeaderboard}
          className="gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <div className="bg-[#03195B] border border-[#1951FC]/20 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 shadow-sm shadow-[#1951FC]/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1951FC]/20 border-2 border-[#1951FC] flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-[#1951FC]">
                  #{userRank.rank}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#CBE9FD]">Your Rank</p>
                <p className="text-lg font-bold text-[#FFFFFF]">{user?.name || 'You'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-[#CBE9FD]">XP</p>
                <p className="text-xl font-bold text-[#1951FC]">{userRank.xp}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#CBE9FD]">Level</p>
                <p className={`text-xl font-bold ${getLevelColor(user?.level || 1)}`}>
                  {user?.level || 1}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#0B2CB1] bg-[#000000]">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Student
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Level
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  XP
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">
                  Badges
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#CBE9FD]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    No users on the leaderboard yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => {
                  const isCurrentUser = entry.userId === user?._id;
                  return (
                    <tr
                      key={entry.userId}
                      className={`border-b border-[#0B2CB1] transition-colors ${
                        isCurrentUser ? 'bg-[#1951FC]/5 hover:bg-[#1951FC]/10' : 'hover:bg-[#0B2CB1]'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                            isCurrentUser
                              ? 'bg-[#1951FC] text-white'
                              : 'bg-[#0B2CB1] text-[#FFFFFF]'
                          }`}>
                            {entry.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className={`font-medium ${isCurrentUser ? 'text-[#1951FC]' : 'text-[#FFFFFF]'}`}>
                              {entry.name}
                              {isCurrentUser && ' (You)'}
                            </p>
                            <p className="text-xs text-[#5BB8FB]">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${getLevelColor(entry.level || 1)}`}>
                          {entry.level || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[#1951FC]">{entry.xp}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {entry.badges && entry.badges.length > 0 ? (
                            entry.badges.slice(0, 3).map((badge, index) => (
                              <span
                                key={index}
                                className="text-lg"
                                title={badge}
                              >
                                {getBadgeIcon(badge)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#5BB8FB]">-</span>
                          )}
                          {entry.badges && entry.badges.length > 3 && (
                            <span className="text-xs text-[#5BB8FB]">+{entry.badges.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#0B2CB1]">
            <p className="text-sm text-[#5BB8FB] order-2 sm:order-1">
              Showing {leaderboard.length} of {totalUsers} students
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

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#5BB8FB]">
        <div className="flex items-center gap-1">
          <Crown className="w-4 h-4 text-[#3781FC]" />
          <span>Gold</span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-[#CBE9FD]" />
          <span>Silver</span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-[#CBE9FD]" />
          <span>Bronze</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-[#1951FC]" />
          <span>Your rank highlighted</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;