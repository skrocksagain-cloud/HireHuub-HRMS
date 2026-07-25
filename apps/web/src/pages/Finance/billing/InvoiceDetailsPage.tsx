import { FileText } from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import EmptyState from "../../../ui/EmptyState";
import PageHeader from "../../../ui/PageHeader";

export default function InvoiceDetailsPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Billing / Invoice Details
      </nav>

      <PageHeader
        title="Invoice Details"
        description="View and manage invoice details."
      />

      <EmptyState
        icon={<FileText size={32} />}
        title="Coming Soon"
        description="Invoice Details is under development."
      />
    </DashboardLayout>
  );
}
