import type { InvoiceSnapshot } from '../../types/Invoice';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);

const formatAddress = (addr: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string =>
  [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');

/**
 * Maps an InvoiceSnapshot to a flat placeholder dictionary.
 * All placeholder keys match {{Key}} tokens in uploaded Excel/DOCX templates.
 * Used by the TemplateRenderer to fill cells and React-PDF templates alike.
 */
export function buildInvoicePlaceholders(snapshot: InvoiceSnapshot): Record<string, string> {
  const { company, client, gst } = snapshot;

  const lineItemsText = snapshot.lineItems
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.description} | Qty: ${item.quantity} | ` +
        `Taxable: ${formatCurrency(item.taxableAmount)} | ` +
        `GST@${item.gstRate}%: ${formatCurrency(item.gstAmount)} | ` +
        `Total: ${formatCurrency(item.totalAmount)}`
    )
    .join('\n');

  const gstType = gst.type ?? 'CGST_SGST';
  const cgstAmount = gstType === 'CGST_SGST' ? gst.cgstAmount : 0;
  const sgstAmount = gstType === 'CGST_SGST' ? gst.sgstAmount : 0;
  const igstAmount = gstType === 'IGST' ? gst.igstAmount : 0;

  return {
    // Invoice Reference
    InvoiceNumber: snapshot.invoiceNumber,
    InvoiceDate: snapshot.invoiceDate,
    PONumber: snapshot.poNumber ?? '',
    Remarks: snapshot.remarks ?? '',

    // Company (Hire Huub)
    CompanyName: company.companyName,
    CompanyLegalName: company.legalName,
    CompanyGSTIN: company.gstin,
    CompanyGST: company.gstin,
    CompanyPAN: company.pan,
    CompanyCIN: '',
    CompanyAddress: formatAddress(company.registeredAddress),
    AuthorisedSignatory: company.authorizedSignatory,
    AuthorizedSignatory: company.authorizedSignatory,

    // Client
    ClientName: client.clientName,
    ClientGSTIN: client.gstin ?? '',
    ClientGST: client.gstin ?? '',
    ClientAddress: formatAddress(client.billingAddress),
    ClientState: client.billingState,
    BillingAddress: formatAddress(client.billingAddress),
    BillingName: client.clientName,

    // Line Items (flat text for single-cell templates)
    LineItems: lineItemsText,

    // Financials
    Subtotal: formatCurrency(snapshot.taxableAmount),
    TaxableAmount: formatCurrency(snapshot.taxableAmount),
    CGST: formatCurrency(cgstAmount),
    SGST: formatCurrency(sgstAmount),
    IGST: formatCurrency(igstAmount),
    GSTAmount: formatCurrency(gst.totalGstAmount),
    GrandTotal: formatCurrency(snapshot.grandTotal),
    AmountInWords: snapshot.amountInWords ?? '',

    // Bank Details
    BankName: company.bankDetails.bankName,
    AccountNumber: company.bankDetails.accountNumber,
    AccountHolderName: company.bankDetails.accountHolderName ?? company.companyName,
    IFSC: company.bankDetails.ifscCode,
    BranchName: company.bankDetails.branchName ?? '',

    // Computed / Optional
    GSTType: gstType,
    QRCode: '',
    CompanyLogo: '',
  };
}

/**
 * Structured line items for tabular rendering in Excel/PDF templates.
 */
export interface MappedLineItem {
  srNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export function buildLineItems(snapshot: InvoiceSnapshot): MappedLineItem[] {
  return snapshot.lineItems.map((item, idx) => ({
    srNo: idx + 1,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxableAmount: item.taxableAmount,
    gstRate: item.gstRate,
    gstAmount: item.gstAmount,
    totalAmount: item.totalAmount,
  }));
}
