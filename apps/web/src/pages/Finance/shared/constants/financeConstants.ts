import type { ComplianceStatus, TrendDirection } from '../types/finance';

// ── Currency ──────────────────────────────────────────────────────────────────

export const CURRENCY_SYMBOL = '₹';

export const CURRENCY_PLACEHOLDER = '₹0';

// ── Labels ────────────────────────────────────────────────────────────────────

export const COMING_SOON_LABEL = 'Coming Soon';

export const NO_DATA_LABEL = '—';

// ── Compliance status → Badge variant ────────────────────────────────────────

export const COMPLIANCE_STATUS_VARIANT: Record<
  ComplianceStatus,
  'success' | 'warning' | 'danger' | 'secondary'
> = {
  'Paid': 'success',
  'Pending': 'warning',
  'Overdue': 'danger',
  'Not Due': 'secondary',
};

// ── Compliance status → display label ────────────────────────────────────────

export const COMPLIANCE_STATUS_LABEL: Record<ComplianceStatus, string> = {
  'Paid': 'Paid',
  'Pending': 'Pending',
  'Overdue': 'Overdue',
  'Not Due': 'Not Due',
};

// ── Trend direction → display label ──────────────────────────────────────────

export const TREND_LABEL: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  neutral: '—',
};

export const TREND_COLOR: Record<TrendDirection, string> = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  neutral: 'text-slate-400',
};

// ── Default section descriptions ─────────────────────────────────────────────

export const SECTION_DESCRIPTIONS = {
  revenue: 'Invoiced amounts and collection summary.',
  expenses: 'Operational and payroll expenditure summary.',
  tax: 'Current GST and TDS obligations.',
  compliance: 'Upcoming tax filing deadlines and status.',
  billing: 'Client billing pipeline status.',
  operations: 'Pending batches, invoices and recent activity.',
} as const;
