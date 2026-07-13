export default function SignatureBlock() {
  return (
    <section className="mt-12 w-full max-w-xs text-sm text-slate-700 print:mt-10 print:text-xs">
      <p className="font-semibold uppercase tracking-wide text-slate-900">
        Authorized Signatory
      </p>
      <div className="mt-12 border-t border-slate-500 pt-2">
        <p className="font-medium text-slate-900">[Name]</p>
        <p className="mt-1 text-slate-600">[Designation]</p>
        <p className="mt-1 text-slate-600">Date: [DD/MM/YYYY]</p>
      </div>
    </section>
  );
}
