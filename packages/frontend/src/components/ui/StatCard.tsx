import React from 'react';
import { Star } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'emerald' | 'info' | 'warning' | 'error';
  rating?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'emerald',
  rating,
}) => {
  const colorMap = {
    emerald: 'border-[#1951FC]/20',
    info: 'border-[#5BB8FB]/20',
    warning: 'border-[#3781FC]/20',
    error: 'border-[#5BB8FB]/20',
  };

  const iconColorMap = {
    emerald: 'text-[#1951FC]',
    info: 'text-[#5BB8FB]',
    warning: 'text-[#3781FC]',
    error: 'text-[#5BB8FB]',
  };

  return (
    <div className={`bg-[#03195B] rounded-xl border ${colorMap[color]} p-6 shadow-sm hover:shadow-[#1951FC]/5 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#CBE9FD]">{title}</p>
          <p className="text-2xl font-bold text-[#FFFFFF] mt-1">{value}</p>
          {rating !== undefined && rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(rating)
                        ? 'fill-[#3781FC] text-[#3781FC]'
                        : 'text-[#0B2CB1]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#5BB8FB]">({rating.toFixed(1)})</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#03195B] border border-[#0B2CB1] ${iconColorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};