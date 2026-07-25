import type { ReactNode } from 'react';
import { Banknote } from 'lucide-react';

interface FinanceEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function FinanceEmptyState({
  title = 'No Data Available',
  description = 'Finance data will appear here once available.',
  icon,
}: FinanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        {icon ?? <Banknote size={28} />}
      </div>

      <h3 className="text-base font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 max-w-xs text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}
