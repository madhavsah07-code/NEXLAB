// packages/frontend/src/pages/student/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { ActivityHeatmap } from '../../components/ActivityHeatmap';
import { formatISTDateOnly, getTodayIST } from '../../utils/dateUtils';
import {
  Flame, Zap, Award, BookOpen, TrendingUp, CheckCircle, ArrowRight,
  Code2, Trophy, Target, Calendar, Clock, BarChart3, Brain, Rocket
} from 'lucide-react';

interface EnrolledCourse {
  _id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: any[];
  enrolledStudents: string[];
}

interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

interface ProblemStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export const StudentDashboard: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(true);
  const [problemStats, setProblemStats] = useState<ProblemStats>({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  });
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchProblemStats();
    fetchHeatmapData();
    fetchRecentSubmissions();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userId = user?._id || user?.id;

      let allCourses = [];
      try {
        const response = await api.get('/courses/published');
        allCourses = response.data.data || [];
      } catch (error) {
        console.error('Error fetching courses:', error);
      }

      const enrolled = allCourses.filter((c: any) =>
        c.enrolledStudents?.includes(userId) || user?.enrolledCourses?.includes(c._id)
      );
      setEnrolledCourses(enrolled);

      const progressData: Record<string, CourseProgress> = {};
      for (const course of enrolled) {
        try {
          const progressRes = await api.get(`/courses/${course._id}/progress`);
          progressData[course._id] = progressRes.data.data;
        } catch (e) {
          progressData[course._id] = {
            completedLessons: 0,
            totalLessons: course.lessons?.length || 0,
            percentage: 0,
            completedLessonIds: [],
          };
        }
      }
      setProgressMap(progressData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemStats = async () => {
    try {
      const response = await api.get('/problems/submissions');
      const submissions = response.data.data || [];

      const solvedIds = submissions
        .filter((s: any) => s.status === 'accepted')
        .map((s: any) => s.problemId?._id || s.problemId);

      const uniqueSolved = [...new Set(solvedIds)];

      const problemsRes = await api.get('/problems');
      const allProblems = problemsRes.data.data || [];

      let easy = 0, medium = 0, hard = 0;
      for (const problem of allProblems) {
        if (uniqueSolved.includes(problem._id)) {
          if (problem.difficulty === 'easy') easy++;
          else if (problem.difficulty === 'medium') medium++;
          else if (problem.difficulty === 'hard') hard++;
        }
      }

      setProblemStats({
        totalSolved: uniqueSolved.length,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
      });
    } catch (error) {
      console.error('Error fetching problem stats:', error);
    }
  };

  const fetchHeatmapData = async () => {
    try {
      const response = await api.get('/problems/submissions');
      const submissions = response.data.data || [];

      const dateMap: Record<string, number> = {};
      const now = new Date();

      // ✅ Use IST for date calculations
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);

      const oneYearAgo = new Date(istNow);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      for (let d = new Date(oneYearAgo); d <= istNow; d.setDate(d.getDate() + 1)) {
        const dateStr = formatISTDateOnly(d);
        dateMap[dateStr] = 0;
      }

      for (const sub of submissions) {
        if (sub.status === 'accepted') {
          const date = new Date(sub.createdAt || sub.submittedAt);
          const dateStr = formatISTDateOnly(date);
          if (dateMap[dateStr] !== undefined) {
            dateMap[dateStr]++;
          }
        }
      }

      const heatmapData = Object.entries(dateMap).map(([date, count]) => ({
        date,
        count,
      }));

      setHeatmapData(heatmapData);

      // ✅ Calculate streak using IST dates
      let streak = 0;
      const todayIST = getTodayIST();

      for (let i = 0; i < 365; i++) {
        const date = new Date(istNow);
        date.setDate(date.getDate() - i);
        const dateStr = formatISTDateOnly(date);
        if (dateMap[dateStr] && dateMap[dateStr] > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      setDailyStreak(streak);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const response = await api.get('/problems/submissions');
      const submissions = (response.data.data || []).slice(0, 5);
      setRecentSubmissions(submissions);
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#1951FC]/10 text-[#1951FC] border-[#1951FC]/20',
      intermediate: 'bg-[#5BB8FB]/10 text-[#5BB8FB] border-[#5BB8FB]/20',
      advanced: 'bg-[#3781FC]/10 text-[#3781FC] border-[#3781FC]/20',
    };
    return colors[level] || 'bg-[#1951FC]/10 text-[#1951FC] border-[#1951FC]/20';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') return '✅';
    if (status === 'wrong_answer') return '❌';
    if (status === 'time_limit') return '⏱️';
    return '💥';
  };

  const nextLevelXp = (user?.level || 1) * 100;
  const currentXp = user?.xp || 0;
  const xpProgress = Math.min((currentXp / nextLevelXp) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#000000]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1951FC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[#0B2CB1]">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#FFFFFF]">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm sm:text-base text-[#CBE9FD] mt-1">
            {enrolledCourses.length === 0
              ? "You haven't enrolled in any courses yet. Start learning today!"
              : `You're making great progress! Keep up the momentum.`}
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-3 bg-[#03195B] border border-[#1951FC]/20 rounded-lg px-3 sm:px-4 py-2 flex-shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#1951FC]" />
            <span className="text-sm font-semibold text-[#FFFFFF]">
              {dailyStreak || user.streak || 0} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Total XP"
          value={user?.xp || 0}
          icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#1951FC]" />}
          color="emerald"
        />
        <StatCard
          title="Level"
          value={user?.level || 1}
          icon={<Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB]" />}
          color="info"
        />
        <StatCard
          title="Problems Solved"
          value={problemStats.totalSolved || 0}
          icon={<Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#3781FC]" />}
          color="warning"
        />
        <StatCard
          title="Courses Enrolled"
          value={enrolledCourses.length}
          icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB]" />}
          color="error"
        />
      </div>

      {/* XP Progress Bar */}
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 shadow-sm">
        <div className="flex justify-between text-sm text-[#CBE9FD] mb-1.5">
          <span>Progress to Level {user?.level ? user.level + 1 : 2}</span>
          <span className="text-[#1951FC] font-medium">{currentXp} / {nextLevelXp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-[#000000] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1951FC] to-[#3781FC] rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Problem Solving Progress */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#1951FC]" />
              <h3 className="text-sm font-medium text-[#FFFFFF]">Problem Solving Progress</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-[#000000] rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-[#1951FC]">{problemStats.easySolved || 0}</div>
                <div className="text-xs text-[#5BB8FB]">🟢 Easy</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-[#000000] rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-[#3781FC]">{problemStats.mediumSolved || 0}</div>
                <div className="text-xs text-[#5BB8FB]">🟡 Medium</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-[#000000] rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-[#5BB8FB]">{problemStats.hardSolved || 0}</div>
                <div className="text-xs text-[#5BB8FB]">🔴 Hard</div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="flex justify-between text-xs text-[#5BB8FB] mb-1">
                <span>Total Solved</span>
                <span className="text-[#FFFFFF]">{problemStats.totalSolved || 0} problems</span>
              </div>
              <div className="w-full h-2 bg-[#000000] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1951FC] via-[#3781FC] to-[#5BB8FB] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((problemStats.totalSolved || 0) / 50 * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="overflow-x-auto">
            <ActivityHeatmap data={heatmapData} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#5BB8FB]" />
              <h3 className="text-sm font-medium text-[#FFFFFF]">Recent Activity</h3>
            </div>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-[#5BB8FB] italic">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {recentSubmissions.map((sub, index) => (
                  <div key={index} className="p-3 bg-[#000000] rounded-lg border border-[#0B2CB1]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon(sub.status)}</span>
                        <div>
                          <p className="text-sm font-medium text-[#FFFFFF]">
                            {sub.problemId?.title || 'Problem'}
                          </p>
                          <span className={`text-xs font-medium ${
                            sub.status === 'accepted' ? 'text-[#1951FC]' : 'text-[#5BB8FB]'
                          }`}>
                            {sub.status === 'accepted' ? '✅ Solved' : sub.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[#5BB8FB]">
                        {/* ✅ No date here - keeping it clean */}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#5BB8FB]">
                      <span>Runtime: {sub.runtime || 0}ms</span>
                      <span>Memory: {sub.memory || 0}MB</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Courses Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-[#FFFFFF] flex items-center gap-2">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#1951FC]" />
            My Learning Paths
          </h2>
          {enrolledCourses.length > 0 && (
            <button
              onClick={() => navigate('/courses')}
              className="text-sm text-[#1951FC] hover:text-[#3781FC] cursor-pointer transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-8 sm:p-12 text-center">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[#1951FC] mx-auto mb-4 opacity-40" />
            <p className="text-[#CBE9FD]">You haven't enrolled in any courses yet.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/courses')}
              className="mt-4"
            >
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {enrolledCourses.map((course) => {
              const progress = progressMap[course._id];
              const percentage = progress?.percentage || 0;
              const completed = progress?.completedLessons || 0;
              const total = progress?.totalLessons || course.lessons?.length || 0;

              return (
                <div
                  key={course._id}
                  className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-[#1951FC]/5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        {percentage === 100 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1951FC]/20 text-[#1951FC] font-medium border border-[#1951FC]/20">
                            Completed 🎉
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-[#FFFFFF] truncate">{course.title}</h3>
                      <p className="text-sm text-[#CBE9FD] truncate">{course.description}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-[#CBE9FD] mb-1">
                      <span>{completed} of {total} lessons</span>
                      <span className="text-[#1951FC] font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#000000] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1951FC] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={percentage === 100 ? 'outline' : 'primary'}
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="mt-3 w-full gap-1"
                  >
                    {percentage === 100 ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Review Course
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Continue Learning
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <button
          onClick={() => navigate('/problems')}
          className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-3 sm:p-4 text-center hover:border-[#1951FC] transition-colors"
        >
          <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#1951FC] mx-auto mb-1 sm:mb-2" />
          <span className="text-xs sm:text-sm text-[#FFFFFF]">Practice Problems</span>
        </button>
        <button
          onClick={() => navigate('/courses')}
          className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-3 sm:p-4 text-center hover:border-[#1951FC] transition-colors"
        >
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB] mx-auto mb-1 sm:mb-2" />
          <span className="text-xs sm:text-sm text-[#FFFFFF]">Browse Courses</span>
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-3 sm:p-4 text-center hover:border-[#1951FC] transition-colors"
        >
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#3781FC] mx-auto mb-1 sm:mb-2" />
          <span className="text-xs sm:text-sm text-[#FFFFFF]">Leaderboard</span>
        </button>
        <button
          onClick={() => navigate('/sandbox')}
          className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-3 sm:p-4 text-center hover:border-[#1951FC] transition-colors"
        >
          <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-[#5BB8FB] mx-auto mb-1 sm:mb-2" />
          <span className="text-xs sm:text-sm text-[#FFFFFF]">Code Sandbox</span>
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;