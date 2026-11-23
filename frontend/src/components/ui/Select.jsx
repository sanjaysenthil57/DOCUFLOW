import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  className,
  children,
  error,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none text-xs text-slate-900 bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2',
          'focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer',
          error && 'border-rose-300 focus:ring-rose-500 focus:border-rose-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
