import { createElement } from 'react';
import { Timestamp } from 'firebase/firestore';

import { DocumentGenerationService } from '../../../../services/documentGeneration/DocumentGenerationService';
import { documentService } from '../../../../services/document/documentService';
import { storageService } from '../../../../services/document/storageService';
import InvoicePdf from '../../../../templates/pdf/InvoicePdf';
import type { BillingCompany } from '../../../../types/BillingCompany';
import type { CreateInvoiceDraftInput, Invoice, InvoiceDocumentStorage, InvoiceLineItem, InvoiceSnapshot, InvoiceStatus, InvoiceStatusHistoryEntry, WorkbenchClientInvoiceData } from '../../../../types/Invoice';
import { billingService } from './billingService';
import { invoiceRepository } from '../repositories/invoiceRepository';

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const allowedTransitions: Record<Exclude<InvoiceStatus, 'Draft'>, InvoiceStatus[]> = {
  Generated: ['Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  Sent: ['Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  'Partially Paid': ['Paid', 'Overdue', 'Cancelled'],
  Paid: [],
  Overdue: ['Sent', 'Partially Paid', 'Paid', 'Cancelled'],
  Cancelled: [],
};

const validateDraft = (input: CreateInvoiceDraftInput): void => {
  if (!input.clientId.trim()) throw new Error('A Workbench client reference is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.invoiceDate) || Number.isNaN(Date.parse(`${input.invoiceDate}T00:00:00`))) throw new Error('Invoice date must use YYYY-MM-DD.');
  if (!input.lineItems.length) throw new Error('At least one invoice line item is required.');
  input.lineItems.forEach((item) => {
    if (!item.description.trim() || item.quantity <= 0 || item.unitPrice < 0 || item.gstRate < 0 || item.gstRate > 100) throw new Error('Each invoice line item requires valid description, quantity, price, and GST rate.');
  });
};

const validateClient = (client: WorkbenchClientInvoiceData, clientId: string): void => {
  if (client.clientId !== clientId) throw new Error('Workbench client data does not match the invoice client reference.');
  if (!client.clientName.trim() || !client.billingState.trim() || !client.billingAddress.line1.trim()) throw new Error('Complete billing details are required from Workbench.');
};

const createCompanySnapshot = (company: BillingCompany): InvoiceSnapshot['company'] => ({ companyName: company.companyName, legalName: company.legalName, gstin: company.gstin, pan: company.pan, registeredAddress: company.registeredAddress, bankDetails: company.bankDetails, authorizedSignatory: company.authorizedSignatory });

const safeInvoiceFileName = (invoiceNumber: string): string => invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '_');

class InvoiceService {
  async getInvoiceHistory(): Promise<Invoice[]> {
    return invoiceRepository.getInvoices();
  }

  async getGeneratedInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.requireInvoice(invoiceId);
    if (!invoice.snapshot || !invoice.document || invoice.status === 'Draft') throw new Error('Credit notes require a generated invoice.');
    return invoice;
  }

  async createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<string> {
    validateDraft(input);
    if (!createdBy.trim()) throw new Error('Invoice creator is required.');
    return invoiceRepository.createDraft(input, createdBy);
  }

  async updateDraft(invoiceId: string, input: CreateInvoiceDraftInput): Promise<void> {
    validateDraft(input);
    const invoice = await this.requireInvoice(invoiceId);
    if (invoice.status !== 'Draft') throw new Error('Generated invoices are immutable and cannot be edited.');
    await invoiceRepository.updateDraft(invoice.id, input);
  }

  async generate(invoiceId: string, client: WorkbenchClientInvoiceData, generatedBy: string): Promise<void> {
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
    const gst = gstResolution.type === 'CGST_SGST'
      ? { type: gstResolution.type, cgstAmount: roundMoney(totalGstAmount / 2), sgstAmount: roundMoney(totalGstAmount / 2), igstAmount: 0, totalGstAmount }
      : { type: gstResolution.type, cgstAmount: 0, sgstAmount: 0, igstAmount: totalGstAmount, totalGstAmount };
    const snapshot: InvoiceSnapshot = {
      invoiceNumber: invoiceNumber.value,
      invoiceDate: invoice.invoiceDate,
      company: createCompanySnapshot(billingCompany),
      client: { clientId: client.clientId, clientName: client.clientName, gstin: client.gstin, billingAddress: client.billingAddress, billingState: client.billingState },
      lineItems,
      taxableAmount,
      gst,
      grandTotal: roundMoney(taxableAmount + totalGstAmount),
      template: { templateId: template.templateId, templateVersion: template.templateVersion },
    };
    const documentVersion = 1;
    const fileName = `${safeInvoiceFileName(snapshot.invoiceNumber)}.pdf`;
    const generation = await DocumentGenerationService.generate({ documentType: 'Invoice', module: 'Finance', referenceId: invoice.id, fileName, version: documentVersion, generatedBy, payload: snapshot, template: createElement(InvoicePdf, { invoice: snapshot }), metadata: { templateId: template.templateId, templateVersion: String(template.templateVersion) } });
    if (!generation.success || !generation.document) throw new Error(generation.error ?? 'Unable to generate invoice PDF.');
    const upload = await storageService.upload(generation.document, `finance/invoices/${invoice.id}/v${documentVersion}/${fileName}`);
    const generatedAt = Timestamp.now();
    const documentId = await documentService.create({ documentId: snapshot.invoiceNumber, companyId: billingCompany.id, branchId: '', category: 'Finance', module: 'Finance', documentType: 'Invoice', referenceId: invoice.id, title: `Invoice ${snapshot.invoiceNumber}`, fileName, version: documentVersion, status: 'Generated', storagePath: upload.storagePath, downloadUrl: upload.downloadUrl, fileSize: upload.fileSize, mimeType: upload.mimeType, requiresSignature: false, isSigned: false, signedBy: '', qrCodeUrl: '', isLocked: true, lockedAt: generatedAt, generatedBy, generatedAt, emailed: false, emailedTo: '', downloadCount: 0, archived: false, remarks: `Template ${template.templateId} v${template.templateVersion}`, createdBy: generatedBy, updatedBy: generatedBy });
    const document: InvoiceDocumentStorage = { documentId, documentVersion, storagePath: upload.storagePath, downloadUrl: upload.downloadUrl, fileSize: upload.fileSize, mimeType: upload.mimeType, generatedAt };
    const statusHistory = [...invoice.statusHistory, this.statusEntry('Generated', generatedBy, 'Invoice generated and locked.')];
    await invoiceRepository.completeGeneration(invoice.id, snapshot, document, statusHistory);
  }

  async updateStatus(invoiceId: string, status: Exclude<InvoiceStatus, 'Draft' | 'Generated'>, changedBy: string, remarks = ''): Promise<void> {
    const invoice = await this.requireInvoice(invoiceId);
    if (!changedBy.trim()) throw new Error('Status change actor is required.');
    if (!invoice.snapshot || !invoice.document || invoice.status === 'Draft' || !allowedTransitions[invoice.status].includes(status)) throw new Error(`Invoice status cannot transition from ${invoice.status} to ${status}.`);
    await invoiceRepository.updateStatus(invoice.id, status, [...invoice.statusHistory, this.statusEntry(status, changedBy, remarks.trim())]);
  }

  private calculateLineItem(input: Invoice['lineItems'][number]): InvoiceLineItem {
    const taxableAmount = roundMoney(input.quantity * input.unitPrice);
    const gstAmount = roundMoney(taxableAmount * input.gstRate / 100);
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
