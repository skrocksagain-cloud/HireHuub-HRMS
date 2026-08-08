import { Building2, Receipt, FileCheck, Network, ShieldCheck } from 'lucide-react';
import type { ActivityItem } from '../types/Dashboard';

export interface TimelineProps {
  items: ActivityItem[];
}

export default function Timeline({ items }: TimelineProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Client':
        return <Building2 size={16} className="text-emerald-600" />;
      case 'Finance':
        return <Receipt size={16} className="text-purple-600" />;
      case 'Employee':
        return <FileCheck size={16} className="text-blue-600" />;
      case 'Network':
        return <Network size={16} className="text-amber-600" />;
      default:
        return <ShieldCheck size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200/60 transition"
        >
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0 mt-0.5">
            {getCategoryIcon(item.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{item.timestamp}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
