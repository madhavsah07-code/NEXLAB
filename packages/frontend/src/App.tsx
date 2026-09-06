// packages/frontend/src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// ❌ Remove global Monaco setup - only load when needed
// import { setupMonaco } from './lib/monaco-config';
// setupMonaco();

// Layouts
import { RootLayout } from './layouts/RootLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentCourses } from './pages/student/Courses';
import { Sandbox } from './pages/student/Sandbox';
import { Leaderboard } from './pages/student/Leaderboard';
import { Profile } from './pages/student/Profile';
import { CoursePlayer } from './pages/student/CoursePlayer';
import { ProblemsList } from './pages/student/ProblemsList';
import { ProblemDetail } from './pages/student/ProblemDetail';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { CourseForm } from './pages/admin/CourseForm';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminProblems } from './pages/admin/AdminProblems';
import { ProblemForm } from './pages/admin/ProblemForm';
import { AdminBulkImport } from './pages/admin/AdminBulkImport';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly 
}) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0F0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/courses" element={<StudentCourses />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/problems" element={<ProblemsList />} />
          <Route path="/problems/:slug" element={<ProblemDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/course/:courseId" element={<CoursePlayer />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute adminOnly><RootLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/courses/create" element={<CourseForm />} />
          <Route path="/admin/courses/edit/:id" element={<CourseForm />} />
          <Route path="/admin/problems" element={<AdminProblems />} />
          <Route path="/admin/problems/create" element={<ProblemForm />} />
          <Route path="/admin/problems/edit/:problemId" element={<ProblemForm />} />
          <Route path="/admin/problems/import" element={<AdminBulkImport />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;