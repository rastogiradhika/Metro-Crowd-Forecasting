import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md',         // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const variantStyles = {
    primary:
      'bg-[#0F172A] hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 border border-transparent shadow-xs',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    outline:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent',
    danger:
      'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-xs',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 13 : 16} strokeWidth={1.75} className="animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={1.75} />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={1.75} />
      )}
    </button>
  );
}
