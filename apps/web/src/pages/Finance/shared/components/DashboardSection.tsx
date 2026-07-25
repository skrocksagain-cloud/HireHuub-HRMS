import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  description?: string;
  columns?: 2 | 3 | 4;
  children: ReactNode;
}

const columnClass: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function DashboardSection({
  title,
  description,
  columns = 3,
  children,
}: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">
          {title}
        </h2>

        {description && (
          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className={`grid gap-4 ${columnClass[columns]}`}>
        {children}
      </div>
    </section>
  );
}
