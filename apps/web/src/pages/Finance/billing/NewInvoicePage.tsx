import { FilePlus } from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import EmptyState from "../../../ui/EmptyState";
import PageHeader from "../../../ui/PageHeader";

export default function NewInvoicePage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Billing / New Invoice
      </nav>

      <PageHeader
        title="New Invoice"
        description="Create a new billing invoice."
      />

      <EmptyState
        icon={<FilePlus size={32} />}
        title="Coming Soon"
        description="The New Invoice form is under development."
      />
    </DashboardLayout>
  );
}
