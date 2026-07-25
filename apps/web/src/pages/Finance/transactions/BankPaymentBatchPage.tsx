import { Landmark } from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import EmptyState from "../../../ui/EmptyState";
import PageHeader from "../../../ui/PageHeader";

export default function BankPaymentBatchPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Transactions / Bank Payment Batch
      </nav>

      <PageHeader
        title="Bank Payment Batch"
        description="Manage bank payment batches."
      />

      <EmptyState
        icon={<Landmark size={32} />}
        title="Coming Soon"
        description="Bank Payment Batch is under development."
      />
    </DashboardLayout>
  );
}
