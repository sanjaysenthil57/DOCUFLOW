import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-normal transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-900 shadow-2xs',
    brand: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-2xs',
    secondary: 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus:ring-slate-400 shadow-2xs',
    outline: 'bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 focus:ring-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-2xs',
    dangerOutline: 'bg-transparent text-rose-600 border border-rose-200 hover:bg-rose-50 active:bg-rose-100 focus:ring-rose-400'
  };

  const sizes = {
    sm: 'text-xs h-7 px-2.5 rounded-md gap-1.5',
    md: 'text-xs h-8.5 px-3.5 rounded-lg gap-2',
    lg: 'text-sm h-10 px-4 rounded-lg gap-2',
    icon: 'h-8 w-8 rounded-lg p-0 flex items-center justify-center'
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : React.isValidElement(Icon) || (Icon && typeof Icon === 'object' && Icon.type) ? (
        Icon
      ) : typeof Icon === 'function' || (Icon && typeof Icon === 'object' && (Icon.$$typeof === Symbol.for('react.forward_ref') || Icon.render)) ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
