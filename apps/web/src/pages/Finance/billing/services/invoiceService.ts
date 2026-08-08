import { createElement } from 'react';
import { Timestamp } from 'firebase/firestore';

import { DocumentGenerationService } from '../../../../services/documentGeneration/DocumentGenerationService';
import { documentService } from '../../../../services/document/documentService';
import { storageService } from '../../../../services/document/storageService';
import { auditService } from '../../../../core/audit/auditService';
import { numberToWordsRupees } from '../../../../utils/amountInWords';
import InvoicePdf from '../../../../templates/pdf/InvoicePdf';
import type { BillingCompany } from '../../../../types/BillingCompany';
import type {
  CreateInvoiceDraftInput,
  Invoice,
  InvoiceDocumentStorage,
  InvoiceLineItem,
  InvoiceSnapshot,
  InvoiceStatus,
  InvoiceStatusHistoryEntry,
  PaymentHistoryEntry,
  RecordClientPaymentInput,
  WorkbenchClientInvoiceData,
} from '../../../../types/Invoice';
import { billingService } from './billingService';
import { invoiceRepository } from '../repositories/invoiceRepository';

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const validateDraft = (input: CreateInvoiceDraftInput): void => {
  if (!input.clientId.trim()) throw new Error('A Workbench client reference is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.invoiceDate) || Number.isNaN(Date.parse(`${input.invoiceDate}T00:00:00`))) throw new Error('Invoice date must use YYYY-MM-DD.');
  if (!input.lineItems.length) throw new Error('At least one invoice line item is required.');
  input.lineItems.forEach((item) => {
    if (!item.description.trim() || item.quantity <= 0 || item.unitPrice < 0 || item.gstRate < 0 || item.gstRate > 100) {
      throw new Error('Each invoice line item requires valid description, quantity, price, and GST rate.');
    }
  });
};

const validateClient = (client: WorkbenchClientInvoiceData, clientId: string): void => {
  if (client.clientId !== clientId) throw new Error('Workbench client data does not match the invoice client reference.');
  if (!client.clientName.trim() || !client.billingState.trim() || !client.billingAddress.line1.trim()) {
    throw new Error('Complete billing details are required from Workbench.');
  }
};

const createCompanySnapshot = (company: BillingCompany): InvoiceSnapshot['company'] => ({
  companyName: company.companyName,
  legalName: company.legalName,
  gstin: company.gstin,
  pan: company.pan,
  registeredAddress: company.registeredAddress,
  bankDetails: company.bankDetails,
  authorizedSignatory: company.authorizedSignatory,
});

const safeInvoiceFileName = (invoiceNumber: string): string => invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '_');

class InvoiceService {
  async getInvoiceHistory(): Promise<Invoice[]> {
    return invoiceRepository.getInvoices();
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    if (!id.trim()) return null;
    return invoiceRepository.getInvoice(id);
  }

  async getGeneratedInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.requireInvoice(invoiceId);
    if (!invoice.snapshot || !invoice.document || invoice.status === 'Draft') throw new Error('Credit notes require a generated invoice.');
    return invoice;
  }

  async createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<{ id: string; invoiceNumber: string }> {
    validateDraft(input);
    if (!createdBy.trim()) throw new Error('Invoice creator is required.');

    const calculatedLines = input.lineItems.map((item) => this.calculateLineItem(item));
    const taxableAmount = roundMoney(calculatedLines.reduce((total, item) => total + item.taxableAmount, 0));
    const gstAmount = roundMoney(calculatedLines.reduce((total, item) => total + item.gstAmount, 0));
    const grandTotal = roundMoney(taxableAmount + gstAmount);

    input.taxableAmount = taxableAmount;
    input.gstAmount = gstAmount;
    input.grandTotal = grandTotal;

    if (!input.invoiceNumber) {
      const existingInvoices = await invoiceRepository.getInvoices();
      input.invoiceNumber = await billingService.previewNextInvoiceNumber(new Date(`${input.invoiceDate}T00:00:00`), existingInvoices.length);
    }

    const draftId = await invoiceRepository.createDraft(input, createdBy);

    await auditService.record({
      module: 'Finance',
      action: 'Create Invoice Draft',
      recordId: draftId,
      performedBy: createdBy,
      role: 'Finance',
      newValue: {
        invoiceNumber: input.invoiceNumber,
        clientId: input.clientId,
        invoiceDate: input.invoiceDate,
        taxableAmount,
        gstAmount,
        grandTotal,
        poNumber: input.poNumber || '',
        remarks: input.remarks || '',
      },
      remarks: `Invoice Draft ${input.invoiceNumber} created successfully.`,
    });

    return { id: draftId, invoiceNumber: input.invoiceNumber };
  }

  async updateDraft(invoiceId: string, input: CreateInvoiceDraftInput, updatedBy = 'Finance Admin'): Promise<void> {
    validateDraft(input);
    const invoice = await this.requireInvoice(invoiceId);
    if (invoice.isLocked || invoice.status === 'Paid') {
      throw new Error('Invoice is locked and cannot be edited.');
    }
    if (invoice.status !== 'Draft') throw new Error('Generated invoices are immutable and cannot be edited.');

    const calculatedLines = input.lineItems.map((item) => this.calculateLineItem(item));
    const taxableAmount = roundMoney(calculatedLines.reduce((total, item) => total + item.taxableAmount, 0));
    const gstAmount = roundMoney(calculatedLines.reduce((total, item) => total + item.gstAmount, 0));
    const grandTotal = roundMoney(taxableAmount + gstAmount);

    input.taxableAmount = taxableAmount;
    input.gstAmount = gstAmount;
    input.grandTotal = grandTotal;

    await invoiceRepository.updateDraft(invoice.id, input);

    await auditService.record({
      module: 'Finance',
      action: 'Update Invoice Draft',
      recordId: invoiceId,
      performedBy: updatedBy,
      role: 'Finance',
      remarks: 'Invoice draft updated.',
    });
  }

  async generate(invoiceId: string, client: WorkbenchClientInvoiceData, generatedBy: string): Promise<InvoiceDocumentStorage> {
    const invoice = await this.requireInvoice(invoiceId);
    if (invoice.status !== 'Draft') throw new Error('Only draft invoices can be generated.');
    if (!generatedBy.trim()) throw new Error('Invoice generator is required.');
    validateDraft({ clientId: invoice.clientId, invoiceDate: invoice.invoiceDate, lineItems: invoice.lineItems });
    validateClient(client, invoice.clientId);

    const billingCompany = await billingService.getFixedBillingCompany();
    const gstResolution = await billingService.resolveGst(billingCompany.id, client.billingState);
    const invoiceNumber = await billingService.generateInvoiceNumber(billingCompany.id, new Date(`${invoice.invoiceDate}T00:00:00`));
    const template = await billingService.resolveInvoiceTemplate(billingCompany.id);
    const lineItems = invoice.lineItems.map((item) => this.calculateLineItem(item));
    const taxableAmount = roundMoney(lineItems.reduce((total, item) => total + item.taxableAmount, 0));
    const totalGstAmount = roundMoney(lineItems.reduce((total, item) => total + item.gstAmount, 0));
    const grandTotal = roundMoney(taxableAmount + totalGstAmount);
    const gst = gstResolution.type === 'CGST_SGST'
      ? { type: gstResolution.type, cgstAmount: roundMoney(totalGstAmount / 2), sgstAmount: roundMoney(totalGstAmount / 2), igstAmount: 0, totalGstAmount }
      : { type: gstResolution.type, cgstAmount: 0, sgstAmount: 0, igstAmount: totalGstAmount, totalGstAmount };

    const amountInWords = numberToWordsRupees(grandTotal);

    const snapshot: InvoiceSnapshot = {
      invoiceNumber: invoiceNumber.value,
      invoiceDate: invoice.invoiceDate,
      company: createCompanySnapshot(billingCompany),
      client: { clientId: client.clientId, clientName: client.clientName, gstin: client.gstin, billingAddress: client.billingAddress, billingState: client.billingState },
      lineItems,
      taxableAmount,
      gst,
      grandTotal,
      template: { templateId: template.templateId, templateVersion: template.templateVersion },
      poNumber: invoice.poNumber || '',
      remarks: invoice.remarks || '',
      amountInWords,
    };

    const documentVersion = 1;
    const fileName = `${safeInvoiceFileName(snapshot.invoiceNumber)}.pdf`;
    const generation = await DocumentGenerationService.generate({
      documentType: 'Invoice',
      module: 'Finance',
      referenceId: invoice.id,
      fileName,
      version: documentVersion,
      generatedBy,
      payload: snapshot,
      template: createElement(InvoicePdf, { invoice: snapshot }),
      metadata: { templateId: template.templateId, templateVersion: String(template.templateVersion) },
    });

    if (!generation.success || !generation.document) throw new Error(generation.error ?? 'Unable to generate invoice PDF.');
    const upload = await storageService.upload(generation.document, `finance/invoices/${invoice.id}/v${documentVersion}/${fileName}`);
    const generatedAt = Timestamp.now();

    // Register PDF in Document Center (Single Source of Truth)
    const documentId = await documentService.create({
      documentId: snapshot.invoiceNumber,
      companyId: billingCompany.id,
      branchId: '',
      category: 'Finance',
      module: 'Finance',
      documentType: 'Invoice',
      referenceId: invoice.id,
      title: `Invoice ${snapshot.invoiceNumber}`,
      fileName,
      version: documentVersion,
      status: 'Generated',
      storagePath: upload.storagePath,
      downloadUrl: upload.downloadUrl,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      requiresSignature: false,
      isSigned: false,
      signedBy: '',
      qrCodeUrl: '',
      isLocked: true,
      lockedAt: generatedAt,
      generatedBy,
      generatedAt,
      emailed: false,
      emailedTo: '',
      downloadCount: 0,
      archived: false,
      remarks: `Template ${template.templateId} v${template.templateVersion}`,
      createdBy: generatedBy,
      updatedBy: generatedBy,
    });

    const document: InvoiceDocumentStorage = { documentId, documentVersion, storagePath: upload.storagePath, downloadUrl: upload.downloadUrl, fileSize: upload.fileSize, mimeType: upload.mimeType, generatedAt };
    const statusHistory = [...invoice.statusHistory, this.statusEntry('Generated', generatedBy, 'Invoice generated and registered in Document Center.')];
    await invoiceRepository.completeGeneration(invoice.id, snapshot, document, statusHistory);

    await auditService.record({
      module: 'Finance',
      action: 'Generate Invoice PDF',
      recordId: invoice.id,
      performedBy: generatedBy,
      role: 'Finance',
      newValue: { invoiceNumber: snapshot.invoiceNumber, downloadUrl: upload.downloadUrl, fileSize: upload.fileSize },
      remarks: `Invoice ${snapshot.invoiceNumber} PDF generated.`,
    });

    return document;
  }

  /**
   * Record Client Payment (Immutable Append-Only Ledger Workflow)
   * Formula rules:
   * - TDS = 2% of Invoice Amount (snapshot.grandTotal)
   * - Settlement Value = Amount Received + TDS
   * - Revenue = Amount Received - Candidate Pay
   * - Outstanding Amount = Invoice Amount - Total Settlement Value
   * - Withheld Amount = Invoice Amount - Total Settlement Value
   */
  async recordClientPayment(invoiceId: string, input: RecordClientPaymentInput, actorName: string, role = 'Finance Admin'): Promise<void> {
    const invoice = await this.requireInvoice(invoiceId);
    if (invoice.isLocked || invoice.status === 'Paid') {
      throw new Error('Invoice is locked and fully paid. No further payment entries allowed.');
    }
    if (!input.amountReceived || input.amountReceived <= 0) {
      throw new Error('Amount received must be greater than zero.');
    }

    const invoiceAmount = invoice.snapshot?.grandTotal ?? 0;
    if (invoiceAmount <= 0) {
      throw new Error('Invoice amount is zero. Payment cannot be recorded.');
    }

    // TDS is automatically 2% of Invoice Amount
    const tdsAmount = roundMoney(invoiceAmount * 0.02);
    const amountReceived = roundMoney(input.amountReceived);
    const candidatePay = roundMoney(input.candidatePay ?? 0);
    const settlementValue = roundMoney(amountReceived + tdsAmount);
    const revenue = roundMoney(amountReceived - candidatePay);

    const paymentEntry: PaymentHistoryEntry = {
      paymentId: `PAY-${Date.now()}`,
      paymentDate: input.paymentDate || new Date().toISOString().split('T')[0],
      amountReceived,
      candidatePay,
      tdsAmount,
      settlementValue,
      paymentMode: input.paymentMode,
      transactionReference: input.transactionReference.trim(),
      remarks: input.remarks?.trim() || '',
      createdBy: actorName,
      createdOn: new Date().toISOString(),
    };

    const existingPayments = invoice.payments ?? [];
    const updatedPayments = [...existingPayments, paymentEntry];

    // Cumulative totals
    const totalAmountReceived = roundMoney(updatedPayments.reduce((s, p) => s + p.amountReceived, 0));
    const totalTdsAmount = roundMoney(updatedPayments.reduce((s, p) => s + p.tdsAmount, 0));
    const totalSettlementValue = roundMoney(updatedPayments.reduce((s, p) => s + p.settlementValue, 0));
    const totalCandidatePay = roundMoney(updatedPayments.reduce((s, p) => s + p.candidatePay, 0));
    const totalRevenue = roundMoney(updatedPayments.reduce((s, p) => s + (p.amountReceived - p.candidatePay), 0));

    const outstandingAmount = roundMoney(Math.max(0, invoiceAmount - totalSettlementValue));
    const withheldAmount = roundMoney(Math.max(0, invoiceAmount - totalSettlementValue));

    let newStatus: InvoiceStatus = 'Partially Paid';
    let isLocked = false;

    // Full Settlement Rule
    if (totalSettlementValue >= invoiceAmount) {
      newStatus = 'Paid';
      isLocked = true;
    }

    const newHistoryEntry = this.statusEntry(
      newStatus,
      actorName,
      `Payment recorded: ₹${amountReceived} received (TDS: ₹${tdsAmount}). Total Settlement: ₹${totalSettlementValue} / ₹${invoiceAmount}.`
    );
    const statusHistory = [...invoice.statusHistory, newHistoryEntry];

    await invoiceRepository.recordPayment(invoice.id, {
      payments: updatedPayments,
      totalAmountReceived,
      totalTdsAmount,
      totalSettlementValue,
      totalCandidatePay,
      totalRevenue,
      withheldAmount,
      outstandingAmount,
      status: newStatus,
      isLocked,
      statusHistory,
    });

    await auditService.record({
      module: 'Finance',
      action: 'Record Client Payment',
      recordId: invoice.id,
      performedBy: actorName,
      role,
      newValue: {
        paymentId: paymentEntry.paymentId,
        amountReceived,
        tdsAmount,
        settlementValue,
        candidatePay,
        revenue,
        status: newStatus,
        isLocked,
      },
      remarks: `Recorded client payment of ₹${amountReceived} for Invoice ${invoice.invoiceNumber}. New Status: ${newStatus}.`,
    });
  }

  async updateStatus(invoiceId: string, status: InvoiceStatus, changedBy: string, remarks = ''): Promise<void> {
    const invoice = await this.requireInvoice(invoiceId);
    if (!changedBy.trim()) throw new Error('Status change actor is required.');
    if (invoice.isLocked && status !== 'Paid') {
      throw new Error('Invoice is locked and status cannot be modified.');
    }

    await invoiceRepository.updateStatus(invoice.id, status, [...invoice.statusHistory, this.statusEntry(status, changedBy, remarks.trim())]);

    await auditService.record({
      module: 'Finance',
      action: 'Update Invoice Status',
      recordId: invoiceId,
      performedBy: changedBy,
      role: 'Finance',
      newValue: { status },
      remarks: remarks || `Invoice status changed to ${status}.`,
    });
  }

  private calculateLineItem(input: Invoice['lineItems'][number]): InvoiceLineItem {
    const taxableAmount = roundMoney(input.quantity * input.unitPrice);
    const gstAmount = roundMoney((taxableAmount * input.gstRate) / 100);
    return { ...input, taxableAmount, gstAmount, totalAmount: roundMoney(taxableAmount + gstAmount) };
  }

  private statusEntry(status: InvoiceStatus, changedBy: string, remarks: string): InvoiceStatusHistoryEntry {
    return { status, changedAt: Timestamp.now(), changedBy, remarks };
  }

  private async requireInvoice(id: string): Promise<Invoice> {
    if (!id.trim()) throw new Error('Invoice ID is required.');
    const invoice = await invoiceRepository.getInvoice(id);
    if (!invoice) throw new Error('Invoice was not found.');
    return invoice;
  }
}

export const invoiceService = new InvoiceService();
