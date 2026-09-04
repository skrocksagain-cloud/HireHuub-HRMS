export function getOfferLetterHTML(placeholders: Record<string, string>): string {
  const p = placeholders;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 20mm 20mm 20mm;
    box-sizing: border-box;
    position: relative;
    page-break-after: always;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .header {
    border-bottom: 2px solid #0284c7;
    padding-bottom: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .company-title {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  .company-subtitle {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }
  .doc-title {
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #0f172a;
    margin: 20px 0;
    text-transform: uppercase;
  }
  .meta-grid {
    display: flex;
    justify-content: space-between;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 10px 14px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 12px;
  }
  .meta-item span {
    font-weight: 600;
    color: #334155;
  }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #0284c7;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    font-size: 12px;
    line-height: 1.5;
  }
  .info-row {
    display: flex;
  }
  .info-label {
    font-weight: 600;
    width: 140px;
    color: #334155;
  }
  .info-value {
    color: #0f172a;
  }
  p, li {
    font-size: 12px;
    line-height: 1.6;
    color: #334155;
  }
  ol, ul {
    padding-left: 20px;
    margin-top: 6px;
  }
  li {
    margin-bottom: 6px;
  }
  .table-container {
    margin-top: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    overflow: hidden;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th {
    background-color: #0284c7;
    color: #ffffff;
    font-weight: 600;
    padding: 8px 12px;
    text-align: left;
  }
  td {
    padding: 8px 12px;
    border-top: 1px solid #e2e8f0;
    color: #1e293b;
  }
  tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .text-right {
    text-align: right;
  }
  .font-semibold {
    font-weight: 600;
  }
  .signature-section {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .sign-box {
    width: 200px;
    text-align: center;
  }
  .sign-img {
    height: 50px;
    margin-bottom: 8px;
  }
  .sign-line {
    border-top: 1px solid #94a3b8;
    margin-top: 8px;
    padding-top: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #334155;
  }
  .footer {
    position: absolute;
    bottom: 15mm;
    left: 20mm;
    right: 20mm;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    font-size: 10px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<!-- PAGE 1: OFFER & EMPLOYMENT DETAILS -->
<div class="page">
  <div class="header">
    <div>
      <div class="company-title">${p.LEGAL_NAME || p.BRAND_NAME || 'Hire Huub People Solution Private Limited'}</div>
      <div class="company-subtitle">${p.BRAND_ADDRESS || 'Kolkata, West Bengal'} | ${p.BRAND_EMAIL || 'hr@hirehuub.in'}</div>
    </div>
  </div>

  <div class="doc-title">Offer Letter</div>

  <div class="meta-grid">
    <div class="meta-item"><span>Offer Ref:</span> ${p.OFFER_REFERENCE}</div>
    <div class="meta-item"><span>Offer Date:</span> ${p.OFFER_DATE}</div>
    <div class="meta-item"><span>Joining Date:</span> ${p.JOINING_DATE}</div>
  </div>

  <div class="section-title">1. Candidate Information</div>
  <div class="info-grid">
    <div class="info-row"><div class="info-label">Candidate Name:</div><div class="info-value">${p.PERSON_NAME}</div></div>
    <div class="info-row"><div class="info-label">Email Address:</div><div class="info-value">${p.PERSON_EMAIL}</div></div>
    <div class="info-row"><div class="info-label">Mobile Number:</div><div class="info-value">${p.PERSON_PHONE}</div></div>
    <div class="info-row"><div class="info-label">Current Address:</div><div class="info-value">${p.PERSON_ADDRESS}</div></div>
  </div>

  <div class="section-title">2. Introduction & Welcome</div>
  <p>
    Dear <strong>${p.PERSON_NAME}</strong>,<br><br>
    We are pleased to extend an offer of employment for the position of <strong>${p.DESIGNATION}</strong> with <strong>${p.LEGAL_NAME || p.BRAND_NAME}</strong>. We were highly impressed with your background and achievements during our evaluation process and are confident that your skills will make a vital contribution to our team.
  </p>

  <div class="section-title">3. Employment Terms</div>
  <div class="info-grid">
    <div class="info-row"><div class="info-label">Designation:</div><div class="info-value">${p.DESIGNATION}</div></div>
    <div class="info-row"><div class="info-label">Department:</div><div class="info-value">${p.DEPARTMENT}</div></div>
    <div class="info-row"><div class="info-label">Work Location:</div><div class="info-value">${p.WORK_LOCATION}</div></div>
    <div class="info-row"><div class="info-label">Reporting Manager:</div><div class="info-value">${p.REPORTING_MANAGER}</div></div>
  </div>

  <div class="footer">
    <div>${p.BRAND_NAME || 'Hire Huub'} • Strictly Confidential</div>
    <div>Page 1 of 3</div>
  </div>
</div>

<!-- PAGE 2: TERMS & CONDITIONS -->
<div class="page">
  <div class="header">
    <div>
      <div class="company-title">${p.LEGAL_NAME || p.BRAND_NAME || 'Hire Huub People Solution Private Limited'}</div>
      <div class="company-subtitle">Offer Reference: ${p.OFFER_REFERENCE}</div>
    </div>
  </div>

  <div class="section-title">4. Roles & Responsibilities</div>
  <ol>
    <li>Perform the responsibilities assigned to the role with diligence, professionalism, and accountability.</li>
    <li>Maintain accurate, timely, and professional communication with all internal and external stakeholders.</li>
    <li>Meet agreed performance, quality, security, and statutory compliance expectations of the organization.</li>
    <li>Collaborate actively with your reporting manager and team members to achieve company objectives.</li>
  </ol>

  <div class="section-title">5. General Terms & Conditions</div>
  <ol>
    <li><strong>Probation & Confirmation:</strong> You will be on probation for a period as per Company policy from your Joining Date. Confirmation is subject to satisfactory performance.</li>
    <li><strong>Confidentiality:</strong> You shall maintain strict confidentiality regarding company data, customer details, trade secrets, and financial information during and after your employment.</li>
    <li><strong>Code of Conduct:</strong> You agree to abide by all rules, policies, and regulations established by the Company as amended from time to time.</li>
    <li><strong>Notice Period:</strong> Termination of employment by either party shall require standard notice period as governed by Company service regulations.</li>
  </ol>

  <div class="section-title">6. Statutory & Tax Provisions</div>
  <p>
    Provident Fund (PF) and Employee State Insurance (ESI) contributions, along with Professional Tax (PT) and TDS deductions, will be administered strictly in accordance with statutory government regulations.
  </p>

  <div class="footer">
    <div>${p.BRAND_NAME || 'Hire Huub'} • Confidential</div>
    <div>Page 2 of 3</div>
  </div>
</div>

<!-- PAGE 3: ANNEXURE A - SALARY BREAKDOWN & ACCEPTANCE -->
<div class="page">
  <div class="header">
    <div>
      <div class="company-title">${p.LEGAL_NAME || p.BRAND_NAME || 'Hire Huub People Solution Private Limited'}</div>
      <div class="company-subtitle">ANNEXURE A — SALARY STRUCTURE</div>
    </div>
  </div>

  <div class="section-title">Annexure A: Itemized Compensation Breakup</div>
  <p>Candidate: <strong>${p.PERSON_NAME}</strong> | Offer Ref: <strong>${p.OFFER_REFERENCE}</strong></p>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Salary Component</th>
          <th class="text-right">Monthly (₹)</th>
          <th class="text-right">Annual (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Basic Pay</td><td class="text-right">${p.BASIC_MONTHLY}</td><td class="text-right">${p.BASIC_ANNUAL}</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td class="text-right">${p.HRA_MONTHLY}</td><td class="text-right">${p.HRA_ANNUAL}</td></tr>
        <tr><td>Special Allowance</td><td class="text-right">${p.SPECIAL_MONTHLY}</td><td class="text-right">${p.SPECIAL_ANNUAL}</td></tr>
        <tr class="font-semibold"><td>Gross Salary</td><td class="text-right">${p.MONTHLY_GROSS}</td><td class="text-right">${p.ANNUAL_GROSS}</td></tr>
        <tr><td>Employee PF</td><td class="text-right">${p.EMPLOYEE_PF_MONTHLY}</td><td class="text-right">${p.EMPLOYEE_PF_ANNUAL}</td></tr>
        <tr><td>Employee ESI</td><td class="text-right">${p.EMPLOYEE_ESI_MONTHLY}</td><td class="text-right">${p.EMPLOYEE_ESI_ANNUAL}</td></tr>
        <tr><td>Professional Tax (PT)</td><td class="text-right">${p.PROFESSIONAL_TAX_MONTHLY}</td><td class="text-right">${p.PROFESSIONAL_TAX_ANNUAL}</td></tr>
        <tr class="font-semibold" style="background-color: #f1f5f9;"><td>Net Take Home Pay</td><td class="text-right">${p.NET_TAKE_HOME_MONTHLY}</td><td class="text-right">${p.NET_TAKE_HOME_ANNUAL}</td></tr>
        <tr class="font-semibold" style="background-color: #e0f2fe;"><td>Annual CTC</td><td class="text-right">-</td><td class="text-right">${p.ANNUAL_GROSS}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section-title">7. Candidate Acceptance</div>
  <p>
    I have read, understood, and accept the terms and conditions of employment outlined in this Offer Letter and Annexure A.
  </p>

  <div class="signature-section">
    <div class="sign-box">
      <div class="sign-line">Authorized Signatory<br>(${p.REPORTING_MANAGER || 'Hire Huub Management'})</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">Candidate Signature<br>(${p.PERSON_NAME})</div>
    </div>
  </div>

  <div class="footer">
    <div>${p.BRAND_NAME || 'Hire Huub'} • Confidential</div>
    <div>Page 3 of 3</div>
  </div>
</div>

</body>
</html>`;
}
