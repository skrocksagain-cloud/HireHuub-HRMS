"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHireHuubHSN = validateHireHuubHSN;
exports.compileInvoiceHTML = compileInvoiceHTML;
function escapeHTML(str) {
    if (!str)
        return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function formatCurrency(amount) {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
/**
 * Validates HSN/SAC code for HireHuub manpower/labour supply services.
 * HSN 998519: "Other employment and labour supply services nowhere else classified"
 */
function validateHireHuubHSN(hsn) {
    if (!hsn || !hsn.trim())
        return true; // Optional allowed
    return hsn.trim() === '998519';
}
/**
 * Native HTML Compiler for Hire Huub Invoice Templates.
 * Supports Blinkit, Elastic Run, and All (Default) templates with 1-page A4 styling.
 */
function compileInvoiceHTML(options) {
    const { placeholders: p, brandLogoUrl = '', templateType = 'All' } = options;
    const legalNameVal = p.LEGAL_NAME || p.COMPANY_NAME || 'Hire Huub People Solution Private Limited';
    const brandNameVal = p.BRAND_NAME || 'Hire Huub';
    const addressVal = p.BRAND_ADDRESS || p.ADDRESS || '';
    const phoneVal = p.BRAND_PHONE || p.PHONE || '';
    const emailVal = p.BRAND_EMAIL || p.EMAIL || '';
    const websiteVal = p.BRAND_WEBSITE || p.WEBSITE || '';
    const companyGstin = p.COMPANY_GSTIN || p.GSTIN || '';
    const companyPan = p.COMPANY_PAN || p.PAN || '';
    const companyCin = p.COMPANY_CIN || p.CIN || '';
    const registeredState = p.REGISTERED_STATE || p.COMPANY_STATE || 'West Bengal';
    const invoiceNumber = p.INVOICE_NUMBER || p.DOCUMENT_ID || 'INV2026-0001';
    const invoiceDate = p.INVOICE_DATE || new Date().toISOString().split('T')[0];
    const poNumber = p.PO_NUMBER || '';
    const clientName = p.CLIENT_NAME || p.CLIENT_LEGAL_NAME || 'N/A';
    const clientAddress = p.CLIENT_ADDRESS || '';
    const clientGstin = p.CLIENT_GSTIN || 'Unregistered';
    const clientState = p.CLIENT_STATE || '';
    // Elastic Run specific card fields
    const billOfMonth = p.BILL_OF_MONTH || p.BILL_MONTH || '';
    const stationCode = p.STATION_CODE || '';
    const placeOfSupply = p.PLACE_OF_SUPPLY || '';
    // Financial Totals
    const taxableAmountNum = parseFloat(p.TAXABLE_AMOUNT || '0') || 0;
    const gstType = p.GST_TYPE || (registeredState.toUpperCase() === clientState.toUpperCase() ? 'CGST_SGST' : 'IGST');
    const cgstAmountNum = parseFloat(p.CGST_AMOUNT || '0') || 0;
    const sgstAmountNum = parseFloat(p.SGST_AMOUNT || '0') || 0;
    const igstAmountNum = parseFloat(p.IGST_AMOUNT || '0') || 0;
    const grandTotalNum = parseFloat(p.GRAND_TOTAL || '0') || 0;
    const amountInWords = p.AMOUNT_IN_WORDS || '';
    // Bank Info
    const bankName = p.BANK_NAME || '';
    const accountNumber = p.BANK_ACCOUNT || p.ACCOUNT_NUMBER || '';
    const ifscCode = p.IFSC_CODE || p.IFSC || '';
    const signatoryName = p.SIGNATORY_NAME || 'Authorized Signatory';
    const signatoryDesignation = p.SIGNATORY_DESIGNATION || 'Authorized Signatory';
    const signatureUrl = p.SIGNATURE_URL || '';
    const companyStampUrl = p.COMPANY_STAMP_URL || p.STAMP_URL || '';
    // Line items parsing (or standard placeholders)
    let rawItems = [];
    try {
        if (p.LINE_ITEMS_JSON) {
            rawItems = JSON.parse(p.LINE_ITEMS_JSON);
        }
    }
    catch {
        // fallback
    }
    if (rawItems.length === 0) {
        rawItems = [
            {
                description: p.ITEM_DESCRIPTION || 'Professional Staffing & Labour Supply Services',
                hsn: p.HSN_CODE || '998519',
                workDuration: p.WORK_DURATION || '',
                quantity: parseFloat(p.ITEM_QTY || '1') || 1,
                unit: p.ITEM_UNIT || '',
                unitPrice: taxableAmountNum,
                amount: taxableAmountNum,
            },
        ];
    }
    // Render Table Header & Rows according to Template Type
    let tableHeaderHTML = '';
    let tableRowsHTML = '';
    if (templateType === 'Blinkit') {
        tableHeaderHTML = `
      <tr>
        <th style="width: 6%;">SL No.</th>
        <th style="width: 38%;">Item & Description</th>
        <th style="width: 12%;">HSN</th>
        <th style="width: 20%;">Work Duration</th>
        <th style="width: 8%; text-align: right;">QTY</th>
        <th style="width: 8%; text-align: right;">UNIT PRICE</th>
        <th style="width: 8%; text-align: right;">AMOUNT</th>
      </tr>
    `;
        tableRowsHTML = rawItems
            .map((item, idx) => {
            const qty = item.quantity || 1;
            const unitPrice = item.unitPrice || (qty > 0 ? (item.amount || 0) / qty : 0);
            const lineAmount = item.amount || qty * unitPrice;
            return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${escapeHTML(item.description)}</td>
        <td style="text-align: center; font-family: monospace;">${escapeHTML(item.hsn || '-')}</td>
        <td style="text-align: center;">${escapeHTML(item.workDuration || '-')}</td>
        <td style="text-align: right; font-family: monospace;">${qty}</td>
        <td style="text-align: right; font-family: monospace;">${formatCurrency(unitPrice)}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(lineAmount)}</td>
      </tr>
    `;
        })
            .join('');
    }
    else if (templateType === 'Elastic Run') {
        tableHeaderHTML = `
      <tr>
        <th style="width: 8%;">SL No.</th>
        <th style="width: 48%;">Item & Description</th>
        <th style="width: 14%;">HSN/SAC</th>
        <th style="width: 10%; text-align: right;">QTY</th>
        <th style="width: 10%; text-align: right;">UNIT PRICE</th>
        <th style="width: 10%; text-align: right;">AMOUNT</th>
      </tr>
    `;
        tableRowsHTML = rawItems
            .map((item, idx) => {
            const qty = item.quantity || 1;
            const unitPrice = item.unitPrice || 0;
            const lineAmount = item.amount || qty * unitPrice;
            return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${escapeHTML(item.description)}</td>
        <td style="text-align: center; font-family: monospace;">998519</td>
        <td style="text-align: right; font-family: monospace;">${qty}</td>
        <td style="text-align: right; font-family: monospace;">${formatCurrency(unitPrice)}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(lineAmount)}</td>
      </tr>
    `;
        })
            .join('');
    }
    else {
        // All / Default Template Table
        tableHeaderHTML = `
      <tr>
        <th style="width: 8%;">SL No.</th>
        <th style="width: 48%;">Item & Description</th>
        <th style="width: 14%;">HSN/SAC</th>
        <th style="width: 10%; text-align: right;">QTY</th>
        <th style="width: 10%; text-align: right;">UNIT PRICE</th>
        <th style="width: 10%; text-align: right;">AMOUNT</th>
      </tr>
    `;
        tableRowsHTML = rawItems
            .map((item, idx) => {
            const qty = item.quantity || 1;
            const unitPrice = item.unitPrice || 0;
            const lineAmount = item.amount || qty * unitPrice;
            return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${escapeHTML(item.description)}</td>
        <td style="text-align: center; font-family: monospace;">${escapeHTML(item.hsn || '-')}</td>
        <td style="text-align: right; font-family: monospace;">${qty}</td>
        <td style="text-align: right; font-family: monospace;">${formatCurrency(unitPrice)}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(lineAmount)}</td>
      </tr>
    `;
        })
            .join('');
    }
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice - ${escapeHTML(invoiceNumber)}</title>
        <style>
          @page { size: A4; margin: 0; }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            -webkit-print-color-adjust: exact;
          }
          * { box-sizing: border-box; }
          .page {
            width: 8.27in;
            height: 11.69in;
            padding: 0.45in 0.5in;
            position: relative;
            background: #ffffff;
            box-sizing: border-box;
            overflow: hidden;
          }

          /* Header Area */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-col { width: 45%; }
          .company-details { font-size: 7.5pt; color: #475569; line-height: 1.35; margin-top: 4px; }
          .title-col { width: 45%; text-align: right; }
          .invoice-title { font-size: 20pt; font-weight: 900; color: #047857; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1; }

          /* Bill To Cards */
          .bill-grid {
            display: flex;
            gap: 14px;
            margin-bottom: 16px;
          }
          .card-box {
            border: 1px solid #d1fae5;
            border-radius: 8px;
            background: #f0fdf4;
            padding: 12px 14px;
            font-size: 8.5pt;
            flex: 1;
          }
          .card-header {
            font-size: 8pt;
            font-weight: 800;
            color: #047857;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-bottom: 1px solid #a7f3d0;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .card-line { margin-bottom: 4px; line-height: 1.35; }

          /* Line Items Table */
          .table-container {
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 18px;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
          }
          .invoice-table th {
            background: #047857;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 9px 12px;
            font-size: 8pt;
            text-align: left;
          }
          .invoice-table td {
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }

          /* Summary Panel */
          .summary-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 22px;
          }
          .words-panel {
            width: 56%;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 8.5pt;
          }
          .totals-panel {
            width: 40%;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            background: #ffffff;
            font-size: 8.5pt;
            overflow: hidden;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 12px;
            border-bottom: 1px solid #f1f5f9;
          }
          .totals-row.grand {
            background: #047857;
            color: #ffffff;
            font-weight: 800;
            font-size: 10pt;
            border-bottom: none;
          }

          /* Footer Area */
          .footer-card {
            border: 1px solid #d1fae5;
            border-radius: 8px;
            background: #f0fdf4;
            padding: 12px 16px;
            font-size: 8pt;
            position: absolute;
            bottom: 0.45in;
            left: 0.5in;
            right: 0.5in;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- 1. Header -->
          <div class="header-container">
            <div class="brand-col">
              ${brandLogoUrl ? `<img src="${brandLogoUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; display: block; margin-bottom: 6px;" />` : ''}
              <div style="font-weight: 800; font-size: 11pt; color: #0f172a;">${escapeHTML(legalNameVal)}</div>
              <div style="font-size: 8.5pt; font-weight: 800; color: #047857;">${escapeHTML(brandNameVal)}</div>
              <div class="company-details">
                ${addressVal ? `<div>${escapeHTML(addressVal)}</div>` : ''}
                <div>State: ${escapeHTML(registeredState)} ${companyGstin ? `| GSTIN: ${escapeHTML(companyGstin)}` : ''}</div>
                ${companyPan || companyCin ? `<div>${companyPan ? `PAN: ${escapeHTML(companyPan)}` : ''}${companyPan && companyCin ? ' | ' : ''}${companyCin ? `CIN: ${escapeHTML(companyCin)}` : ''}</div>` : ''}
                ${phoneVal || emailVal || websiteVal ? `<div>${phoneVal ? `Ph: ${escapeHTML(phoneVal)}` : ''}${phoneVal && emailVal ? ' | ' : ''}${emailVal ? `Email: ${escapeHTML(emailVal)}` : ''}${websiteVal ? ` | ${escapeHTML(websiteVal)}` : ''}</div>` : ''}
              </div>
            </div>

            <div class="title-col">
              <div class="invoice-title">TAX INVOICE</div>
              <div style="font-size: 8.5pt; font-weight: 700; color: #475569; margin-top: 6px;">
                <div><span style="color: #64748b;">INVOICE NO:</span> <span style="font-family: monospace; font-weight: 800; color: #0f172a;">${escapeHTML(invoiceNumber)}</span></div>
                <div><span style="color: #64748b;">DATE:</span> <span style="color: #0f172a; font-weight: 700;">${escapeHTML(invoiceDate)}</span></div>
                ${poNumber ? `<div><span style="color: #64748b;">PO NO:</span> <span style="color: #0f172a;">${escapeHTML(poNumber)}</span></div>` : ''}
              </div>
            </div>
          </div>

          <!-- 2. Bill To & Top Content Grid -->
          <div class="bill-grid">
            <div class="card-box">
              <div class="card-header">Bill To</div>
              <div class="card-line" style="font-weight: 800; font-size: 9.5pt; color: #0f172a;">${escapeHTML(clientName)}</div>
              ${clientAddress ? `<div class="card-line" style="color: #475569;">${escapeHTML(clientAddress)}</div>` : ''}
              <div class="card-line" style="margin-top: 4px;">
                <span style="font-weight: 700; color: #475569;">GSTIN:</span> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${escapeHTML(clientGstin)}</span>
                ${clientState ? ` | <span style="font-weight: 700; color: #475569;">State:</span> ${escapeHTML(clientState)}` : ''}
              </div>
            </div>

            ${templateType === 'Elastic Run'
        ? `
              <div class="card-box">
                <div class="card-header">Billing Details</div>
                <div class="card-line"><span style="font-weight: 700; color: #475569;">Bill of the Month:</span> <span style="font-weight: 700; color: #0f172a;">${escapeHTML(billOfMonth) || '-'}</span></div>
                <div class="card-line"><span style="font-weight: 700; color: #475569;">Station Code:</span> <span style="font-weight: 700; color: #0f172a;">${escapeHTML(stationCode) || '-'}</span></div>
                <div class="card-line"><span style="font-weight: 700; color: #475569;">Place of Supply:</span> <span style="font-weight: 700; color: #047857;">${escapeHTML(placeOfSupply) || '-'}</span></div>
              </div>
            `
        : ''}
          </div>

          <!-- 3. Line Items Table -->
          <div class="table-container">
            <table class="invoice-table">
              <thead>
                ${tableHeaderHTML}
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
            </table>
          </div>

          <!-- 4. Summary & Totals -->
          <div class="summary-container">
            <div class="words-panel">
              <div style="font-size: 7.5pt; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 4px;">Amount in Words</div>
              <div style="font-weight: 700; color: #0f172a; font-size: 8.5pt; line-height: 1.4;">${escapeHTML(amountInWords || 'Rupees Only')}</div>
            </div>

            <div class="totals-panel">
              <div class="totals-row">
                <span>Taxable Amount</span>
                <span style="font-family: monospace; font-weight: 700;">${formatCurrency(taxableAmountNum)}</span>
              </div>

              ${gstType === 'CGST_SGST'
        ? `
                <div class="totals-row">
                  <span>CGST (9%)</span>
                  <span style="font-family: monospace;">${formatCurrency(cgstAmountNum)}</span>
                </div>
                <div class="totals-row">
                  <span>SGST (9%)</span>
                  <span style="font-family: monospace;">${formatCurrency(sgstAmountNum)}</span>
                </div>
              `
        : `
                <div class="totals-row">
                  <span>IGST (18%)</span>
                  <span style="font-family: monospace;">${formatCurrency(igstAmountNum)}</span>
                </div>
              `}

              <div class="totals-row grand">
                <span>Grand Total</span>
                <span style="font-family: monospace; color: #ffffff;">${formatCurrency(grandTotalNum)}</span>
              </div>
            </div>
          </div>

          <!-- 5. Footer Card -->
          <div class="footer-card">
            <div>
              <div style="font-weight: 800; color: #047857; text-transform: uppercase; font-size: 7.5pt; margin-bottom: 3px;">Bank Payment Details</div>
              <div style="color: #475569; line-height: 1.35;">
                ${bankName ? `<div>Bank: ${escapeHTML(bankName)}</div>` : ''}
                ${accountNumber ? `<div>A/C No: <span style="font-family: monospace; font-weight: 700;">${escapeHTML(accountNumber)}</span> | IFSC: <span style="font-family: monospace; font-weight: 700;">${escapeHTML(ifscCode)}</span></div>` : ''}
              </div>
            </div>

            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;">
              <div style="font-weight: 700; color: #475569; font-size: 7.5pt; margin-bottom: 4px;">For ${escapeHTML(legalNameVal)}</div>
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 4px;">
                ${companyStampUrl ? `<img src="${companyStampUrl}" alt="Company Stamp" style="height: 38px; max-width: 65px; object-fit: contain;" />` : ''}
                ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" style="height: 30px; max-width: 80px; object-fit: contain;" />` : ''}
              </div>
              <div style="font-weight: 800; color: #0f172a; font-size: 8pt;">${escapeHTML(signatoryName)}</div>
              <div style="font-weight: 600; color: #475569; font-size: 7.5pt;">${escapeHTML(signatoryDesignation)}</div>
              <div style="font-size: 6.5pt; color: #64748b; margin-top: 2px;">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
//# sourceMappingURL=nativeInvoiceRenderer.js.map