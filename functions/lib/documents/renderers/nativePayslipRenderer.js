"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compilePayslipHTML = compilePayslipHTML;
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
function maskAccountNumber(acc) {
    if (!acc)
        return 'N/A';
    const clean = acc.replace(/\s+/g, '');
    if (clean.length <= 4)
        return clean;
    return `••••••••${clean.slice(-4)}`;
}
/**
 * Compiles HTML for Payslip documents natively in Firebase Cloud Functions.
 * Follows strict 1-page A4 corporate visual design rules without physical signature blocks.
 */
function compilePayslipHTML(options) {
    const { placeholders: p, brandLogoUrl = '' } = options;
    const legalNameVal = p.LEGAL_NAME || p.COMPANY_NAME || 'Hire Huub People Solution Private Limited';
    const brandNameVal = p.BRAND_NAME || 'Hire Huub';
    const phoneVal = p.BRAND_PHONE || p.PHONE || '';
    const emailVal = p.BRAND_EMAIL || p.EMAIL || '';
    const websiteVal = p.BRAND_WEBSITE || p.WEBSITE || '';
    const monthYearVal = p.SALARY_MONTH || p.MONTH || 'AUGUST 2026';
    const empName = p.PERSON_NAME || p.EMPLOYEE_NAME || 'N/A';
    const empCode = p.EMPLOYEE_CODE || p.EMPLOYEE_ID || 'N/A';
    const designation = p.DESIGNATION || 'N/A';
    const department = p.DEPARTMENT || 'N/A';
    const joiningDate = p.JOINING_DATE || 'N/A';
    const workLocation = p.WORK_LOCATION || p.LOCATION || 'Head Office';
    const bankName = p.BANK_NAME || 'N/A';
    const rawBankAccount = p.BANK_ACCOUNT_NUMBER || p.ACCOUNT_NUMBER || '';
    const maskedBankAccount = maskAccountNumber(rawBankAccount);
    const ifsc = p.IFSC_CODE || p.IFSC || 'N/A';
    const payslipId = p.PAYSLIP_ID || p.DOCUMENT_ID || `PSLIP-${empCode}-${Date.now().toString().slice(-4)}`;
    const generatedOn = p.GENERATED_ON || p.GENERATED_AT || new Date().toISOString().split('T')[0];
    const basicPay = p.BASIC_PAY || '₹0';
    const hra = p.HRA || '₹0';
    const conveyance = p.CONVEYANCE || '₹0';
    const specialAllowance = p.SPECIAL_ALLOWANCE || '₹0';
    const grossEarnings = p.GROSS_EARNINGS || '₹0';
    const pfDeduction = p.PF_DEDUCTION || '₹0';
    const esicDeduction = p.ESIC_DEDUCTION || '₹0';
    const ptDeduction = p.PT_DEDUCTION || '₹0';
    const totalDeductions = p.TOTAL_DEDUCTIONS || '₹0';
    const netPay = p.NET_PAY || '₹0';
    const netPayWords = p.NET_PAY_WORDS || '';
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Payslip - ${escapeHTML(empName)}</title>
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
          
          /* Header Component */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-col {
            width: 25%;
          }
          .company-center-col {
            width: 50%;
            text-align: center;
          }
          .title-right-col {
            width: 25%;
            text-align: right;
          }
          
          /* Employee Info Card */
          .emp-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
            padding: 12px 14px;
            margin-bottom: 16px;
          }
          .emp-card-title {
            font-size: 8.5pt;
            font-weight: 800;
            color: #475569;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .emp-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px 14px;
            font-size: 8.5pt;
          }
          .info-cell {
            line-height: 1.35;
          }
          .info-label {
            font-size: 7.5pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            display: block;
            margin-bottom: 1px;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
          }

          /* Earnings & Deductions Table */
          .table-container {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 16px;
          }
          .pay-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
          }
          .pay-table th {
            background: #0f172a;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 8px 12px;
            font-size: 8.5pt;
            width: 50%;
          }
          .pay-table td {
            padding: 7px 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .line-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            line-height: 1.3;
          }
          .line-item:last-child {
            margin-bottom: 0;
          }
          .item-name {
            color: #334155;
            font-weight: 500;
          }
          .item-amount {
            font-weight: 700;
            color: #0f172a;
            font-family: monospace;
          }
          .total-row {
            background: #f1f5f9;
            font-weight: 800;
          }
          .total-row td {
            border-bottom: none;
            padding: 9px 12px;
          }

          /* Net Pay Box */
          .net-pay-panel {
            background: #0f172a;
            color: #ffffff;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .net-label {
            font-size: 8.5pt;
            color: #94a3b8;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }
          .net-amount-val {
            font-size: 16pt;
            font-weight: 800;
            color: #34d399;
            font-family: monospace;
          }
          .net-words-val {
            font-size: 8.5pt;
            color: #e2e8f0;
            font-weight: 600;
            margin-top: 3px;
          }

          /* Footer Info Card */
          .footer-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px 16px;
            text-align: center;
            position: absolute;
            bottom: 0.45in;
            left: 0.5in;
            right: 0.5in;
          }
          .footer-meta {
            display: flex;
            justify-content: center;
            gap: 24px;
            font-size: 8pt;
            font-family: monospace;
            font-weight: 700;
            color: #475569;
            margin-bottom: 6px;
          }
          .system-badge {
            display: inline-block;
            background: #e2e8f0;
            color: #0f172a;
            font-size: 7.5pt;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .notice-text {
            font-size: 7.5pt;
            color: #64748b;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- 1. Header Area -->
          <div class="header-container">
            <!-- Left: Brand Logo & Name -->
            <div class="brand-col">
              ${brandLogoUrl ? `<img src="${brandLogoUrl}" style="max-height: 44px; max-width: 140px; object-fit: contain; display: block; margin-bottom: 6px;" />` : ''}
              <div style="font-weight: 800; font-size: 10.5pt; color: #047857; letter-spacing: 0.3px;">${escapeHTML(brandNameVal)}</div>
            </div>

            <!-- Center: Legal Company Info -->
            <div class="company-center-col">
              <div style="font-weight: 800; font-size: 10pt; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px; margin-bottom: 3px;">${escapeHTML(legalNameVal)}</div>
              <div style="font-size: 7.5pt; color: #475569; line-height: 1.35;">
                ${phoneVal || emailVal ? `<div>${phoneVal ? `Tel: ${escapeHTML(phoneVal)}` : ''}${phoneVal && emailVal ? ' | ' : ''}${emailVal ? `Email: ${escapeHTML(emailVal)}` : ''}</div>` : ''}
                ${websiteVal ? `<div>${escapeHTML(websiteVal)}</div>` : ''}
              </div>
            </div>

            <!-- Right: Title & Month -->
            <div class="title-right-col">
              <div style="font-size: 18pt; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1;">PAYSLIP</div>
              <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Salary for the Month of</div>
              <div style="font-size: 11pt; font-weight: 800; color: #059669; margin-top: 1px; text-transform: uppercase;">${escapeHTML(monthYearVal)}</div>
            </div>
          </div>

          <!-- 2. Employee Information Card -->
          <div class="emp-card">
            <div class="emp-card-title">Employee Information</div>
            <div class="emp-grid">
              <div class="info-cell">
                <span class="info-label">Employee Name</span>
                <span class="info-val">${escapeHTML(empName)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Employee ID</span>
                <span class="info-val" style="font-family: monospace;">${escapeHTML(empCode)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Department</span>
                <span class="info-val">${escapeHTML(department)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Designation</span>
                <span class="info-val">${escapeHTML(designation)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Date of Joining</span>
                <span class="info-val">${escapeHTML(joiningDate)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Work Location</span>
                <span class="info-val">${escapeHTML(workLocation)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Bank Name</span>
                <span class="info-val">${escapeHTML(bankName)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">Account Number</span>
                <span class="info-val" style="font-family: monospace;">${escapeHTML(maskedBankAccount)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">IFSC Code</span>
                <span class="info-val" style="font-family: monospace;">${escapeHTML(ifsc)}</span>
              </div>
            </div>
          </div>

          <!-- 3. Earnings & Deductions Table -->
          <div class="table-container">
            <table class="pay-table">
              <thead>
                <tr>
                  <th style="border-right: 1px solid #334155;">Earnings</th>
                  <th>Deductions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border-right: 1px solid #e2e8f0;">
                    <div class="line-item">
                      <span class="item-name">Basic Salary</span>
                      <span class="item-amount">${escapeHTML(basicPay)}</span>
                    </div>
                    <div class="line-item">
                      <span class="item-name">House Rent Allowance (HRA)</span>
                      <span class="item-amount">${escapeHTML(hra)}</span>
                    </div>
                    <div class="line-item">
                      <span class="item-name">Conveyance Allowance</span>
                      <span class="item-amount">${escapeHTML(conveyance)}</span>
                    </div>
                    <div class="line-item">
                      <span class="item-name">Special Allowance</span>
                      <span class="item-amount">${escapeHTML(specialAllowance)}</span>
                    </div>
                  </td>
                  <td>
                    <div class="line-item">
                      <span class="item-name">Provident Fund (PF)</span>
                      <span class="item-amount">${escapeHTML(pfDeduction)}</span>
                    </div>
                    <div class="line-item">
                      <span class="item-name">Employees' State Insurance (ESI)</span>
                      <span class="item-amount">${escapeHTML(esicDeduction)}</span>
                    </div>
                    <div class="line-item">
                      <span class="item-name">Professional Tax (P Tax)</span>
                      <span class="item-amount">${escapeHTML(ptDeduction)}</span>
                    </div>
                  </td>
                </tr>
                <tr class="total-row">
                  <td style="border-right: 1px solid #cbd5e1;">
                    <div class="line-item" style="font-weight: 800;">
                      <span style="text-transform: uppercase;">Gross Earnings</span>
                      <span class="item-amount" style="font-size: 9.5pt; color: #047857;">${escapeHTML(grossEarnings)}</span>
                    </div>
                  </td>
                  <td>
                    <div class="line-item" style="font-weight: 800;">
                      <span style="text-transform: uppercase;">Total Deductions</span>
                      <span class="item-amount" style="font-size: 9.5pt; color: #b91c1c;">${escapeHTML(totalDeductions)}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. Net Salary Payable Panel -->
          <div class="net-pay-panel">
            <div>
              <div class="net-label">Net Salary Payable</div>
              ${netPayWords ? `<div class="net-words-val">Amount in Words: ${escapeHTML(netPayWords)}</div>` : ''}
            </div>
            <div className="net-amount-val" style="font-size: 16pt; font-weight: 800; color: #34d399; font-family: monospace;">
              ${escapeHTML(netPay)}
            </div>
          </div>

          <!-- 5. System Generated Footer Card -->
          <div class="footer-card">
            <div class="footer-meta">
              <span>PAYSLIP ID: ${escapeHTML(payslipId)}</span>
              <span>•</span>
              <span>GENERATED ON: ${escapeHTML(generatedOn)}</span>
            </div>
            <div class="system-badge">System Generated Payslip</div>
            <div class="notice-text">
              This payslip is electronically generated from the company's payroll records and does not require a physical signature or stamp.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
//# sourceMappingURL=nativePayslipRenderer.js.map