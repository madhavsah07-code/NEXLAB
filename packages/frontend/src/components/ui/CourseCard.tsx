// packages/frontend/src/components/ui/CourseCard.tsx

import React from 'react';
import { Button } from './Button';
import { BookOpen, Clock, Users, Star } from 'lucide-react';

interface CourseCardProps {
  _id?: string;
  title: string;
  description: string;
  progress?: number;
  thumbnail?: string;
  level?: string;
  category?: string;
  price?: number;
  rating?: number;
  totalReviews?: number;
  enrolledStudents?: number;
  lessonCount?: number;
  onEnroll?: () => void;
  onContinue?: () => void;
  onLearnMore?: () => void;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  _id,
  title,
  description,
  progress = 0,
  thumbnail,
  level,
  category,
  price = 0,
  rating,
  totalReviews = 0,
  enrolledStudents = 0,
  lessonCount = 0,
  onEnroll,
  onContinue,
  onLearnMore,
  isEnrolled = false,
}) => {
  const getLevelColor = (level?: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30',
      intermediate: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
      advanced: 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30',
    };
    return colors[level || ''] || 'bg-[#0B2CB1] text-[#CBE9FD] border-[#0B2CB1]';
  };

  const getLevelDisplay = (level?: string) => {
    if (!level) return 'All Levels';
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // ✅ Format price in INR
  const formatPrice = (amount: number): string => {
    if (amount === 0) return 'Free';
    // Format in Indian Rupees
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-[#03195B] rounded-xl border border-[#0B2CB1] shadow-sm hover:shadow-[#1951FC]/5 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Image Section */}
      <div className="relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-[#1951FC]/20', 'to-[#03195B]/10');
              e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
            }}
          />
        ) : (
          <div className="h-48 bg-gradient-to-br from-[#1951FC]/20 to-[#03195B]/10 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-[#1951FC] opacity-40 fallback-icon" />
          </div>
        )}

        {/* Rating Badge */}
        {rating && rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#000000]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#0B2CB1]">
            <Star className="w-3.5 h-3.5 fill-[#3781FC] text-[#3781FC]" />
            <span className="text-xs font-medium text-[#FFFFFF]">{rating.toFixed(1)}</span>
            <span className="text-xs text-[#5BB8FB]">({totalReviews})</span>
          </div>
        )}

        {/* Price Badge - INR */}
        {price > 0 && (
          <div className="absolute bottom-3 left-3 bg-[#000000]/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-[#0B2CB1]">
            <span className="text-sm font-bold text-[#1951FC]">{formatPrice(price)}</span>
          </div>
        )}

        {price === 0 && !isEnrolled && (
          <div className="absolute bottom-3 left-3 bg-[#000000]/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-[#0B2CB1]">
            <span className="text-sm font-medium text-[#1951FC]">Free</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-2">
          {level && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getLevelColor(level)}`}>
              {getLevelDisplay(level)}
            </span>
          )}
          {category && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0B2CB1] text-[#CBE9FD] border border-[#0B2CB1]">
              {category}
            </span>
          )}
          {lessonCount > 0 && (
            <span className="text-xs text-[#5BB8FB]">• {lessonCount} lessons</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[#FFFFFF] line-clamp-1 group-hover:text-[#1951FC] transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#CBE9FD] mt-1 line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-2 text-xs text-[#5BB8FB]">
          {enrolledStudents > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {enrolledStudents} students
            </span>
          )}
          {lessonCount > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lessonCount} lessons
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#CBE9FD] mb-1">
              <span>Progress</span>
              <span className="text-[#1951FC] font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#000000] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1951FC] to-[#3781FC] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-[#0B2CB1] flex items-center justify-between">
          {isEnrolled ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onContinue}
              className="gap-1 w-full"
            >
              <Clock className="w-3.5 h-3.5" />
              Continue Learning
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Button
                size="sm"
                variant="primary"
                onClick={onEnroll}
                className="flex-1"
              >
                {price === 0 ? 'Enroll Free' : `Enroll ${formatPrice(price)}`}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onLearnMore}
                className="px-3"
              >
                Learn More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;