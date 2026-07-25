import type { SummaryCardData } from '../types/finance';

interface SummaryCardProps {
  data: SummaryCardData;
}

export function SummaryCard({ data }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {data.title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-800">
        {data.value}
      </p>

      {data.description && (
        <p className="mt-1 text-xs text-slate-400">
          {data.description}
        </p>
      )}
    </div>
  );
}
