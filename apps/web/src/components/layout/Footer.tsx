export default function Footer() {
  return (
    <footer className="mt-auto py-4 px-6 md:px-8 bg-slate-100/70 border-t border-slate-200/80 text-slate-500 text-xs transition">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full font-medium">
        <div>
          <span>© 2026 Hire Huub People Solution Private Limited</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="font-semibold text-slate-700">Hire Huub One • Version 1.0.0</span>
          <span className="text-slate-300">•</span>
          <span className="italic text-emerald-600 font-semibold">The Right People. The Right Job.</span>
        </div>
      </div>
    </footer>
  );
}
