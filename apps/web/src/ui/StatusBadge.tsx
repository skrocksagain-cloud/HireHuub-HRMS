export interface StatusBadgeProps {
  status: string;
  variant?: 'active' | 'inactive' | 'pending' | 'urgent' | 'success' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, variant = 'neutral', size = 'sm' }: StatusBadgeProps) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${styles} ${sizeClasses}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{status}</span>
    </span>
  );
}
