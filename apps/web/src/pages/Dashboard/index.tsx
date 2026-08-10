import DashboardLayout from '../../layouts/DashboardLayout';
import { useDashboard } from '../../hooks/useDashboard';
import { usePermissions } from '../../hooks/usePermissions';
import { dashboardRegistry } from './dashboardRegistry';

export default function DashboardHostPage() {
  const { activeRole } = usePermissions();
  const dashboard = useDashboard();

  if (dashboard.isLoading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs font-bold text-slate-400">
          Loading Enterprise Workspace…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {dashboardRegistry.renderDashboard(activeRole, dashboard)}
    </DashboardLayout>
  );
}