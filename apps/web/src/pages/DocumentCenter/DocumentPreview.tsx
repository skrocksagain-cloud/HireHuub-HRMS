import type * as React from 'react';

interface DocumentPreviewProps {
  title: string;
  children: React.ReactNode;
}

export default function DocumentPreview({ title, children }: DocumentPreviewProps) {
  return (
    <section className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400"
            >
              Print
            </button>
            <button
              type="button"
              disabled
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400"
            >
              Download
            </button>
            <button
              type="button"
              disabled
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400"
            >
              Close
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-8">
        <div className="mx-auto w-full max-w-[210mm] bg-white shadow-sm">
          {children}
        </div>
      </div>
    </section>
  );
}
