// packages/frontend/src/types/api.types.ts

import { IUser } from '@nexlab/shared';

type IProblem = Record<string, unknown>;

type ISubmissionResult = Record<string, unknown>;

export interface AuthResponse {
  success: boolean;
  user: IUser;
  message?: string;
}

export interface ProblemResponse {
  success: boolean;
  data: {
    problem: IProblem;
    userSubmissions: Record<string, unknown>[];
    stats: {
      totalSubmissions: number;
      acceptedSubmissions: number;
      acceptanceRate: number;
    };
  };
}

export interface SubmissionResponse {
  success: boolean;
  data: ISubmissionResult;
}

export interface ProblemListData {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  acceptanceRate?: number;
  totalSubmissions?: number;
  isSolved?: boolean;
  createdAt: string;
  isPublished: boolean;
  starterCode?: any;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  coverImage?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  price: number;
  isPublished: boolean;
  instructor: {
    _id: string;
    name: string;
    email: string;
  };
  enrolledStudents: string[];
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  order: number;
  isFree: boolean;
}

export interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

export interface UserStats {
  totalCourses: number;
  totalCompletedLessons: number;
  totalLessons: number;
  overallProgress: number;
}

export interface UserProfile {
  user: IUser;
  stats: UserStats;
  courseProgress: CourseProgress[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  badges: string[];
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
    userRank: {
      rank: number;
      xp: number;
    } | null;
    total: number;
  };
}