import React from 'react';
import { cn } from '../../utils/cn';

export const Table = ({ className, children, ...props }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
    <table className={cn('w-full text-left text-xs text-slate-700 border-collapse', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ className, children, ...props }) => (
  <thead className={cn('bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-medium text-slate-500 uppercase tracking-wider', className)} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-slate-100', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ className, children, ...props }) => (
  <tr className={cn('hover:bg-slate-50/60 transition-colors duration-100', className)} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ className, children, ...props }) => (
  <th className={cn('px-4 py-2.5 font-medium', className)} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className, children, ...props }) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...props}>
    {children}
  </td>
);

export default Table;
