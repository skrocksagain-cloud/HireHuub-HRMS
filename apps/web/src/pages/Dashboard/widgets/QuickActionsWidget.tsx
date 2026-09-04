import { TrendingUp, UserPlus, Briefcase, FileText, Plus } from 'lucide-react';
import QuickActionCard from '../../../ui/QuickActionCard';
import { usePermissions } from '../../../hooks/usePermissions';

export default function QuickActionsWidget() {
  const { canCreate } = usePermissions();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          <span className="font-bold text-slate-900 text-xs">Permission-Based Quick Actions</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Workflows</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {canCreate('employees') && (
          <QuickActionCard title="Add Employee" to="/employees" icon={<UserPlus size={18} />} colorScheme="emerald" />
        )}
        {canCreate('openings') && (
          <QuickActionCard title="Create Opening" to="/workbench/staffing-hub/openings" icon={<Briefcase size={18} />} colorScheme="amber" />
        )}
        {canCreate('invoice') && (
          <QuickActionCard title="New Invoice" to="/finance/billing/invoices" icon={<FileText size={18} />} colorScheme="blue" />
        )}
        {canCreate('documents') && (
          <QuickActionCard title="Upload Document" to="/documents" icon={<Plus size={18} />} colorScheme="purple" />
        )}
      </div>
    </div>
  );
}
