import type { CreditNoteStatus } from './CreditNote';
import type { InvoiceStatus } from './Invoice';
import type { ExpenseTransactionStatus } from './Transaction';

export type FinanceReportType =
  | 'invoice'
  | 'credit-note'
  | 'expense'
  | 'outstanding'
  | 'summary';

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface InvoiceReportFilters extends DateRangeFilter {
  clientId?: string;
  status?: InvoiceStatus;
}

export interface CreditNoteReportFilters extends DateRangeFilter {
  clientId?: string;
}

export interface ExpenseReportFilters extends DateRangeFilter {
  expenseCategoryId?: string;
  paidFromId?: string;
  associatePartnerId?: string;
}

export interface OutstandingReportFilters extends DateRangeFilter {
  clientId?: string;
}

export type FinanceSummaryFilters = DateRangeFilter;

export interface InvoiceReportRow {
  id: string;
  invoiceNumber: string;
  client: string;
  clientId: string;
  invoiceDate: string;
  status: InvoiceStatus;
  invoiceAmount: number;
  gst: number;
  totalAmount: number;
}

export interface CreditNoteReportRow {
  id: string;
  creditNoteNumber: string;
  originalInvoice: string;
  client: string;
  clientId: string;
  creditDate: string;
  creditAmount: number;
  reason: string;
  status: CreditNoteStatus;
}

export interface ExpenseReportRow {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  expenseCategory: string;
  associatePartner?: string;
  paidFrom: string;
  amount: number;
  status: ExpenseTransactionStatus;
}

export interface OutstandingReportRow {
  id: string;
  invoiceNumber: string;
  client: string;
  clientId: string;
  invoiceAmount: number;
  creditNotesApplied: number;
  outstandingAmount: number;
  status: InvoiceStatus;
}

export interface FinanceSummary {
  totalInvoices: number;
  totalInvoiceAmount: number;
  totalCreditNotes: number;
  totalExpenses: number;
  outstandingAmount: number;
}

export interface FinanceReportExportPayload {
  reportType: FinanceReportType;
  title: string;
  generatedAt: string;
  columns: string[];
  rows: string[][];
  summary?: FinanceSummary;
}
