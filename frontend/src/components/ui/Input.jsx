import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({
  className,
  type = 'text',
  icon: Icon,
  error,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {React.isValidElement(Icon) ? Icon : <Icon className="w-4 h-4 shrink-0" />}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400',
          'focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          Icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
          error && 'border-rose-300 focus:ring-rose-500 focus:border-rose-500',
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  className,
  error,
  rows = 3,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400',
        'focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150',
        'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed px-3 py-2',
        error && 'border-rose-300 focus:ring-rose-500 focus:border-rose-500',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export const Label = ({ className, children, required, ...props }) => (
  <label
    className={cn('block text-xs font-medium text-slate-700 mb-1.5', className)}
    {...props}
  >
    {children}
    {required && <span className="text-rose-500 ml-0.5">*</span>}
  </label>
);

export default Input;
