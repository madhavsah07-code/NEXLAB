import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import {
  User, Mail, Award, Zap, BookOpen,
  Flame, TrendingUp, Edit2, Save, X,
  CheckCircle, Clock, Calendar,
  Shield, Crown, Star, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  enrolledCourses: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalCourses: number;
  totalCompletedLessons: number;
  totalLessons: number;
  overallProgress: number;
}

interface CourseProgress {
  courseId: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

export const Profile: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/profile');
      const data = response.data.data;
      setProfile(data.user);
      setStats(data.stats);
      setCourseProgress(data.courseProgress || []);
      setFormData({
        name: data.user.name,
        email: data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaveLoading(true);
    setError('');

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await api.put('/users/profile', updateData);
      await checkAuth();
      await fetchProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  const getBadgeIcon = (badge: string) => {
    const badgeMap: Record<string, { emoji: string; color: string }> = {
      'First Steps': { emoji: '🎓', color: 'bg-[#1951FC]/20 text-[#1951FC]' },
      'Dedicated Learner': { emoji: '📚', color: 'bg-[#5BB8FB]/20 text-[#5BB8FB]' },
      'Master Student': { emoji: '🏆', color: 'bg-[#3781FC]/20 text-[#3781FC]' },
      'Streak Starter': { emoji: '🔥', color: 'bg-[#5BB8FB]/20 text-[#5BB8FB]' },
      'Code Warrior': { emoji: '⚔️', color: 'bg-[#1951FC]/20 text-[#1951FC]' },
      'Quick Learner': { emoji: '⚡', color: 'bg-[#3781FC]/20 text-[#3781FC]' },
      'Level Up!': { emoji: '⬆️', color: 'bg-[#5BB8FB]/20 text-[#5BB8FB]' },
    };
    return badgeMap[badge] || { emoji: '🏅', color: 'bg-[#0B2CB1]/20 text-[#CBE9FD]' };
  };

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'text-[#1951FC]';
    if (level <= 6) return 'text-[#5BB8FB]';
    if (level <= 10) return 'text-[#3781FC]';
    return 'text-[#5BB8FB]';
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-[#CBE9FD]">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[#0B2CB1]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#1951FC]/20 border-2 border-[#1951FC] flex items-center justify-center text-2xl font-bold text-[#1951FC]">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#FFFFFF]">{profile.name}</h1>
            <p className="text-sm text-[#CBE9FD]">{profile.role === 'admin' ? '👑 Administrator' : '🎓 Student'}</p>
          </div>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'secondary'}
          onClick={() => {
            if (isEditing) {
              setFormData({
                name: profile.name,
                email: profile.email,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setError('');
            }
            setIsEditing(!isEditing);
          }}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold text-[#FFFFFF] mb-4">Edit Profile</h2>

          {error && (
            <div className="mb-4 p-3 bg-[#5BB8FB]/10 border border-[#5BB8FB]/20 rounded-lg text-[#5BB8FB] text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB]"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#0B2CB1]">
            <p className="text-sm font-medium text-[#CBE9FD] mb-3">Change Password (optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CBE9FD] mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#000000] border border-[#0B2CB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1951FC] focus:border-[#1951FC] text-[#FFFFFF] placeholder-[#5BB8FB]"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              variant="primary"
              onClick={handleUpdateProfile}
              disabled={saveLoading}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFormData({
                  name: profile.name,
                  email: profile.email,
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                setError('');
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-[#1951FC]/5 transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#CBE9FD]">Total XP</p>
              <p className="text-2xl font-bold text-[#1951FC]">{profile.xp}</p>
            </div>
            <Zap className="w-6 h-6 text-[#1951FC] opacity-60" />
          </div>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-[#1951FC]/5 transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#CBE9FD]">Level</p>
              <p className={`text-2xl font-bold ${getLevelColor(profile.level)}`}>{profile.level}</p>
            </div>
            <Award className={`w-6 h-6 ${getLevelColor(profile.level)} opacity-60`} />
          </div>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-[#1951FC]/5 transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#CBE9FD]">Streak</p>
              <p className="text-2xl font-bold text-[#3781FC]">{profile.streak || 0} days</p>
            </div>
            <Flame className="w-6 h-6 text-[#3781FC] opacity-60" />
          </div>
        </div>
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-[#1951FC]/5 transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#CBE9FD]">Badges</p>
              <p className="text-2xl font-bold text-[#5BB8FB]">{profile.badges?.length || 0}</p>
            </div>
            <Crown className="w-6 h-6 text-[#5BB8FB] opacity-60" />
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Overall Progress */}
        <div className="lg:col-span-2 bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#FFFFFF] mb-4">Learning Progress</h2>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-[#CBE9FD] mb-1.5">
              <span>Overall Progress</span>
              <span className="text-[#1951FC] font-semibold">{stats?.overallProgress || 0}%</span>
            </div>
            <div className="w-full h-2 bg-[#000000] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1951FC] to-[#3781FC] rounded-full transition-all duration-500"
                style={{ width: `${stats?.overallProgress || 0}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-[#000000] rounded-lg">
              <p className="text-2xl font-bold text-[#1951FC]">{stats?.totalCourses || 0}</p>
              <p className="text-xs text-[#5BB8FB]">Enrolled Courses</p>
            </div>
            <div className="text-center p-3 bg-[#000000] rounded-lg">
              <p className="text-2xl font-bold text-[#5BB8FB]">{stats?.totalCompletedLessons || 0}</p>
              <p className="text-xs text-[#5BB8FB]">Completed Lessons</p>
            </div>
            <div className="text-center p-3 bg-[#000000] rounded-lg">
              <p className="text-2xl font-bold text-[#3781FC]">{stats?.totalLessons || 0}</p>
              <p className="text-xs text-[#5BB8FB]">Total Lessons</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#FFFFFF] mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1951FC]" />
            Badges
          </h2>
          {profile.badges && profile.badges.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((badge, index) => {
                const badgeData = getBadgeIcon(badge);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${badgeData.color}`}
                    title={badge}
                  >
                    <span className="text-xl">{badgeData.emoji}</span>
                    <span className="text-xs font-medium">{badge}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#5BB8FB] text-sm">No badges yet. Keep learning to earn badges!</p>
          )}
        </div>
      </div>

      {/* Course Progress */}
      {courseProgress.length > 0 && (
        <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold text-[#FFFFFF] mb-4">Course Progress</h2>
          <div className="space-y-4">
            {courseProgress.map((course) => (
              <div key={course.courseId} className="border-b border-[#0B2CB1] pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#FFFFFF]">{course.title}</span>
                  <span className="text-sm text-[#1951FC]">{course.percentage}%</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#5BB8FB]">
                  <span>{course.completedLessons} of {course.totalLessons} lessons</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#1951FC]" />
                    {course.percentage === 100 ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#000000] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#1951FC] rounded-full transition-all duration-500"
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#FFFFFF] mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#5BB8FB]">Email</p>
            <p className="text-[#FFFFFF]">{profile.email}</p>
          </div>
          <div>
            <p className="text-[#5BB8FB]">Role</p>
            <p className="text-[#FFFFFF] capitalize">{profile.role}</p>
          </div>
          <div>
            <p className="text-[#5BB8FB]">Member Since</p>
            <p className="text-[#FFFFFF]">{new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          <div>
            <p className="text-[#5BB8FB]">Last Updated</p>
            <p className="text-[#FFFFFF]">{new Date(profile.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;