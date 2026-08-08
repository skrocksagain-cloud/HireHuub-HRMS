import { Link } from 'react-router-dom';

export interface QuickActionCardProps {
  title: string;
  to: string;
  icon: React.ReactNode;
  colorScheme?: 'emerald' | 'blue' | 'purple' | 'amber';
}

export default function QuickActionCard({
  title,
  to,
  icon,
  colorScheme = 'emerald',
}: QuickActionCardProps) {
  const schemeStyles = {
    emerald: 'hover:bg-emerald-50/50 hover:border-emerald-200 icon-emerald',
    blue: 'hover:bg-blue-50/50 hover:border-blue-200 icon-blue',
    purple: 'hover:bg-purple-50/50 hover:border-purple-200 icon-purple',
    amber: 'hover:bg-amber-50/50 hover:border-amber-200 icon-amber',
  }[colorScheme];

  const iconBg = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  }[colorScheme];

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 transition duration-200 group text-center ${schemeStyles}`}
    >
      <div
        className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center mb-2.5 group-hover:scale-110 transition duration-200 shadow-xs`}
      >
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-800">{title}</span>
    </Link>
  );
}
