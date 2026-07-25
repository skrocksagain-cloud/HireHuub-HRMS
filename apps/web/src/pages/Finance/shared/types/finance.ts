// ── Primitive types ──────────────────────────────────────────────────────────

export type ComplianceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Not Due';

export type TrendDirection = 'up' | 'down' | 'neutral';

// ── KPI Card ─────────────────────────────────────────────────────────────────

export interface KpiCardData {
  id: string;
  label: string;
  value: string;
  subLabel?: string;
  trend?: TrendDirection;
}

// ── Summary Card ─────────────────────────────────────────────────────────────

export interface SummaryCardData {
  id: string;
  title: string;
  value: string;
  description?: string;
}

// ── Status Card ──────────────────────────────────────────────────────────────

export interface StatusCardData {
  id: string;
  label: string;
  value: string;
  note?: string;
}

// ── Compliance Card ──────────────────────────────────────────────────────────

export interface ComplianceCardData {
  id: string;
  label: string;
  dueDate: string;
  status: ComplianceStatus;
}

// ── Finance Widget ───────────────────────────────────────────────────────────

export interface FinanceWidget {
  id: string;
  title: string;
  value: string;
  description?: string;
}
