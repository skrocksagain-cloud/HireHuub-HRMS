import { BarChart3 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../ui/EmptyState";
import PageHeader from "../../ui/PageHeader";

export default function FinanceDashboardPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance
      </nav>

      <PageHeader
        title="Finance Dashboard"
        description="Overview of financial activity and key metrics."
      />

      <EmptyState
        icon={<BarChart3 size={32} />}
        title="Coming Soon"
        description="The Finance Dashboard is under development."
      />
    </DashboardLayout>
  );
}
