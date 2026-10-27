import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { BookOpen, Code2, Trophy, Users, Sparkles, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuthStore();

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Courses',
      description: 'Learn from expert-led courses with hands-on projects and real-world applications.',
      color: 'text-[#1951FC]'
    },
    {
      icon: Code2,
      title: 'Code Sandbox',
      description: 'Write and test code in Python, JavaScript, Java, and C++ with real-time execution.',
      color: 'text-[#5BB8FB]'
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Earn XP, level up, and unlock badges as you progress through your learning journey.',
      color: 'text-[#3781FC]'
    },
    {
      icon: Users,
      title: 'Community Learning',
      description: 'Join thousands of students and collaborate on projects and discussions.',
      color: 'text-[#5BB8FB]'
    },
  ];

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1951FC]/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-5xl font-bold text-[#1951FC]">Nex</span>
              <span className="text-5xl font-bold text-[#FFFFFF]">Lab</span>
              <Sparkles className="w-8 h-8 text-[#1951FC] animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[#FFFFFF] mb-6">
              Learn, Code, and Grow
            </h1>
            <p className="text-xl text-[#CBE9FD] max-w-2xl mx-auto mb-8 leading-relaxed">
              Interactive courses with a powerful code sandbox.
              Start your learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button variant="primary" size="lg">
                  <Link to="/dashboard">Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              ) : (
                <>
                  <Button variant="primary" size="lg">
                    <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                  <Button variant="secondary" size="lg">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-[#FFFFFF] text-center mb-12">
          Everything You Need to Learn Coding
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-[#03195B] rounded-xl border border-[#0B2CB1] p-6 shadow-sm hover:shadow-[#1951FC]/5 hover:shadow-lg transition-all duration-300 text-center group">
              <div className={`w-14 h-14 rounded-full bg-[#03195B] border border-[#0B2CB1] flex items-center justify-center mx-auto mb-4 group-hover:border-[#1951FC]/30 transition-colors`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#CBE9FD] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-[#1951FC]/10 to-[#03195B]/5 rounded-2xl p-8 md:p-12 text-center border border-[#1951FC]/20 shadow-lg shadow-[#1951FC]/5">
          <h2 className="text-3xl font-bold text-[#FFFFFF] mb-4">Ready to Start Learning?</h2>
          <p className="text-[#CBE9FD] mb-6 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and start your coding journey today.
          </p>
          <Button variant="primary" size="lg">
            <Link to="/register">Create Free Account <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
};