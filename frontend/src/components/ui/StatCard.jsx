import React from 'react';
import { cn } from '../../utils/cn';

export const StatCard = ({
  label,
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeColor = 'text-blue-700 bg-blue-50 border-blue-200',
  status,
  className,
  style,
  ...props
}) => {
  const displayLabel = label || title || 'Metric';

  const statusBorder = {
    warning: 'border-amber-200/90 hover:border-amber-300',
    success: 'border-emerald-200/90 hover:border-emerald-300',
    danger: 'border-rose-200/90 hover:border-rose-300',
    info: 'border-blue-200/90 hover:border-blue-300'
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon) || (typeof Icon === 'object' && Icon !== null && Icon.type)) {
      return Icon;
    }
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && (Icon.$$typeof === Symbol.for('react.forward_ref') || Icon.render))) {
      const Comp = Icon;
      return <Comp className="w-4 h-4 text-slate-600" />;
    }
    return null;
  };

  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between transition-all duration-150 hover:border-slate-300 min-h-[105px]',
        status && statusBorder[status],
        className
      )}
      style={{ minHeight: '105px', ...style }}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold text-slate-700 leading-tight"
          style={{ color: '#334155', display: 'inline-block' }}
        >
          {displayLabel}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold tracking-tight text-slate-900"
            style={{ color: '#0f172a' }}
          >
            {value !== undefined && value !== null ? value : 0}
          </span>
          {badge && (
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md border', badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        {subtext && (
          <p
            className="text-[11px] text-slate-500 mt-1 font-normal leading-relaxed"
            style={{ color: '#64748b' }}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
