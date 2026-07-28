import { createElement } from 'react';

import { DocumentGenerationService } from '../../../../services/documentGeneration/DocumentGenerationService';
import { reactPdfEngine } from '../../../../services/document/pdfService';
import FinanceReportPdf from '../../../../templates/pdf/FinanceReportPdf';
import type {
  CreditNoteReportFilters,
  CreditNoteReportRow,
  ExpenseReportFilters,
  ExpenseReportRow,
  FinanceReportExportPayload,
  FinanceReportType,
  FinanceSummary,
  FinanceSummaryFilters,
  InvoiceReportFilters,
  InvoiceReportRow,
  OutstandingReportFilters,
  OutstandingReportRow,
} from '../../../../types/FinanceReport';
import type { CreditNote } from '../../../../types/CreditNote';
import type { Invoice } from '../../../../types/Invoice';
import type { ExpenseTransaction } from '../../../../types/Transaction';
import { billingService } from '../../billing/services/billingService';
import { creditNoteService } from '../../billing/services/creditNoteService';
import { invoiceService } from '../../billing/services/invoiceService';
import { transactionService } from '../../transactions/services/transactionService';

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const isWithinDateRange = (value: string, startDate?: string, endDate?: string): boolean => {
  if (startDate && value < startDate) return false;
  if (endDate && value > endDate) return false;
  return true;
};

const isGeneratedInvoice = (invoice: Invoice): boolean => Boolean(invoice.snapshot && invoice.status !== 'Draft');

const isGeneratedCreditNote = (note: CreditNote): boolean => Boolean(note.snapshot && note.status !== 'Draft');

class ReportService {
  async getInvoiceReport(filters: InvoiceReportFilters = {}): Promise<InvoiceReportRow[]> {
    const invoices = (await invoiceService.getInvoiceHistory()).filter(isGeneratedInvoice);
    return invoices
      .filter((invoice) => isWithinDateRange(invoice.snapshot!.invoiceDate, filters.startDate, filters.endDate))
      .filter((invoice) => !filters.clientId || invoice.snapshot!.client.clientId === filters.clientId)
      .filter((invoice) => !filters.status || invoice.status === filters.status)
      .map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.snapshot!.invoiceNumber,
        client: invoice.snapshot!.client.clientName,
        clientId: invoice.snapshot!.client.clientId,
        invoiceDate: invoice.snapshot!.invoiceDate,
        status: invoice.status,
        invoiceAmount: invoice.snapshot!.taxableAmount,
        gst: invoice.snapshot!.gst.totalGstAmount,
        totalAmount: invoice.snapshot!.grandTotal,
      }));
  }

  async getCreditNoteReport(filters: CreditNoteReportFilters = {}): Promise<CreditNoteReportRow[]> {
    const creditNotes = (await creditNoteService.getCreditNoteHistory()).filter(isGeneratedCreditNote);
    return creditNotes
      .filter((note) => isWithinDateRange(note.snapshot!.creditDate, filters.startDate, filters.endDate))
      .filter((note) => !filters.clientId || note.snapshot!.originalInvoiceSnapshot.client.clientId === filters.clientId)
      .map((note) => ({
        id: note.id,
        creditNoteNumber: note.snapshot!.creditNoteNumber,
        originalInvoice: note.snapshot!.originalInvoiceNumber,
        client: note.snapshot!.originalInvoiceSnapshot.client.clientName,
        clientId: note.snapshot!.originalInvoiceSnapshot.client.clientId,
        creditDate: note.snapshot!.creditDate,
        creditAmount: note.snapshot!.grandTotal,
        reason: note.snapshot!.reason,
        status: note.status,
      }));
  }

  async getExpenseReport(filters: ExpenseReportFilters = {}): Promise<ExpenseReportRow[]> {
    const expenses = await transactionService.getExpenseHistory();
    return expenses
      .filter((transaction) => isWithinDateRange(transaction.transactionDate, filters.startDate, filters.endDate))
      .filter((transaction) => !filters.expenseCategoryId || transaction.expenseCategoryId === filters.expenseCategoryId)
      .filter((transaction) => !filters.paidFromId || transaction.paidFromId === filters.paidFromId)
      .filter((transaction) => !filters.associatePartnerId || transaction.associatePartnerId === filters.associatePartnerId)
      .map((transaction) => this.toExpenseRow(transaction));
  }

  async getOutstandingReport(filters: OutstandingReportFilters = {}): Promise<OutstandingReportRow[]> {
    const [invoices, creditNotes] = await Promise.all([invoiceService.getInvoiceHistory(), creditNoteService.getCreditNoteHistory()]);
    const creditsByInvoice = this.groupCreditNotesByInvoice(creditNotes);

    return invoices
      .filter(isGeneratedInvoice)
      .filter((invoice) => isWithinDateRange(invoice.snapshot!.invoiceDate, filters.startDate, filters.endDate))
      .filter((invoice) => !filters.clientId || invoice.snapshot!.client.clientId === filters.clientId)
      .map((invoice) => {
        const breakdown = billingService.resolveInvoiceOutstanding(invoice, creditsByInvoice.get(invoice.id) ?? []);
        return {
          id: invoice.id,
          invoiceNumber: invoice.snapshot!.invoiceNumber,
          client: invoice.snapshot!.client.clientName,
          clientId: invoice.snapshot!.client.clientId,
          invoiceAmount: breakdown.invoiceAmount,
          creditNotesApplied: breakdown.creditNotesApplied,
          outstandingAmount: breakdown.outstandingAmount,
          status: invoice.status,
        };
      })
      .filter((row) => row.outstandingAmount > 0);
  }

  async getFinanceSummary(filters: FinanceSummaryFilters = {}): Promise<FinanceSummary> {
    const [invoiceRows, creditNoteRows, expenseRows, outstandingRows] = await Promise.all([
      this.getInvoiceReport(filters),
      this.getCreditNoteReport(filters),
      this.getExpenseReport(filters),
      this.getOutstandingReport(filters),
    ]);

    const appliedCreditNotes = creditNoteRows.filter((row) => row.status === 'Applied');

    return {
      totalInvoices: invoiceRows.length,
      totalInvoiceAmount: roundMoney(invoiceRows.reduce((total, row) => total + row.totalAmount, 0)),
      totalCreditNotes: roundMoney(appliedCreditNotes.reduce((total, row) => total + row.creditAmount, 0)),
      totalExpenses: roundMoney(expenseRows.filter((row) => row.status === 'Completed').reduce((total, row) => total + row.amount, 0)),
      outstandingAmount: roundMoney(outstandingRows.reduce((total, row) => total + row.outstandingAmount, 0)),
    };
  }

  async getFilterOptions(): Promise<{
    clients: Array<{ id: string; name: string }>;
    expenseCategories: Array<{ id: string; name: string }>;
    paymentSources: Array<{ id: string; name: string }>;
    associatePartners: Array<{ id: string; name: string }>;
  }> {
    const [invoices, configuration, associatePartners] = await Promise.all([invoiceService.getInvoiceHistory(), transactionService.getConfiguration(), transactionService.getActiveAssociatePartners()]);
    const clients = new Map<string, string>();

    invoices.filter(isGeneratedInvoice).forEach((invoice) => {
      clients.set(invoice.snapshot!.client.clientId, invoice.snapshot!.client.clientName);
    });

    return {
      clients: [...clients.entries()].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name)),
      expenseCategories: configuration.expenseCategories.map((category) => ({ id: category.id, name: category.name })),
      paymentSources: configuration.paymentSources.map((source) => ({ id: source.id, name: source.name })),
      associatePartners: associatePartners.map((partner) => ({ id: partner.id, name: partner.name })),
    };
  }

  async exportReport(reportType: FinanceReportType, generatedBy: string, filters: InvoiceReportFilters & CreditNoteReportFilters & ExpenseReportFilters & OutstandingReportFilters = {}): Promise<void> {
    if (!generatedBy.trim()) throw new Error('Report exporter is required.');

    const payload = await this.buildExportPayload(reportType, filters);
    const fileName = `${payload.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    const generation = await DocumentGenerationService.generate({
      documentType: 'Finance Report',
      module: 'Finance',
      referenceId: reportType,
      fileName,
      version: 1,
      generatedBy,
      payload,
      template: createElement(FinanceReportPdf, { report: payload }),
    });

    if (!generation.success || !generation.document) throw new Error(generation.error ?? 'Unable to export finance report.');
    await reactPdfEngine.download(generation.document, fileName);
  }

  private async buildExportPayload(reportType: FinanceReportType, filters: InvoiceReportFilters & CreditNoteReportFilters & ExpenseReportFilters & OutstandingReportFilters): Promise<FinanceReportExportPayload> {
    const generatedAt = new Date().toISOString();

    switch (reportType) {
      case 'invoice': {
        const rows = await this.getInvoiceReport(filters);
        return {
          reportType,
          title: 'Invoice Report',
          generatedAt,
          columns: ['Invoice Number', 'Client', 'Invoice Date', 'Status', 'Invoice Amount', 'GST', 'Total Amount'],
          rows: rows.map((row) => [row.invoiceNumber, row.client, row.invoiceDate, row.status, this.formatAmount(row.invoiceAmount), this.formatAmount(row.gst), this.formatAmount(row.totalAmount)]),
        };
      }
      case 'credit-note': {
        const rows = await this.getCreditNoteReport(filters);
        return {
          reportType,
          title: 'Credit Note Report',
          generatedAt,
          columns: ['Credit Note Number', 'Original Invoice', 'Client', 'Credit Date', 'Credit Amount', 'Reason', 'Status'],
          rows: rows.map((row) => [row.creditNoteNumber, row.originalInvoice, row.client, row.creditDate, this.formatAmount(row.creditAmount), row.reason, row.status]),
        };
      }
      case 'expense': {
        const rows = await this.getExpenseReport(filters);
        return {
          reportType,
          title: 'Expense Report',
          generatedAt,
          columns: ['Transaction Number', 'Transaction Date', 'Expense Category', 'Associate Partner', 'Paid From', 'Amount', 'Status'],
          rows: rows.map((row) => [row.transactionNumber, row.transactionDate, row.expenseCategory, row.associatePartner ?? '', row.paidFrom, this.formatAmount(row.amount), row.status]),
        };
      }
      case 'outstanding': {
        const rows = await this.getOutstandingReport(filters);
        return {
          reportType,
          title: 'Outstanding Report',
          generatedAt,
          columns: ['Invoice Number', 'Client', 'Invoice Amount', 'Credit Notes Applied', 'Outstanding Amount', 'Status'],
          rows: rows.map((row) => [row.invoiceNumber, row.client, this.formatAmount(row.invoiceAmount), this.formatAmount(row.creditNotesApplied), this.formatAmount(row.outstandingAmount), row.status]),
        };
      }
      case 'summary': {
        const summary = await this.getFinanceSummary(filters);
        return {
          reportType,
          title: 'Finance Summary',
          generatedAt,
          columns: ['Metric', 'Amount'],
          rows: [
            ['Total Invoices', String(summary.totalInvoices)],
            ['Total Invoice Value', this.formatAmount(summary.totalInvoiceAmount)],
            ['Total Credit Notes', this.formatAmount(summary.totalCreditNotes)],
            ['Total Expenses', this.formatAmount(summary.totalExpenses)],
            ['Outstanding Amount', this.formatAmount(summary.outstandingAmount)],
          ],
          summary,
        };
      }
      default:
        throw new Error('Unsupported finance report type.');
    }
  }

  private groupCreditNotesByInvoice(creditNotes: CreditNote[]): Map<string, CreditNote[]> {
    const grouped = new Map<string, CreditNote[]>();
    creditNotes.forEach((note) => {
      const existing = grouped.get(note.originalInvoiceId) ?? [];
      existing.push(note);
      grouped.set(note.originalInvoiceId, existing);
    });
    return grouped;
  }

  private toExpenseRow(transaction: ExpenseTransaction): ExpenseReportRow {
    return {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      transactionDate: transaction.transactionDate,
      expenseCategory: transaction.expenseCategoryName,
      associatePartner: transaction.associatePartnerName,
      paidFrom: transaction.paidFromName,
      amount: transaction.amount,
      status: transaction.status,
    };
  }

  private formatAmount(value: number): string {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export const reportService = new ReportService();
