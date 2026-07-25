import type { StatusCardData } from '../types/finance';

interface StatusCardProps {
  data: StatusCardData;
}

export function StatusCard({ data }: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {data.label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-800">
        {data.value}
      </p>

      {data.note && (
        <p className="mt-1 text-xs text-slate-400">
          {data.note}
        </p>
      )}
    </div>
  );
}
