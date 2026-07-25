import { ArrowLeftRight } from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import EmptyState from "../../../ui/EmptyState";
import PageHeader from "../../../ui/PageHeader";

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Transactions / Transactions
      </nav>

      <PageHeader
        title="Transactions"
        description="View and manage financial transactions."
      />

      <EmptyState
        icon={<ArrowLeftRight size={32} />}
        title="Coming Soon"
        description="Transactions is under development."
      />
    </DashboardLayout>
  );
}
