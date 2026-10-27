// packages/frontend/src/layouts/RootLayout.tsx

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BrandLogo } from '../components/BrandLogo';
import {
  Home, BookOpen, Code2, Trophy, User,
  Users, BarChart3, GraduationCap, LogOut, Menu, X,
  LayoutDashboard, ChevronLeft, ChevronRight, FileJson
} from 'lucide-react';

// Student Navigation
const studentNav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
  { to: '/problems', icon: Code2, label: 'Practice Problems' },
  { to: '/sandbox', icon: LayoutDashboard, label: 'Sandbox' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

// Admin Navigation
const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/courses', icon: GraduationCap, label: 'Manage Courses' },
  { to: '/admin/problems', icon: Code2, label: 'Coding Problems' },
  { to: '/admin/problems/import', icon: FileJson, label: 'Bulk Import' },
  { to: '/admin/users', icon: Users, label: 'Students' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export const RootLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : studentNav;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';
  if (!user) return null;

  return (
    <div className="page-orbit min-h-screen flex w-full overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? 'fixed' : 'fixed'}
          top-0 left-0 z-50
          h-screen
          ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${sidebarWidth}
          bg-[#03195B]/88 backdrop-blur-xl
          border-r border-white/20
          flex flex-col
          transition-all duration-300 ease-in-out
          shadow-2xl
        `}
      >
        {/* Branding - Using BrandLogo */}
        <div className={`px-4 h-20 flex items-center border-b border-white/15 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
          {!isCollapsed ? (
            <BrandLogo size="md" showText={true} />
          ) : (
            <BrandLogo size="md" showText={false} />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-full text-sm font-normal transition-all duration-300
                ${isActive
                  ? 'bg-[#1951FC]/45 text-[#CBE9FD] border border-white/30 shadow-[inset_0_1px_4px_rgba(255,255,255,0.25),0_0_22px_rgba(55,129,252,0.26)]'
                  : 'text-[#CBE9FD]/75 hover:bg-[#1951FC]/20 hover:text-[#FFFFFF]'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User + Logout */}
        <div className={`border-t border-white/15 p-4 flex-shrink-0 ${isCollapsed ? 'flex flex-col items-center gap-3' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#1951FC,#5BB8FB)] text-[#03195B] flex items-center justify-center font-medium border border-white/45 shadow-[0_0_18px_rgba(91,184,251,0.4)] flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal text-[#FFFFFF] truncate">{user?.name}</p>
                <p className="text-xs text-[#CBE9FD]/65 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-3 text-sm font-normal text-[#CBE9FD]/75 hover:text-[#FFFFFF] hover:bg-[#1951FC]/20 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 mt-3 text-sm font-normal text-[#CBE9FD]/75 hover:text-[#FFFFFF] hover:bg-[#1951FC]/20 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-24 w-7 h-7 bg-[#0B2CB1] border border-white/35 rounded-full flex items-center justify-center hover:bg-[#1951FC] hover:border-[#CBE9FD] shadow-[0_0_16px_rgba(55,129,252,0.35)] transition-colors z-50"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-[#CBE9FD]" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-[#CBE9FD]" />
            )}
          </button>
        )}
      </aside>

      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-full bg-[#0B2CB1] border border-white/30 shadow-[0_0_20px_rgba(55,129,252,0.35)]"
        >
          {isSidebarOpen ?
            <X className="w-5 h-5 text-[#FFFFFF]" /> :
            <Menu className="w-5 h-5 text-[#FFFFFF]" />
          }
        </button>
      </div>

      {/* Main Content */}
      <main
        className={`
          flex-1 min-w-0 w-full overflow-y-auto
          transition-all duration-300 ease-in-out
          ${!isMobile && !isCollapsed ? 'ml-72' : ''}
          ${!isMobile && isCollapsed ? 'ml-20' : ''}
          ${isMobile ? 'ml-0' : ''}
        `}
        style={{
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div className="w-full min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
