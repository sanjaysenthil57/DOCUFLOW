import React from 'react';

const statusConfig = {
  'Draft': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  'Uploaded': { bg: 'bg-blue-50/60', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500' },
  'AI Processing': { bg: 'bg-purple-50/70', text: 'text-purple-700', border: 'border-purple-200/80', dot: 'bg-purple-500', pulse: true },
  'AI Verification Completed': { bg: 'bg-indigo-50/60', text: 'text-indigo-700', border: 'border-indigo-200/80', dot: 'bg-indigo-500' },
  'AI Issues Found': { bg: 'bg-amber-50/70', text: 'text-amber-800', border: 'border-amber-200/80', dot: 'bg-amber-500' },
  'Pending Expert Review': { bg: 'bg-sky-50/70', text: 'text-sky-700', border: 'border-sky-200/80', dot: 'bg-sky-500' },
  'Expert Reviewing': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300/80', dot: 'bg-sky-600', pulse: true },
  'Correction Required': { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200/80', dot: 'bg-rose-500' },
  'Re-uploaded': { bg: 'bg-cyan-50/70', text: 'text-cyan-700', border: 'border-cyan-200/80', dot: 'bg-cyan-500' },
  'Expert Approved': { bg: 'bg-teal-50/70', text: 'text-teal-700', border: 'border-teal-200/80', dot: 'bg-teal-500' },
  'Expert Rejected': { bg: 'bg-rose-50/80', text: 'text-rose-800', border: 'border-rose-300/80', dot: 'bg-rose-600' },
  'Pending HOD Approval': { bg: 'bg-amber-50/80', text: 'text-amber-800', border: 'border-amber-200/80', dot: 'bg-amber-500' },
  'HOD Approved': { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  'HOD Rejected': { bg: 'bg-rose-100/70', text: 'text-rose-800', border: 'border-rose-300/80', dot: 'bg-rose-600' },
  'Published': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-600' }
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} shrink-0 select-none ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </span>
      <span>{status}</span>
    </span>
  );
}
