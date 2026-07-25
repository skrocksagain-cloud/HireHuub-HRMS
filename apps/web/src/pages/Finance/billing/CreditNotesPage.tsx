import { FileX2 } from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import EmptyState from "../../../ui/EmptyState";
import PageHeader from "../../../ui/PageHeader";

export default function CreditNotesPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Billing / Credit Notes
      </nav>

      <PageHeader
        title="Credit Notes"
        description="Manage billing credit notes."
      />

      <EmptyState
        icon={<FileX2 size={32} />}
        title="Coming Soon"
        description="Credit Notes is under development."
      />
    </DashboardLayout>
  );
}
