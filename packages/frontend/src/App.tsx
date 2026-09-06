// packages/frontend/src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Layouts
import { RootLayout } from './layouts/RootLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Student Pages - Lazy loaded
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const StudentCourses = React.lazy(() => import('./pages/student/Courses'));
const Sandbox = React.lazy(() => import('./pages/student/Sandbox'));
const Leaderboard = React.lazy(() => import('./pages/student/Leaderboard'));
const Profile = React.lazy(() => import('./pages/student/Profile'));
const CoursePlayer = React.lazy(() => import('./pages/student/CoursePlayer'));
const ProblemsList = React.lazy(() => import('./pages/student/ProblemsList'));
const ProblemDetail = React.lazy(() => import('./pages/student/ProblemDetail'));

// Admin Pages - Lazy loaded
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then(({ AdminDashboard }) => ({
    default: AdminDashboard,
  }))
);
const AdminCourses = React.lazy(() => import('./pages/admin/AdminCourses'));
const CourseForm = React.lazy(() => import('./pages/admin/CourseForm'));
const AdminUsers = React.lazy(() =>
  import('./pages/admin/AdminUsers').then(({ AdminUsers }) => ({
    default: AdminUsers,
  }))
);
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminProblems = React.lazy(() => import('./pages/admin/AdminProblems'));
const ProblemForm = React.lazy(() => import('./pages/admin/ProblemForm'));
const AdminBulkImport = React.lazy(() =>
  import('./pages/admin/AdminBulkImport').then(({ AdminBulkImport }) => ({
    default: AdminBulkImport,
  }))
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly 
}) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// Lazy loading wrapper
const LazyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={<LoadingSpinner fullScreen />}>
    {children}
  </React.Suspense>
);

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<LazyRoute><StudentDashboard /></LazyRoute>} />
            <Route path="/courses" element={<LazyRoute><StudentCourses /></LazyRoute>} />
            <Route path="/sandbox" element={<LazyRoute><Sandbox /></LazyRoute>} />
            <Route path="/problems" element={<LazyRoute><ProblemsList /></LazyRoute>} />
            <Route path="/problems/:slug" element={<LazyRoute><ProblemDetail /></LazyRoute>} />
            <Route path="/leaderboard" element={<LazyRoute><Leaderboard /></LazyRoute>} />
            <Route path="/profile" element={<LazyRoute><Profile /></LazyRoute>} />
            <Route path="/course/:courseId" element={<LazyRoute><CoursePlayer /></LazyRoute>} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute adminOnly><RootLayout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<LazyRoute><AdminDashboard /></LazyRoute>} />
            <Route path="/admin/courses" element={<LazyRoute><AdminCourses /></LazyRoute>} />
            <Route path="/admin/courses/create" element={<LazyRoute><CourseForm /></LazyRoute>} />
            <Route path="/admin/courses/edit/:id" element={<LazyRoute><CourseForm /></LazyRoute>} />
            <Route path="/admin/problems" element={<LazyRoute><AdminProblems /></LazyRoute>} />
            <Route path="/admin/problems/create" element={<LazyRoute><ProblemForm /></LazyRoute>} />
            <Route path="/admin/problems/edit/:problemId" element={<LazyRoute><ProblemForm /></LazyRoute>} />
            <Route path="/admin/problems/import" element={<LazyRoute><AdminBulkImport /></LazyRoute>} />
            <Route path="/admin/users" element={<LazyRoute><AdminUsers /></LazyRoute>} />
            <Route path="/admin/analytics" element={<LazyRoute><AdminAnalytics /></LazyRoute>} />
          </Route>

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;