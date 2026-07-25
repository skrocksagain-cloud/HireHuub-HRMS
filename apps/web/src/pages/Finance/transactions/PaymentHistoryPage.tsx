import { History } from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import EmptyState from "../../../ui/EmptyState";
import PageHeader from "../../../ui/PageHeader";

export default function PaymentHistoryPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Transactions / Payment History
      </nav>

      <PageHeader
        title="Payment History"
        description="View historical payment records."
      />

      <EmptyState
        icon={<History size={32} />}
        title="Coming Soon"
        description="Payment History is under development."
      />
    </DashboardLayout>
  );
}
