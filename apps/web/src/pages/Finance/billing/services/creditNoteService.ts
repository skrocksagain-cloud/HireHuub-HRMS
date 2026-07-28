import { createElement } from 'react';
import { Timestamp } from 'firebase/firestore';

import { DocumentGenerationService } from '../../../../services/documentGeneration/DocumentGenerationService';
import { documentService } from '../../../../services/document/documentService';
import { storageService } from '../../../../services/document/storageService';
import CreditNotePdf from '../../../../templates/pdf/CreditNotePdf';
import type { CreateCreditNoteDraftInput, CreditNote, CreditNoteDocumentStorage, CreditNoteLineItem, CreditNoteSnapshot, CreditNoteStatus, CreditNoteStatusHistoryEntry } from '../../../../types/CreditNote';
import type { Invoice } from '../../../../types/Invoice';
import { creditNoteRepository } from '../repositories/creditNoteRepository';
import { billingService } from './billingService';
import { invoiceService } from './invoiceService';

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const allowedTransitions: Record<Exclude<CreditNoteStatus, 'Draft'>, CreditNoteStatus[]> = { Generated: ['Issued', 'Cancelled'], Issued: ['Applied', 'Cancelled'], Applied: [], Cancelled: [] };

const validateDraft = (input: CreateCreditNoteDraftInput): void => {
  if (!input.originalInvoiceId.trim()) throw new Error('An original invoice is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.creditDate) || Number.isNaN(Date.parse(`${input.creditDate}T00:00:00`))) throw new Error('Credit date must use YYYY-MM-DD.');
  if (!input.reason.trim()) throw new Error('A credit reason is required.');
  if (input.creditType === 'Partial' && !input.selections?.length) throw new Error('Partial credit notes require at least one line-item selection.');
};

const fileNameFor = (number: string): string => `${number.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;

class CreditNoteService {
  async getCreditNoteHistory(): Promise<CreditNote[]> {
    return creditNoteRepository.getCreditNotes();
  }

  async createDraft(input: CreateCreditNoteDraftInput, createdBy: string): Promise<string> {
    validateDraft(input);
    if (!createdBy.trim()) throw new Error('Credit note creator is required.');
    await invoiceService.getGeneratedInvoice(input.originalInvoiceId);
    return creditNoteRepository.createDraft(input, createdBy);
  }

  async updateDraft(creditNoteId: string, input: CreateCreditNoteDraftInput): Promise<void> {
    validateDraft(input);
    const creditNote = await this.requireCreditNote(creditNoteId);
    if (creditNote.status !== 'Draft') throw new Error('Generated credit notes are immutable and cannot be edited.');
    if (creditNote.originalInvoiceId !== input.originalInvoiceId) throw new Error('The original invoice cannot be changed after credit note creation.');
    await invoiceService.getGeneratedInvoice(input.originalInvoiceId);
    await creditNoteRepository.updateDraft(creditNote.id, input);
  }

  async generate(creditNoteId: string, generatedBy: string): Promise<void> {
    const creditNote = await this.requireCreditNote(creditNoteId);
    if (creditNote.status !== 'Draft') throw new Error('Only draft credit notes can be generated.');
    if (!generatedBy.trim()) throw new Error('Credit note generator is required.');
    validateDraft({ originalInvoiceId: creditNote.originalInvoiceId, creditType: creditNote.creditType, creditDate: creditNote.creditDate, reason: creditNote.reason, selections: creditNote.selections });
    const invoice = await invoiceService.getGeneratedInvoice(creditNote.originalInvoiceId);
    const lineItems = this.createCreditLineItems(creditNote, invoice);
    await this.validateAvailableCredit(invoice, lineItems, creditNote.id);
    const taxableAmount = roundMoney(lineItems.reduce((total, item) => total + item.taxableAmount, 0));
    const totalGstAmount = roundMoney(lineItems.reduce((total, item) => total + item.gstAmount, 0));
    const gst = invoice.snapshot!.gst.type === 'CGST_SGST'
      ? { type: 'CGST_SGST' as const, cgstAmount: roundMoney(totalGstAmount / 2), sgstAmount: roundMoney(totalGstAmount / 2), igstAmount: 0, totalGstAmount }
      : { type: 'IGST' as const, cgstAmount: 0, sgstAmount: 0, igstAmount: totalGstAmount, totalGstAmount };
    const billingCompany = await billingService.getFixedBillingCompany();
    const creditNumber = await billingService.generateCreditNoteNumber(new Date(`${creditNote.creditDate}T00:00:00`));
    const snapshot: CreditNoteSnapshot = { creditNoteNumber: creditNumber.value, creditDate: creditNote.creditDate, reason: creditNote.reason.trim(), creditType: creditNote.creditType, generatedBy, originalInvoiceNumber: invoice.snapshot!.invoiceNumber, originalInvoiceSnapshot: invoice.snapshot!, lineItems, taxableAmount, gst, grandTotal: roundMoney(taxableAmount + totalGstAmount), template: invoice.snapshot!.template };
    const documentVersion = 1;
    const fileName = fileNameFor(snapshot.creditNoteNumber);
    const generation = await DocumentGenerationService.generate({ documentType: 'Credit Note', module: 'Finance', referenceId: creditNote.id, fileName, version: documentVersion, generatedBy, payload: snapshot, template: createElement(CreditNotePdf, { creditNote: snapshot }), metadata: { templateId: snapshot.template.templateId, templateVersion: String(snapshot.template.templateVersion) } });
    if (!generation.success || !generation.document) throw new Error(generation.error ?? 'Unable to generate credit note PDF.');
    const upload = await storageService.upload(generation.document, `finance/credit-notes/${creditNote.id}/v${documentVersion}/${fileName}`);
    const generatedAt = Timestamp.now();
    const documentId = await documentService.create({ documentId: snapshot.creditNoteNumber, companyId: billingCompany.id, branchId: '', category: 'Finance', module: 'Finance', documentType: 'Credit Note', referenceId: creditNote.id, title: `Credit Note ${snapshot.creditNoteNumber}`, fileName, version: documentVersion, status: 'Generated', storagePath: upload.storagePath, downloadUrl: upload.downloadUrl, fileSize: upload.fileSize, mimeType: upload.mimeType, requiresSignature: false, isSigned: false, signedBy: '', qrCodeUrl: '', isLocked: true, lockedAt: generatedAt, generatedBy, generatedAt, emailed: false, emailedTo: '', downloadCount: 0, archived: false, remarks: `Original invoice ${snapshot.originalInvoiceNumber}; template ${snapshot.template.templateId} v${snapshot.template.templateVersion}`, createdBy: generatedBy, updatedBy: generatedBy });
    const document: CreditNoteDocumentStorage = { documentId, documentVersion, storagePath: upload.storagePath, downloadUrl: upload.downloadUrl, fileSize: upload.fileSize, mimeType: upload.mimeType, generatedAt };
    await creditNoteRepository.completeGeneration(creditNote.id, snapshot, document, [...creditNote.statusHistory, this.statusEntry('Generated', generatedBy, 'Credit note generated and locked.')]);
  }

  async updateStatus(creditNoteId: string, status: Exclude<CreditNoteStatus, 'Draft' | 'Generated'>, changedBy: string, remarks = ''): Promise<void> {
    const creditNote = await this.requireCreditNote(creditNoteId);
    if (!changedBy.trim()) throw new Error('Status change actor is required.');
    if (!creditNote.snapshot || !creditNote.document || creditNote.status === 'Draft' || !allowedTransitions[creditNote.status].includes(status)) throw new Error(`Credit note status cannot transition from ${creditNote.status} to ${status}.`);
    await creditNoteRepository.updateStatus(creditNote.id, status, [...creditNote.statusHistory, this.statusEntry(status, changedBy, remarks.trim())]);
  }

  private createCreditLineItems(creditNote: CreditNote, invoice: Invoice): CreditNoteLineItem[] {
    const original = invoice.snapshot!;
    if (creditNote.creditType === 'Full') return original.lineItems.map((item, invoiceLineIndex) => ({ invoiceLineIndex, description: item.description, originalQuantity: item.quantity, creditedQuantity: item.quantity, taxableAmount: item.taxableAmount, gstAmount: item.gstAmount, totalAmount: item.totalAmount }));
    const selected = new Set<number>();
    return creditNote.selections.map((selection) => {
      if (!Number.isInteger(selection.invoiceLineIndex) || selected.has(selection.invoiceLineIndex)) throw new Error('Each invoice line may be selected only once.');
      selected.add(selection.invoiceLineIndex);
      const item = original.lineItems[selection.invoiceLineIndex];
      if (!item || !Number.isFinite(selection.quantity) || selection.quantity <= 0 || selection.quantity > item.quantity) throw new Error('Selected credit quantities must not exceed the original invoice quantity.');
      const factor = selection.quantity / item.quantity;
      const taxableAmount = roundMoney(item.taxableAmount * factor);
      const gstAmount = roundMoney(item.gstAmount * factor);
      return { invoiceLineIndex: selection.invoiceLineIndex, description: item.description, originalQuantity: item.quantity, creditedQuantity: selection.quantity, taxableAmount, gstAmount, totalAmount: roundMoney(taxableAmount + gstAmount) };
    });
  }

  private async validateAvailableCredit(invoice: Invoice, lineItems: CreditNoteLineItem[], currentCreditNoteId: string): Promise<void> {
    const generatedCredits = (await creditNoteRepository.getCreditNotesForInvoice(invoice.id)).filter((note) => note.id !== currentCreditNoteId && note.status !== 'Draft' && note.status !== 'Cancelled' && note.snapshot);
    lineItems.forEach((line) => {
      const previouslyCredited = generatedCredits.reduce((total, note) => total + (note.snapshot!.lineItems.find((item) => item.invoiceLineIndex === line.invoiceLineIndex)?.creditedQuantity ?? 0), 0);
      if (roundMoney(previouslyCredited + line.creditedQuantity) > line.originalQuantity) throw new Error(`Credit quantity exceeds the available balance for invoice line ${line.invoiceLineIndex + 1}.`);
    });
  }

  private statusEntry(status: CreditNoteStatus, changedBy: string, remarks: string): CreditNoteStatusHistoryEntry {
    return { status, changedAt: Timestamp.now(), changedBy, remarks };
  }

  private async requireCreditNote(id: string): Promise<CreditNote> {
    if (!id.trim()) throw new Error('Credit note ID is required.');
    const creditNote = await creditNoteRepository.getCreditNote(id);
    if (!creditNote) throw new Error('Credit note was not found.');
    return creditNote;
  }
}

export const creditNoteService = new CreditNoteService();
