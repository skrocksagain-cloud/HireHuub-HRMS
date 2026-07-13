export default function CompanyHeader() {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-300 pb-5 text-slate-800 sm:flex-row sm:items-center sm:justify-between print:gap-4 print:pb-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-slate-400 text-xs font-semibold tracking-[0.18em] text-slate-600 print:h-14 print:w-14">
        LOGO
      </div>

      <div className="space-y-1 text-left sm:text-right">
        <h1 className="text-base font-semibold uppercase tracking-wide text-slate-950 print:text-sm">
          Hire Huub People Solution Private Limited
        </h1>
        <address className="text-sm not-italic leading-6 text-slate-600 print:text-xs print:leading-5">
          Corporate Office, India
          <br />
          +91 00000 00000 · contact@hirehuub.com · www.hirehuub.com
        </address>
      </div>
    </header>
  );
}
