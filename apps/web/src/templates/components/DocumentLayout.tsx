import type { ReactNode } from 'react';

interface DocumentLayoutProps {
  children: ReactNode;
}

export default function DocumentLayout({ children }: DocumentLayoutProps) {
  return (
    <main className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-8 text-slate-900 shadow-lg print:max-w-none print:p-[15mm] print:shadow-none sm:p-10">
      {children}
    </main>
  );
}
