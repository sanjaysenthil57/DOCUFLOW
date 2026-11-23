import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, hoverable = false, ...props }) => (
  <div
    className={cn(
      'bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden transition-all duration-150',
      hoverable && 'hover:border-slate-300 hover:shadow-xs',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div
    className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3
    className={cn('text-sm font-semibold text-slate-900 tracking-tight leading-snug', className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p
    className={cn('text-xs text-slate-500 font-normal leading-normal mt-0.5', className)}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div
    className={cn('px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3', className)}
    {...props}
  >
    {children}
  </div>
);

export default Card;
