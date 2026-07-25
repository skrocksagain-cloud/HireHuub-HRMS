import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../ui/PageHeader";
import {
  ComplianceCard,
  DashboardSection,
  KpiCard,
  StatusCard,
  SummaryCard,
} from "./shared/components";
import { CURRENCY_PLACEHOLDER, SECTION_DESCRIPTIONS } from "./shared/constants/financeConstants";
import type {
  ComplianceCardData,
  KpiCardData,
  StatusCardData,
  SummaryCardData,
} from "./shared/types/finance";

// ── Mock data ────────────────────────────────────────────────────────────────

const revenueCards: KpiCardData[] = [
  { id: "invoice-value", label: "Invoice Value", value: CURRENCY_PLACEHOLDER },
  { id: "amount-received", label: "Amount Received", value: CURRENCY_PLACEHOLDER },
  { id: "outstanding-amount", label: "Outstanding Amount", value: CURRENCY_PLACEHOLDER },
];

const expenseCards: KpiCardData[] = [
  { id: "operating-expenses", label: "Operating Expenses", value: CURRENCY_PLACEHOLDER },
  { id: "employee-salary", label: "Employee Salary", value: CURRENCY_PLACEHOLDER },
  { id: "candidate-payroll", label: "Candidate Payroll", value: CURRENCY_PLACEHOLDER },
  { id: "vendor-payments", label: "Vendor Payments", value: CURRENCY_PLACEHOLDER },
];

const taxCards: KpiCardData[] = [
  { id: "gst", label: "GST", value: CURRENCY_PLACEHOLDER },
  { id: "tds", label: "TDS", value: CURRENCY_PLACEHOLDER },
];

const complianceCards: ComplianceCardData[] = [
  { id: "gst-due", label: "GST Due", dueDate: "—", status: "Not Due" },
  { id: "gst-status", label: "GST Filing Status", dueDate: "—", status: "Not Due" },
  { id: "tds-due", label: "TDS Due", dueDate: "—", status: "Not Due" },
  { id: "tds-status", label: "TDS Filing Status", dueDate: "—", status: "Not Due" },
];

const billingCards: SummaryCardData[] = [
  { id: "ready-for-billing", title: "Ready for Billing", value: "0", description: "Candidates pending invoice." },
  { id: "candidates-billed", title: "Candidates Billed", value: "0", description: "Invoiced this period." },
  { id: "pending-billing", title: "Pending Billing", value: "0", description: "Awaiting client confirmation." },
];

const operationsCards: StatusCardData[] = [
  { id: "pending-batches", label: "Pending Bank Payment Batches", value: "0", note: "No batches queued." },
  { id: "outstanding-invoices", label: "Outstanding Invoices", value: "0", note: "All invoices settled." },
  { id: "recent-transactions", label: "Recent Transactions", value: "0", note: "No transactions recorded." },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  return (
    <DashboardLayout>
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        Finance / Dashboard
      </nav>

      <PageHeader
        title="Finance Dashboard"
        description="Overview of financial activity and key metrics."
      />

      <div className="space-y-8">

        {/* Revenue */}
        <DashboardSection
          title="Revenue"
          description={SECTION_DESCRIPTIONS.revenue}
          columns={3}
        >
          {revenueCards.map((card) => (
            <KpiCard key={card.id} data={card} />
          ))}
        </DashboardSection>

        {/* Expenses */}
        <DashboardSection
          title="Expenses"
          description={SECTION_DESCRIPTIONS.expenses}
          columns={4}
        >
          {expenseCards.map((card) => (
            <KpiCard key={card.id} data={card} />
          ))}
        </DashboardSection>

        {/* Tax */}
        <DashboardSection
          title="Tax"
          description={SECTION_DESCRIPTIONS.tax}
          columns={2}
        >
          {taxCards.map((card) => (
            <KpiCard key={card.id} data={card} />
          ))}
        </DashboardSection>

        {/* Compliance */}
        <DashboardSection
          title="Compliance"
          description={SECTION_DESCRIPTIONS.compliance}
          columns={4}
        >
          {complianceCards.map((card) => (
            <ComplianceCard key={card.id} data={card} />
          ))}
        </DashboardSection>

        {/* Billing */}
        <DashboardSection
          title="Billing"
          description={SECTION_DESCRIPTIONS.billing}
          columns={3}
        >
          {billingCards.map((card) => (
            <SummaryCard key={card.id} data={card} />
          ))}
        </DashboardSection>

        {/* Operations */}
        <DashboardSection
          title="Operations"
          description={SECTION_DESCRIPTIONS.operations}
          columns={3}
        >
          {operationsCards.map((card) => (
            <StatusCard key={card.id} data={card} />
          ))}
        </DashboardSection>

      </div>
    </DashboardLayout>
  );
}
