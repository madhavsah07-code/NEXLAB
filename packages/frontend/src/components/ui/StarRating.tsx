import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  disabled = false,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const handleClick = (value: number) => {
    if (!interactive || disabled) return;
    onRatingChange?.(value);
  };

  const handleMouseEnter = (value: number) => {
    if (!interactive || disabled) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (!interactive || disabled) return;
    setHoverRating(null);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const value = i + 1;
        const isFilled = value <= displayRating;
        const isHalfFilled = value - 0.5 <= displayRating && value > displayRating;

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive || disabled}
            className={`${interactive && !disabled ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-all duration-200`}
          >
            <Star
              className={`${sizes[size]} ${
                isFilled
                  ? 'fill-[#3781FC] text-[#3781FC]'
                  : isHalfFilled
                  ? 'fill-[#3781FC]/50 text-[#3781FC]'
                  : 'text-[#0B2CB1]'
              } transition-colors duration-200`}
            />
          </button>
        );
      })}
    </div>
  );
};