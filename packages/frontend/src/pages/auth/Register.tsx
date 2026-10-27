// packages/frontend/src/pages/auth/Register.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Sparkles, Mail, Lock, Eye, EyeOff,
  User, ArrowRight, Shield, CheckCircle,
  BookOpen, Code2, Users, Trophy, Rocket
} from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isTouched, setIsTouched] = useState({ name: false, email: false, password: false });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validateName = (value: string) => {
    if (!value) {
      setNameError('Name is required');
      return false;
    }
    if (value.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

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

  const handleBlur = (field: 'name' | 'email' | 'password') => {
    setIsTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'name') validateName(name);
    else if (field === 'email') validateEmail(email);
    else validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    setIsTouched({ name: true, email: true, password: true });

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service');
      return;
    }

    const result = await register(name, email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1951FC]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5BB8FB]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1951FC]/3 rounded-full blur-3xl" />
      </div>

      {/* Main Register Container */}
      <div className="w-full max-w-5xl bg-[#03195B] rounded-3xl border border-[#0B2CB1] shadow-2xl shadow-[#1951FC]/5 overflow-hidden relative z-10">
        <div className="flex flex-col md:flex-row">
          {/* LEFT PANEL - Branding */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-[#1951FC]/10 via-[#000000] to-[#03195B]/5 p-8 md:p-10 lg:p-12 flex flex-col relative min-h-[250px] md:min-h-[500px]">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-10 right-10 w-20 h-20 border border-[#1951FC]/20 rounded-full" />
              <div className="absolute bottom-20 left-10 w-32 h-32 border border-[#1951FC]/20 rounded-full" />
              <div className="absolute top-1/2 right-5 w-12 h-12 border border-[#1951FC]/20 rounded-full" />
              <div className="absolute bottom-10 right-20 w-16 h-16 border border-[#1951FC]/20 rounded-full" />
            </div>

            <div className="relative z-10">
              <BrandLogo size="md" showText={true} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-6 md:py-8">
              <div className="w-full max-w-sm mx-auto text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#03195B] border border-[#0B2CB1] flex items-center justify-center mx-auto mb-6 text-[#1951FC]">
                  <Rocket className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">
                  Start Your Journey
                </h3>
                <p className="text-sm text-[#CBE9FD] leading-relaxed">
                  Join 15,000+ students and start learning today
                </p>
                <div className="flex justify-center gap-6 mt-6 text-xs text-[#5BB8FB]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-[#1951FC]" />
                    Free forever
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-[#1951FC]" />
                    No credit card
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-center">
              <p className="text-xs text-[#5BB8FB] flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                Secure • Trusted • 15,000+ Students
              </p>
            </div>
          </div>

          {/* RIGHT PANEL - Register Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-10 lg:p-12 bg-[#03195B] flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF]">
                Create Account
              </h2>
              <p className="text-[#CBE9FD] mt-1.5 flex items-center gap-1">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#1951FC] hover:text-[#3781FC] font-medium transition-colors inline-flex items-center gap-0.5 group"
                >
                  Sign in
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-[#5BB8FB]/10 border border-[#5BB8FB]/20 rounded-xl text-[#5BB8FB] text-sm flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
                <span className="text-lg mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#CBE9FD] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5BB8FB]" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-3 bg-[#000000] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1951FC]/50 transition-all duration-200 text-[#FFFFFF] placeholder-[#5BB8FB] ${
                      nameError && isTouched.name
                        ? 'border-[#5BB8FB] focus:ring-[#5BB8FB]/50'
                        : 'border-[#0B2CB1] hover:border-[#1951FC]/30'
                    }`}
                    required
                    autoComplete="name"
                  />
                </div>
                {nameError && isTouched.name && (
                  <p className="mt-1.5 text-xs text-[#5BB8FB] flex items-center gap-1">
                    <span>⚠️</span> {nameError}
                  </p>
                )}
              </div>

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
                    onChange={(e) => setEmail(e.target.value)}
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
                  <p className="mt-1.5 text-xs text-[#5BB8FB] flex items-center gap-1">
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
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Create a password"
                    className={`w-full pl-10 pr-12 py-3 bg-[#000000] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1951FC]/50 transition-all duration-200 text-[#FFFFFF] placeholder-[#5BB8FB] ${
                      passwordError && isTouched.password
                        ? 'border-[#5BB8FB] focus:ring-[#5BB8FB]/50'
                        : 'border-[#0B2CB1] hover:border-[#1951FC]/30'
                    }`}
                    required
                    autoComplete="new-password"
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
                  <p className="mt-1.5 text-xs text-[#5BB8FB] flex items-center gap-1">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-[#1951FC] border-[#0B2CB1] rounded focus:ring-[#1951FC]/50 bg-[#000000] cursor-pointer"
                  id="terms"
                />
                <label htmlFor="terms" className="text-sm text-[#CBE9FD]">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#1951FC] hover:text-[#3781FC] transition-colors">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#1951FC] hover:text-[#3781FC] transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full py-3.5 text-base font-semibold gap-2 group"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;