import type { KpiCardData } from '../types/finance';
import { COMING_SOON_LABEL, TREND_COLOR, TREND_LABEL } from '../constants/financeConstants';
import { CurrencyDisplay } from './CurrencyDisplay';

interface KpiCardProps {
  data: KpiCardData;
}

export function KpiCard({ data }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {data.label}
      </p>

      <div className="mt-2 flex items-end justify-between gap-2">
        <CurrencyDisplay amount={data.value} size="lg" />

        {data.trend && (
          <span className={`text-sm font-semibold ${TREND_COLOR[data.trend]}`}>
            {TREND_LABEL[data.trend]}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-400">
        {data.subLabel ?? COMING_SOON_LABEL}
      </p>
    </div>
  );
}
