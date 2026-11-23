import React from 'react';
import { cn } from '../../utils/cn';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are currently no items matching your criteria in the system.',
  action,
  className
}) => {
  return (
    <div
      className={cn(
        'p-8 sm:p-12 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 mb-3">
        {React.isValidElement(Icon) ? Icon : Icon ? <Icon className="w-5 h-5 text-slate-400" /> : null}
      </div>
      <h4 className="text-xs font-semibold text-slate-800 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal font-normal">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
