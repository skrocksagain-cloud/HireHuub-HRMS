interface DocumentGenerationProgressProps {
  open: boolean;
  currentStep: string;
  progress: number;
}

const DEFAULT_STEPS = [
  'Preparing document',
  'Generating PDF',
  'Uploading to Storage',
  'Saving Metadata',
  'Completed',
];

export default function DocumentGenerationProgress({
  open,
  currentStep,
  progress,
}: DocumentGenerationProgressProps) {
  return (
    <section
      aria-hidden={!open}
      className={`mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${
        open ? '' : 'hidden'
      }`}
    >
      <h2 className="text-lg font-semibold text-slate-900">Generating Document...</h2>

      <div className="mt-6">
        <progress
          aria-label="Document generation progress"
          className="h-2 w-full overflow-hidden rounded-full accent-slate-700"
          max={100}
          value={progress}
        >
          {progress}%
        </progress>
        <div className="mt-3 flex items-center justify-between gap-4 text-sm">
          <p className="font-medium text-slate-700">{currentStep}</p>
          <p className="shrink-0 font-semibold text-slate-900">{progress}%</p>
        </div>
      </div>

      <ol className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
        {DEFAULT_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
