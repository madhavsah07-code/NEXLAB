import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-normal tracking-wide rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CBE9FD] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'glass-button text-white',
    secondary: 'glass-button-secondary text-white',
    outline: 'border border-white/35 text-[#CBE9FD] hover:bg-[#1951FC]/25 hover:text-white',
    ghost: 'text-[#CBE9FD] hover:text-white hover:bg-[#1951FC]/20',
    danger: 'bg-[#0B2CB1] text-white border border-[#5BB8FB]/50 hover:bg-[#1951FC]',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
