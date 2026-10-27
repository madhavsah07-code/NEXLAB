// packages/frontend/src/pages/auth/Login.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Sparkles, Mail, Lock, Eye, EyeOff,
  CheckCircle, ArrowRight, Shield,
  BookOpen, Code2, Users, Trophy,
  ChevronRight, Globe, Zap, Award,
  GraduationCap, Rocket, Star
} from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isTouched, setIsTouched] = useState({ email: false, password: false });
  const [currentFeature, setCurrentFeature] = useState(0);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Auto-rotate carousel features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Interactive Courses',
      description: 'Learn from 120+ expert-led courses with hands-on projects',
      color: 'text-[#1951FC]'
    },
    {
      icon: <Code2 className="w-8 h-8" />,
      title: 'Code Sandbox',
      description: 'Write and test code in 6+ languages with real-time execution',
      color: 'text-[#5BB8FB]'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Gamification',
      description: 'Earn XP, unlock badges, and compete on the leaderboard',
      color: 'text-[#3781FC]'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Learning',
      description: 'Join 15,000+ students and collaborate with peers',
      color: 'text-[#5BB8FB]'
    },
  ];

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (isTouched.email) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (isTouched.password) {
      validatePassword(value);
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setIsTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      validateEmail(email);
    } else {
      validatePassword(password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    setIsTouched({ email: true, password: true });

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid email or password. Please try again.');
    }
  };

  // Test credentials hint
  const testCredentials = {
    student: { email: 'student@gmail.com', password: 'password123' },
    admin: { email: 'admin@gmail.com', password: 'password123' }
  };

  const fillTestCredentials = (role: 'student' | 'admin') => {
    setEmail(testCredentials[role].email);
    setPassword(testCredentials[role].password);
    setEmailError('');
    setPasswordError('');
    setIsTouched({ email: true, password: true });
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1951FC]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5BB8FB]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1951FC]/3 rounded-full blur-3xl" />
      </div>

      {/* Main Login Container */}
      <div className="w-full max-w-5xl bg-[#03195B] rounded-3xl border border-[#0B2CB1] shadow-2xl shadow-[#1951FC]/5 overflow-hidden relative z-10">
        <div className="flex flex-col md:flex-row">
          {/* LEFT PANEL - Branding & Welcome */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-[#1951FC]/10 via-[#000000] to-[#03195B]/5 p-8 md:p-10 lg:p-12 flex flex-col relative min-h-[300px] md:min-h-[500px]">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-10 right-10 w-20 h-20 border border-[#1951FC]/20 rounded-full" />
              <div className="absolute bottom-20 left-10 w-32 h-32 border border-[#1951FC]/20 rounded-full" />
              <div className="absolute top-1/2 right-5 w-12 h-12 border border-[#1951FC]/20 rounded-full" />
              <div className="absolute bottom-10 right-20 w-16 h-16 border border-[#1951FC]/20 rounded-full" />
            </div>

            {/* Logo */}
            <div className="relative z-10">
              <BrandLogo size="md" showText={true} />
            </div>

            {/* Feature Carousel / Visual */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-6 md:py-8">
              <div className="w-full max-w-sm mx-auto">
                {/* Feature Icon */}
                <div className="flex justify-center mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-[#03195B] border border-[#0B2CB1] flex items-center justify-center transition-all duration-500 ${features[currentFeature].color}`}>
                    {features[currentFeature].icon}
                  </div>
                </div>

                {/* Feature Content */}
                <div className="text-center transition-all duration-500">
                  <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-sm text-[#CBE9FD] leading-relaxed">
                    {features[currentFeature].description}
                  </p>
                </div>

                {/* Carousel Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature
                          ? 'w-8 bg-[#1951FC]'
                          : 'bg-[#0B2CB1] hover:bg-[#5BB8FB]'
                      }`}
                      aria-label={`View feature ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Text */}
            <div className="relative z-10 text-center">
              <p className="text-xs text-[#5BB8FB] flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                Secure • Trusted • 15,000+ Students
              </p>
            </div>
          </div>

          {/* RIGHT PANEL - Login Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-10 lg:p-12 bg-[#03195B] flex flex-col justify-center">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF]">
                Welcome Back
              </h2>
              <p className="text-[#CBE9FD] mt-1.5 flex items-center gap-1">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-[#1951FC] hover:text-[#3781FC] font-medium transition-colors inline-flex items-center gap-0.5 group"
                >
                  Create one
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-3.5 bg-[#5BB8FB]/10 border border-[#5BB8FB]/20 rounded-xl text-[#5BB8FB] text-sm flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
                <span className="text-lg mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5BB8FB]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 bg-[#000000] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1951FC]/50 transition-all duration-200 text-[#FFFFFF] placeholder-[#5BB8FB] ${
                      emailError && isTouched.email
                        ? 'border-[#5BB8FB] focus:ring-[#5BB8FB]/50'
                        : 'border-[#0B2CB1] hover:border-[#1951FC]/30'
                    }`}
                    required
                    autoComplete="email"
                  />
                </div>
                {emailError && isTouched.email && (
                  <p className="mt-1.5 text-xs text-[#5BB8FB] flex items-center gap-1 animate-in slide-in-from-top-1 duration-150">
                    <span>⚠️</span> {emailError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5BB8FB]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-12 py-3 bg-[#000000] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1951FC]/50 transition-all duration-200 text-[#FFFFFF] placeholder-[#5BB8FB] ${
                      passwordError && isTouched.password
                        ? 'border-[#5BB8FB] focus:ring-[#5BB8FB]/50'
                        : 'border-[#0B2CB1] hover:border-[#1951FC]/30'
                    }`}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5BB8FB] hover:text-[#CBE9FD] transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && isTouched.password && (
                  <p className="mt-1.5 text-xs text-[#5BB8FB] flex items-center gap-1 animate-in slide-in-from-top-1 duration-150">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#1951FC] border-[#0B2CB1] rounded focus:ring-[#1951FC]/50 bg-[#000000] cursor-pointer"
                  />
                  <span className="text-sm text-[#CBE9FD] group-hover:text-[#FFFFFF] transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#1951FC] hover:text-[#3781FC] transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full py-3.5 text-base font-semibold gap-2 group"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Test Credentials (Dev only) */}
            {import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-[#0B2CB1]">
                <p className="text-xs text-[#5BB8FB] text-center mb-3">Quick Test Login</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('student')}
                    className="flex-1 px-3 py-2 bg-[#000000] border border-[#0B2CB1] rounded-lg text-xs text-[#CBE9FD] hover:text-[#FFFFFF] hover:border-[#1951FC]/30 transition-colors"
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('admin')}
                    className="flex-1 px-3 py-2 bg-[#000000] border border-[#0B2CB1] rounded-lg text-xs text-[#CBE9FD] hover:text-[#FFFFFF] hover:border-[#1951FC]/30 transition-colors"
                  >
                    👑 Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;