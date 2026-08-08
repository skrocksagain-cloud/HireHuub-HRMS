export interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  actionSlot?: React.ReactNode;
}

export default function SectionHeader({ title, icon, subtitle, actionSlot }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
          {icon && <span className="text-emerald-600">{icon}</span>}
          <span>{title}</span>
        </h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
      </div>
      {actionSlot && <div>{actionSlot}</div>}
    </div>
  );
}
