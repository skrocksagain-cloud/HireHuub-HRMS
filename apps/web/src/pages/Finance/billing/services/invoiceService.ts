import { Timestamp } from 'firebase/firestore';
import { documentService } from '../../../../services/document/documentService';
import { storageService } from '../../../../services/document/storageService';
import { AutomationService } from '../../../../services/automation/automationService';
import { auditService } from '../../../../core/audit/auditService';
import { numberToWordsRupees } from '../../../../utils/amountInWords';
import { invoiceTemplateService } from './invoiceTemplateService';
import { adminService } from '../../../../services/admin/adminService';
import { clientService } from '../../../Workbench/Network/clients/services/clientService';
import type { CompanySignatoryV2 } from '../../../../types/Admin';
import type { BillingCompany } from '../../../../types/BillingCompany';
import type {
  CreateInvoiceDraftInput,
  HireHuubTemplateType,
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
import type { FinanceAuthorizationContext } from '../../../../core/authorization/financeAuthorization';

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const validateDraft = (input: CreateInvoiceDraftInput): void => {
  if (!input.clientId.trim()) throw new Error('A Workbench client reference is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.invoiceDate) || Number.isNaN(Date.parse(`${input.invoiceDate}T00:00:00`))) throw new Error('Invoice date must use YYYY-MM-DD.');
  if (!input.lineItems.length) throw new Error('At least one invoice line item is required.');

  input.lineItems.forEach((item) => {
    if (!item.description.trim() || item.gstRate < 0 || item.gstRate > 100) {
      throw new Error('Each invoice line item requires valid description and GST rate.');
    }
    // HSN Validation: Only 998519 is valid if entered
    if (item.hsn && item.hsn.trim() && item.hsn.trim() !== '998519') {
      throw new Error('Invalid HSN code. Hire Huub manpower supply invoices require HSN 998519.');
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
  async getInvoiceHistory(actor: FinanceAuthorizationContext): Promise<Invoice[]> {
    return invoiceRepository.getInvoices(actor);
  }

  async getInvoice(id: string, actor: FinanceAuthorizationContext): Promise<Invoice | null> {
    if (!id.trim()) return null;
    return invoiceRepository.getInvoice(id, actor);
  }

  async getGeneratedInvoice(invoiceId: string, actor: FinanceAuthorizationContext): Promise<Invoice> {
    const invoice = await this.requireInvoice(invoiceId, actor);
    if (!invoice.snapshot || !invoice.document || invoice.status === 'Draft') throw new Error('Credit notes require a generated invoice.');
    return invoice;
  }

  async createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<{ id: string; invoiceNumber: string }> {
    validateDraft(input);
    if (!createdBy.trim()) throw new Error('Invoice creator is required.');

    const calculatedLines = input.lineItems.map((item) => this.calculateLineItem(item, input.templateType));
    const taxableAmount = roundMoney(calculatedLines.reduce((total, item) => total + item.taxableAmount, 0));
    const gstAmount = roundMoney(calculatedLines.reduce((total, item) => total + item.gstAmount, 0));
    const grandTotal = roundMoney(taxableAmount + gstAmount);

    input.taxableAmount = taxableAmount;
    input.gstAmount = gstAmount;
    input.grandTotal = grandTotal;

    if (!input.invoiceNumber) {
      const existingInvoices: Invoice[] = [];
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

  async updateDraft(invoiceId: string, input: CreateInvoiceDraftInput, updatedBy: string, actor: FinanceAuthorizationContext): Promise<void> {
    validateDraft(input);
    const invoice = await this.requireInvoice(invoiceId, actor);
    if (invoice.isLocked || invoice.status === 'Approved' || invoice.status === 'Paid') {
      throw new Error('Invoice is locked after approval and cannot be edited.');
    }

    const calculatedLines = input.lineItems.map((item) => this.calculateLineItem(item, input.templateType || invoice.templateType));
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

  async generate(invoiceId: string, client: WorkbenchClientInvoiceData, generatedBy: string, actor: FinanceAuthorizationContext): Promise<InvoiceDocumentStorage> {
    const invoice = await this.requireInvoice(invoiceId, actor);
    if (invoice.isLocked || invoice.status === 'Approved' || invoice.status === 'Paid') {
      throw new Error('Invoice is locked after approval and cannot be regenerated.');
    }
    if (!generatedBy.trim()) throw new Error('Invoice generator is required.');
    validateDraft({ clientId: invoice.clientId, invoiceDate: invoice.invoiceDate, lineItems: invoice.lineItems, templateType: invoice.templateType });
    validateClient(client, invoice.clientId);

    const billingCompany = await billingService.getFixedBillingCompany();
    const gstResolution = await billingService.resolveGst(billingCompany.id, client.billingState);
    const invoiceNumber = invoice.snapshot?.invoiceNumber
      ? { value: invoice.snapshot.invoiceNumber, financialYear: '', sequence: 0 }
      : await billingService.generateInvoiceNumber(billingCompany.id, new Date(`${invoice.invoiceDate}T00:00:00`));
    // ── Resolve Authoritative Template Type ─────────────────────────
    const fullClient = await clientService.getClientById(invoice.clientId);
    if (!fullClient) {
      throw new Error(`Client record for ID '${invoice.clientId}' not found. Cannot resolve invoice template.`);
    }

    const clientTemplateRef = fullClient.invoiceConfig?.templateReference || 'All';
    let resolvedTemplateType: HireHuubTemplateType = invoice.templateType || (clientTemplateRef as HireHuubTemplateType);

    if (resolvedTemplateType !== 'Blinkit' && resolvedTemplateType !== 'Elastic Run' && resolvedTemplateType !== 'All') {
      throw new Error(`Invalid invoice template type '${resolvedTemplateType}'. Valid template types are 'Blinkit', 'Elastic Run', or 'All'.`);
    }

    // Persist re-resolved templateType onto draft if it was missing on historical draft record
    if (!invoice.templateType) {
      await invoiceRepository.updateDraft(invoice.id, {
        clientId: invoice.clientId,
        invoiceDate: invoice.invoiceDate,
        lineItems: invoice.lineItems,
        templateType: resolvedTemplateType,
      });
      invoice.templateType = resolvedTemplateType;
    }

    const lineItems = invoice.lineItems.map((item) => this.calculateLineItem(item, resolvedTemplateType));
    const taxableAmount = roundMoney(lineItems.reduce((total, item) => total + item.taxableAmount, 0));
    const totalGstAmount = roundMoney(lineItems.reduce((total, item) => total + item.gstAmount, 0));
    const grandTotal = roundMoney(taxableAmount + totalGstAmount);
    const gst = gstResolution.type === 'CGST_SGST'
      ? { type: gstResolution.type, cgstAmount: roundMoney(totalGstAmount / 2), sgstAmount: roundMoney(totalGstAmount / 2), igstAmount: 0, totalGstAmount }
      : { type: gstResolution.type, cgstAmount: 0, sgstAmount: 0, igstAmount: totalGstAmount, totalGstAmount };
    const amountInWords = numberToWordsRupees(grandTotal);

    let assignedTemplateId = 'default-react-pdf';
    let assignedTemplateVersion = 1;
    try {
      const resolved = await invoiceTemplateService.resolveTemplateForClient(clientTemplateRef);
      if (resolved) {
        assignedTemplateId = resolved.templateId || resolved.id;
        assignedTemplateVersion = resolved.version;
      }
    } catch {
      // Fallback
    }

    // ── Resolve Signatory & Stamp ─────────────────────────
    const companySettingsSnap = await adminService.getCompanySettings();
    const signatories: CompanySignatoryV2[] = companySettingsSnap?.signatoriesV2 || [];
    const activeSignatories = signatories.filter((s: CompanySignatoryV2) => s.isActive !== false);

    let selectedSig = invoice.signatoryId
      ? activeSignatories.find((s: CompanySignatoryV2) => s.id === invoice.signatoryId)
      : activeSignatories.find((s: CompanySignatoryV2) => s.isDefault) || activeSignatories[0];

    if (!selectedSig && activeSignatories.length > 0) {
      selectedSig = activeSignatories[0];
    }

    if (!selectedSig) {
      throw new Error('No active Authorized Signatory found in Company Settings. Please configure an Authorized Signatory before generating invoices.');
    }

    // ── Resolve Selected Company Bank Account ─────────────────────────
    const v2Banks = (companySettingsSnap as any)?.bankAccountsV2 || [];
    const activeBankAccounts = v2Banks.filter((b: any) => b && b.isActive !== false && b.accountNumber && String(b.accountNumber).trim());
    const companyBankDetails = (companySettingsSnap as any)?.companyBankDetails || companySettingsSnap?.bankDetails;

    let selectedBankObj: any = null;

    if (invoice.bankAccountId) {
      selectedBankObj = activeBankAccounts.find(
        (b: any) => b.id === invoice.bankAccountId || b.accountNumber === invoice.bankAccountId
      );
    }

    if (!selectedBankObj && activeBankAccounts.length > 0) {
      selectedBankObj = activeBankAccounts.find((b: any) => b.isPrimary) || activeBankAccounts[0];
    }

    if (!selectedBankObj && companyBankDetails?.accountNumber) {
      selectedBankObj = {
        id: companyBankDetails.id || 'bank-primary',
        bankName: companyBankDetails.bankName,
        accountNumber: companyBankDetails.accountNumber,
        ifscCode: companyBankDetails.ifscCode || companyBankDetails.ifsc,
        branchName: companyBankDetails.branchName || companyBankDetails.branch,
        accountName: companyBankDetails.accountName || billingCompany.companyName,
      };
    }

    if (!selectedBankObj) {
      throw new Error('No active Company Bank Account found in Company Settings. Please configure a Company Bank Account before generating invoices.');
    }

    const bankAccountSnapshot = {
      bankAccountId: selectedBankObj.id || selectedBankObj.accountNumber,
      bankName: selectedBankObj.bankName || 'Bank',
      accountNumber: selectedBankObj.accountNumber || '',
      ifscCode: selectedBankObj.ifscCode || selectedBankObj.ifsc || '',
      branchName: selectedBankObj.branchName || selectedBankObj.branch || '',
      accountHolderName: selectedBankObj.accountName || selectedBankObj.accountHolderName || billingCompany.companyName,
    };

    const stampUrl = companySettingsSnap?.stampUrl || '';

    const signatorySnapshot = {
      signatoryId: selectedSig.id,
      fullName: selectedSig.fullName,
      designation: selectedSig.designation,
      signatureUrl: selectedSig.signatureUrl || '',
      department: selectedSig.department || '',
    };

    const companySnapshot = createCompanySnapshot(billingCompany);
    companySnapshot.authorizedSignatory = selectedSig.fullName;
    companySnapshot.signatoryId = selectedSig.id;
    companySnapshot.signatoryDesignation = selectedSig.designation;
    companySnapshot.signatureUrl = selectedSig.signatureUrl || '';
    companySnapshot.stampUrl = stampUrl;
    companySnapshot.bankDetails = {
      bankName: bankAccountSnapshot.bankName,
      accountNumber: bankAccountSnapshot.accountNumber,
      ifscCode: bankAccountSnapshot.ifscCode,
      branchName: bankAccountSnapshot.branchName,
      accountHolderName: bankAccountSnapshot.accountHolderName,
    };

    const snapshot: InvoiceSnapshot = {
      invoiceNumber: invoiceNumber.value,
      invoiceDate: invoice.invoiceDate,
      company: companySnapshot,
      client: { clientId: client.clientId, clientName: client.clientName, billingName: client.billingName, gstin: client.gstin, billingAddress: client.billingAddress, billingState: client.billingState },
      lineItems,
      taxableAmount,
      gst,
      grandTotal,
      template: { templateId: assignedTemplateId, templateVersion: assignedTemplateVersion },
      templateType: resolvedTemplateType,
      billOfMonth: invoice.billOfMonth || '',
      stationCode: invoice.stationCode || '',
      placeOfSupply: invoice.placeOfSupply || '',
      poNumber: invoice.poNumber || '',
      remarks: invoice.remarks || '',
      amountInWords,
      signatory: signatorySnapshot,
      bankAccount: bankAccountSnapshot,
      stampUrl,
    };

    // ── Externally Generated Invoice Document Storage ───────────────────
    const safeInvNum = safeInvoiceFileName(snapshot.invoiceNumber);
    const fileName = `Invoice_${safeInvNum}.pdf`;
    const storagePath = `finance/invoices/${safeInvNum}/${fileName}`;
    const generatedAt = Timestamp.now();

    // 1. Invoke Native Document Engine via Cloud Function Proxy
    const autoResponse = await AutomationService.requestDocumentGeneration({
      brandId: billingCompany.id,
      documentType: 'INVOICE',
      entityId: invoice.id,
      requestId: `req_inv_${Date.now()}`,
      data: {
        invoiceNumber: snapshot.invoiceNumber,
        invoiceDate: snapshot.invoiceDate,
        poNumber: snapshot.poNumber,
        billOfMonth: snapshot.billOfMonth,
        stationCode: snapshot.stationCode,
        placeOfSupply: snapshot.placeOfSupply,
        clientName: client.clientName,
        billingName: client.billingName,
        clientGstin: client.gstin,
        clientAddress: `${client.billingAddress.line1}${client.billingAddress.line2 ? `, ${client.billingAddress.line2}` : ''}, ${client.billingAddress.city}, ${client.billingState}`,
        clientState: client.billingState,
        taxableAmount: snapshot.taxableAmount,
        cgstAmount: snapshot.gst.cgstAmount,
        sgstAmount: snapshot.gst.sgstAmount,
        igstAmount: snapshot.gst.igstAmount,
        grandTotal: snapshot.grandTotal,
        amountInWords: snapshot.amountInWords,
        lineItems: snapshot.lineItems,
        templateType: snapshot.templateType,
        signatoryId: signatorySnapshot.signatoryId,
        signatoryName: signatorySnapshot.fullName,
        signatoryDesignation: signatorySnapshot.designation,
        signatureUrl: signatorySnapshot.signatureUrl,
        bankName: bankAccountSnapshot.bankName,
        accountNumber: bankAccountSnapshot.accountNumber,
        bankAccount: bankAccountSnapshot.accountNumber,
        ifscCode: bankAccountSnapshot.ifscCode,
        branchName: bankAccountSnapshot.branchName,
        bankAccountId: bankAccountSnapshot.bankAccountId,
        stampUrl,
      },
    });

    if (!autoResponse.success) {
      throw new Error(autoResponse.error?.message || 'Invoice PDF generation failed via Native Cloud Function engine.');
    }

    // 2. Verify Uploaded Storage Object Exists & Obtain Real Authenticated Download URL
    const objectExists = await storageService.exists(storagePath);
    if (!objectExists) {
      throw new Error(`Invoice PDF storage verification failed. Object does not exist at storagePath '${storagePath}'.`);
    }

    const downloadUrl = await storageService.getDownloadUrl(storagePath);
    const documentVersion = (invoice.document?.documentVersion ?? 0) + 1;

    // 3. Register PDF in Document Center (Single Source of Truth)
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
      storagePath,
      downloadUrl,
      fileSize: 1024,
      mimeType: 'application/pdf',
      requiresSignature: false,
      isSigned: true,
      signedBy: billingCompany.authorizedSignatory || 'Authorized Signatory',
      qrCodeUrl: '',
      isLocked: false,
      lockedAt: generatedAt,
      generatedBy,
      generatedAt,
      emailed: false,
      emailedTo: '',
      downloadCount: 0,
      archived: false,
      remarks: `Invoice PDF registered at ${storagePath}`,
      createdBy: generatedBy,
      updatedBy: generatedBy,
    });

    const document: InvoiceDocumentStorage = {
      documentId,
      documentVersion,
      storagePath,
      downloadUrl,
      fileSize: 1024,
      mimeType: 'application/pdf',
      generatedAt,
    };
    const statusHistory = [...invoice.statusHistory, this.statusEntry('Generated', generatedBy, `Invoice PDF generated at ${storagePath}.`)];
    await invoiceRepository.completeGeneration(invoice.id, snapshot, document, statusHistory);

    await auditService.record({
      module: 'Finance',
      action: 'Generate Invoice PDF',
      recordId: invoice.id,
      performedBy: generatedBy,
      role: 'Finance',
      newValue: { invoiceNumber: snapshot.invoiceNumber, documentVersion, storagePath, downloadUrl },
      remarks: `Invoice ${snapshot.invoiceNumber} PDF generated natively and verified at ${storagePath}.`,
    });

    return document;
  }

  async approveInvoice(invoiceId: string, approvedBy: string, actor: FinanceAuthorizationContext): Promise<void> {
    const invoice = await this.requireInvoice(invoiceId, actor);
    if (invoice.isLocked || invoice.status === 'Approved') {
      throw new Error('Invoice is already approved and locked.');
    }
    if (!approvedBy.trim()) throw new Error('Approver name is required.');

    const statusHistory = [
      ...invoice.statusHistory,
      this.statusEntry('Approved', approvedBy, 'Invoice officially approved and locked.'),
    ];

    await invoiceRepository.approveInvoice(invoice.id, approvedBy, statusHistory);

    await auditService.record({
      module: 'Finance',
      action: 'Approve Invoice',
      recordId: invoiceId,
      performedBy: approvedBy,
      role: 'Finance',
      newValue: { status: 'Approved', isLocked: true },
      remarks: `Invoice ${invoice.invoiceNumber} officially approved and locked.`,
    });
  }

  /**
   * Record Client Payment (Immutable Append-Only Ledger Workflow)
   * Formula rules per Indian Accounting Standards:
   * - Taxable Amount = Basic Amount (excluding GST)
   * - TDS = 2% of Taxable Basic Amount
   * - Net Receivable = Invoice Total (grandTotal) - TDS
   * - Settlement Value = Amount Received + TDS
   * - Revenue = Amount Received - Candidate Pay
   * - Outstanding Amount = Invoice Total - Total Settlement Value
   * - Withheld Amount = Invoice Total - Total Settlement Value
   */
  async recordClientPayment(invoiceId: string, input: RecordClientPaymentInput, actorName: string, role: string, actor: FinanceAuthorizationContext): Promise<void> {
    const invoice = await this.requireInvoice(invoiceId, actor);
    if (invoice.status === 'Paid') {
      throw new Error('Invoice is fully paid. No further payment entries allowed.');
    }
    if (!input.amountReceived || input.amountReceived <= 0) {
      throw new Error('Amount received must be greater than zero.');
    }

    const invoiceAmount = invoice.snapshot?.grandTotal ?? invoice.grandTotal ?? 0;
    if (invoiceAmount <= 0) {
      throw new Error('Invoice amount is zero. Payment cannot be recorded.');
    }

    // TDS is strictly 2% of Taxable Basic Amount (excluding GST)
    const taxableAmount = invoice.snapshot?.taxableAmount ?? invoice.taxableAmount ?? 0;
    const tdsAmount = roundMoney(taxableAmount * 0.02);
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

  async updateStatus(invoiceId: string, status: InvoiceStatus, changedBy: string, remarks: string, actor: FinanceAuthorizationContext): Promise<void> {
    const invoice = await this.requireInvoice(invoiceId, actor);
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

  private calculateLineItem(input: Invoice['lineItems'][number], templateType: string = 'All'): InvoiceLineItem {
    const qty = input.quantity || 1;
    const unitPrice = input.unitPrice || 0;
    const taxableAmount = roundMoney(qty * unitPrice);

    let hsn = '';
    if (templateType === 'Elastic Run') {
      hsn = '998519';
    } else {
      hsn = input.hsn?.trim() || '';
    }

    const gstAmount = roundMoney((taxableAmount * input.gstRate) / 100);
    const totalAmount = roundMoney(taxableAmount + gstAmount);

    return {
      ...input,
      hsn,
      quantity: qty,
      unitPrice,
      taxableAmount,
      gstAmount,
      totalAmount,
    };
  }

  private statusEntry(status: InvoiceStatus, changedBy: string, remarks: string): InvoiceStatusHistoryEntry {
    return { status, changedAt: Timestamp.now(), changedBy, remarks };
  }

  private async requireInvoice(id: string, actor: FinanceAuthorizationContext = {}): Promise<Invoice> {
    if (!id.trim()) throw new Error('Invoice ID is required.');
    const invoice = await invoiceRepository.getInvoice(id, actor);
    if (!invoice) throw new Error('Invoice was not found.');
    return invoice;
  }
}

export const invoiceService = new InvoiceService();
