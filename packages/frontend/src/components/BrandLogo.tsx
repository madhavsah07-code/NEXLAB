// packages/frontend/src/components/BrandLogo.tsx

import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  rounded = 'full',
}) => {
  // ✅ Replace this URL with your actual logo URL from ImageKit
  const logoUrl = 'https://ik.imagekit.io/djimomx5ff/NexLab-Logo-100Kb.png';

  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoUrl}
        alt="NexLab Logo"
        className={`${sizes[size]} ${roundedClasses[rounded]} object-cover border border-white/35 shadow-[0_0_20px_rgba(55,129,252,0.4)]`}
      />
      {showText && (
        <div className="flex items-center">
          <span className={`font-normal tracking-tight text-[#5BB8FB] ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
            Nex
          </span>
          <span className={`font-normal tracking-tight text-white ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
            Lab
          </span>
        </div>
      )}
    </Link>
  );
};

export default BrandLogo;
