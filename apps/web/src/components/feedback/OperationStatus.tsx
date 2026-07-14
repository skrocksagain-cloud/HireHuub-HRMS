export interface OperationStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  progress?: number;
  currentStep?: string;
}

const STATUS_PRESENTATION: Record<
  OperationStatusProps['status'],
  { container: string; icon: string; symbol: string }
> = {
  idle: {
    container: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: 'bg-slate-200 text-slate-700',
    symbol: '○',
  },
  loading: {
    container: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: 'bg-blue-100 text-blue-700',
    symbol: '…',
  },
  success: {
    container: 'border-green-200 bg-green-50 text-green-800',
    icon: 'bg-green-100 text-green-700',
    symbol: '✓',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-800',
    icon: 'bg-red-100 text-red-700',
    symbol: '×',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'bg-amber-100 text-amber-700',
    symbol: '!',
  },
  info: {
    container: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    icon: 'bg-indigo-100 text-indigo-700',
    symbol: 'i',
  },
};

export default function OperationStatus({
  status,
  title,
  message,
  progress,
  currentStep,
}: OperationStatusProps) {
  const presentation = STATUS_PRESENTATION[status];

  return (
    <section
      aria-live={status === 'loading' ? 'polite' : undefined}
      className={`w-full rounded-xl border p-5 ${presentation.container}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${presentation.icon}`}
        >
          {presentation.symbol}
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {message ? <p className="mt-1 text-sm opacity-90">{message}</p> : null}
        </div>
      </div>

      {progress !== undefined ? (
        <div className="mt-4">
          <progress
            aria-label="Operation progress"
            className="h-2 w-full overflow-hidden rounded-full accent-current"
            max={100}
            value={progress}
          >
            {progress}%
          </progress>
          <p className="mt-2 text-right text-sm font-medium">{progress}%</p>
        </div>
      ) : null}

      {currentStep ? <p className="mt-3 text-sm font-medium">{currentStep}</p> : null}
    </section>
  );
}
