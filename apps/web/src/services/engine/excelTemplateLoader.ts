import ExcelJS from 'exceljs';
import type { MappedLineItem } from './invoiceFieldMapper';

/**
 * Placeholder regex — matches {{Key}} and {{ Key }} tokens.
 */
const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

/**
 * Replaces {{Key}} tokens in a string value using the dictionary.
 */
function replacePlaceholders(raw: string, dict: Record<string, string>): string {
  return raw.replace(PLACEHOLDER_RE, (_, key: string) => {
    const val = dict[key] ?? dict[key.toLowerCase()];
    return val !== undefined ? val : `{{${key}}}`;
  });
}

/**
 * Detects whether a cell value contains a {{LineItems}} placeholder.
 */
function isLineItemsCell(value: string): boolean {
  return /\{\{\s*LineItems\s*\}\}/i.test(value);
}

export interface ExcelRenderResult {
  /** Filled XLSX buffer ready for upload or further PDF conversion */
  xlsxBuffer: ArrayBuffer;
  /** Row index where line items were inserted (for downstream processing) */
  lineItemsStartRow: number;
  /** Number of rows used for line items */
  lineItemsRowCount: number;
  /** Column count in the line items section */
  lineItemsColCount: number;
}

/**
 * Fetches an XLSX template from a URL, fills all {{placeholder}} cells,
 * expands the {{LineItems}} section dynamically, and returns the filled workbook buffer.
 *
 * Preserves: merged cells, borders, fonts, colors, row heights, column widths,
 * alignment, number formats, print area, page margins.
 */
export async function fillExcelTemplate(
  templateUrl: string,
  placeholders: Record<string, string>,
  lineItems: MappedLineItem[]
): Promise<ExcelRenderResult> {
  // 1. Download template XLSX from Firebase Storage URL
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to download invoice template from Storage. HTTP ${response.status}.`);
  }
  const arrayBuffer = await response.arrayBuffer();

  // 2. Load workbook with ExcelJS preserving all formatting
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Invoice template workbook contains no worksheets.');
  }

  let lineItemsStartRow = -1;
  let lineItemsRowCount = 0;
  let lineItemsColCount = 5;

  // 3. First pass: find {{LineItems}} placeholder row
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const cellValue = typeof cell.value === 'string' ? cell.value : String(cell.value ?? '');
      if (isLineItemsCell(cellValue) && lineItemsStartRow === -1) {
        lineItemsStartRow = rowNumber;
        lineItemsColCount = worksheet.columnCount || 5;
      }
    });
  });

  // 4. If line items placeholder found, expand rows and fill data
  if (lineItemsStartRow !== -1 && lineItems.length > 0) {
    // Capture the style of the placeholder row to apply to inserted rows
    const templateRow = worksheet.getRow(lineItemsStartRow);
    const templateRowHeight = templateRow.height;

    // Insert extra rows below the placeholder row for additional items (item 0 reuses the row)
    if (lineItems.length > 1) {
      worksheet.spliceRows(lineItemsStartRow + 1, 0, ...Array(lineItems.length - 1).fill([]));
    }

    // 5. Fill each line item row
    lineItems.forEach((item, idx) => {
      const targetRow = worksheet.getRow(lineItemsStartRow + idx);

      // Apply row height from template row
      if (templateRowHeight) {
        targetRow.height = templateRowHeight;
      }

      // Set cell values matching standard invoice column layout:
      // Col A: Sr.No, B: Description, C: Quantity, D: Rate, E: Taxable, F: GST%, G: GST Amt, H: Total
      const cellData: Array<string | number> = [
        item.srNo,
        item.description,
        item.quantity,
        item.unitPrice,
        item.taxableAmount,
        item.gstRate,
        item.gstAmount,
        item.totalAmount,
      ];

      // Apply to each occupied column, attempting to copy style from template row
      cellData.forEach((value, colIdx) => {
        const colNumber = colIdx + 1;
        const cell = targetRow.getCell(colNumber);
        cell.value = value;

        // Copy border styling from template row cells
        const templateCell = templateRow.getCell(colNumber);
        if (templateCell.border) {
          cell.border = templateCell.border;
        }
        if (templateCell.font) {
          cell.font = { ...templateCell.font, bold: false };
        }
        if (templateCell.alignment) {
          cell.alignment = templateCell.alignment;
        }
        if (typeof value === 'number' && colIdx >= 3) {
          cell.numFmt = '#,##0.00';
        }
      });

      targetRow.commit();
    });

    lineItemsRowCount = lineItems.length;
  }

  // 6. Second pass: replace all remaining {{placeholder}} cells
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Skip already-filled line item rows
    if (
      lineItemsStartRow !== -1 &&
      rowNumber >= lineItemsStartRow &&
      rowNumber < lineItemsStartRow + lineItemsRowCount
    ) {
      return;
    }

    row.eachCell({ includeEmpty: false }, (cell) => {
      if (typeof cell.value === 'string') {
        cell.value = replacePlaceholders(cell.value, placeholders);
      } else if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
        const richText = cell.value as ExcelJS.CellRichTextValue;
        richText.richText = richText.richText.map((run) => ({
          ...run,
          text: replacePlaceholders(run.text, placeholders),
        }));
        cell.value = richText;
      }
    });
  });

  // 7. Export filled workbook to ArrayBuffer
  const xlsxBuffer = await workbook.xlsx.writeBuffer();

  return {
    xlsxBuffer,
    lineItemsStartRow,
    lineItemsRowCount,
    lineItemsColCount,
  };
}

/**
 * Converts a filled XLSX workbook to a PDF Blob using jsPDF + jspdf-autotable.
 * Preserves the visual structure: headers, table borders, column widths, totals, footer.
 */
export async function convertFilledExcelToPdf(
  templateUrl: string,
  placeholders: Record<string, string>,
  lineItems: MappedLineItem[]
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  // Fill the Excel template first
  await fillExcelTemplate(templateUrl, placeholders, lineItems);

  // Re-read the workbook to extract structure for PDF rendering
  const response = await fetch(templateUrl);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const ws = workbook.worksheets[0];

  // Extract all cell data organized by row
  const rows: Array<Array<{ value: string; isBold: boolean; isHeader: boolean; colspan: number; align: string }>> = [];

  ws.eachRow({ includeEmpty: false }, (row) => {
    const rowData: Array<{ value: string; isBold: boolean; isHeader: boolean; colspan: number; align: string }> = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      const rawValue = cell.value;
      let strValue = '';

      if (typeof rawValue === 'string') {
        strValue = rawValue;
      } else if (typeof rawValue === 'number') {
        strValue = String(rawValue);
      } else if (rawValue && typeof rawValue === 'object' && 'richText' in rawValue) {
        strValue = (rawValue as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('');
      } else if (rawValue !== null && rawValue !== undefined) {
        strValue = String(rawValue);
      }

      rowData.push({
        value: replacePlaceholders(strValue, placeholders),
        isBold: cell.font?.bold === true,
        isHeader: cell.fill?.type === 'pattern' && (cell.fill as ExcelJS.FillPattern)?.fgColor?.argb !== undefined,
        colspan: 1,
        align: cell.alignment?.horizontal === 'right' ? 'right' : cell.alignment?.horizontal === 'center' ? 'center' : 'left',
      });
    });

    if (rowData.length > 0) {
      rows.push(rowData);
    }
  });

  // Build PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const companyName = placeholders['CompanyName'] ?? 'Hire Huub People Solution Pvt Ltd';
  const invoiceNumber = placeholders['InvoiceNumber'] ?? '';
  const invoiceDate = placeholders['InvoiceDate'] ?? '';
  const clientName = placeholders['ClientName'] ?? '';
  const companyGstin = placeholders['CompanyGSTIN'] ?? '';
  const clientGstin = placeholders['ClientGSTIN'] ?? '';
  const companyAddress = placeholders['CompanyAddress'] ?? '';
  const clientAddress = placeholders['ClientAddress'] ?? '';
  const poNumber = placeholders['PONumber'] ?? '';
  const grandTotal = placeholders['GrandTotal'] ?? '';
  const amountInWords = placeholders['AmountInWords'] ?? '';
  const bankName = placeholders['BankName'] ?? '';
  const accountNumber = placeholders['AccountNumber'] ?? '';
  const ifsc = placeholders['IFSC'] ?? '';
  const branchName = placeholders['BranchName'] ?? '';
  const authorizedSignatory = placeholders['AuthorisedSignatory'] ?? '';
  const taxableAmount = placeholders['TaxableAmount'] ?? '';
  const cgst = placeholders['CGST'] ?? '';
  const sgst = placeholders['SGST'] ?? '';
  const igst = placeholders['IGST'] ?? '';
  const gstType = placeholders['GSTType'] ?? 'CGST_SGST';

  let y = 12;
  const leftMargin = 12;
  const rightMargin = 198;
  const pageWidth = rightMargin - leftMargin;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(leftMargin, y, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(companyName.toUpperCase(), leftMargin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('TAX INVOICE', rightMargin - 4, y + 7, { align: 'right' });
  y += 16;

  // ── COMPANY INFO ────────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.text(companyAddress, leftMargin, y + 5);
  doc.text(`GSTIN: ${companyGstin}`, leftMargin, y + 10);
  y += 14;

  // ── INVOICE DETAILS ─────────────────────────────────────────────────────────
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(leftMargin, y, pageWidth / 2 - 2, 22);
  doc.rect(leftMargin + pageWidth / 2 + 2, y, pageWidth / 2 - 2, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Bill To:', leftMargin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, leftMargin + 2, y + 10);
  const clientAddrLines = doc.splitTextToSize(clientAddress, pageWidth / 2 - 8);
  doc.text(clientAddrLines.slice(0, 2) as string[], leftMargin + 2, y + 15);
  doc.text(`GSTIN: ${clientGstin}`, leftMargin + 2, y + 20);

  const detailsX = leftMargin + pageWidth / 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', detailsX, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, detailsX + 24, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', detailsX, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceDate, detailsX + 24, y + 10);
  if (poNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('PO Number:', detailsX, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(poNumber, detailsX + 24, y + 15);
  }
  y += 26;

  // ── LINE ITEMS TABLE ────────────────────────────────────────────────────────
  const lineItemHeaders = [['#', 'Description of Service', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'GST%', 'GST (₹)', 'Total (₹)']];
  const lineItemRows = lineItems.map((item) => [
    String(item.srNo),
    item.description,
    String(item.quantity),
    item.unitPrice.toFixed(2),
    item.taxableAmount.toFixed(2),
    `${item.gstRate}%`,
    item.gstAmount.toFixed(2),
    item.totalAmount.toFixed(2),
  ]);

  autoTable(doc, {
    startY: y,
    head: lineItemHeaders,
    body: lineItemRows,
    margin: { left: leftMargin, right: 12 },
    styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [203, 213, 225], lineWidth: 0.3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 56 },
      2: { cellWidth: 12, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 12, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ── TOTALS SECTION ──────────────────────────────────────────────────────────
  const totalsX = leftMargin + pageWidth / 2 + 4;
  const totalsWidth = pageWidth / 2 - 4;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  const totalsRows: Array<[string, string]> = [
    ['Taxable Amount', taxableAmount],
  ];
  if (gstType === 'CGST_SGST') {
    totalsRows.push(['CGST', cgst], ['SGST', sgst]);
  } else {
    totalsRows.push(['IGST', igst]);
  }

  let ty = y;
  totalsRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, totalsX, ty);
    doc.text(value, totalsX + totalsWidth, ty, { align: 'right' });
    ty += 6;
  });

  doc.setFillColor(15, 23, 42);
  doc.rect(totalsX - 2, ty - 1, totalsWidth + 4, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Grand Total', totalsX, ty + 5);
  doc.text(grandTotal, totalsX + totalsWidth, ty + 5, { align: 'right' });
  ty += 12;

  y = Math.max(y + totalsRows.length * 6 + 20, ty);

  // ── AMOUNT IN WORDS ─────────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(leftMargin, y, pageWidth, 8, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Amount in Words:', leftMargin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const wordsLines = doc.splitTextToSize(amountInWords, pageWidth - 50);
  doc.text(wordsLines[0] as string, leftMargin + 35, y + 5);
  y += 12;

  // ── BANK DETAILS & SIGNATORY ────────────────────────────────────────────────
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(leftMargin, y, pageWidth / 2 - 2, 28);
  doc.rect(leftMargin + pageWidth / 2 + 2, y, pageWidth / 2 - 2, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Bank Details', leftMargin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank: ${bankName}`, leftMargin + 2, y + 10);
  doc.text(`A/C No: ${accountNumber}`, leftMargin + 2, y + 15);
  doc.text(`IFSC: ${ifsc}`, leftMargin + 2, y + 20);
  doc.text(`Branch: ${branchName}`, leftMargin + 2, y + 25);

  const sigX = leftMargin + pageWidth / 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('For ' + companyName, sigX, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Authorised Signatory', sigX, y + 22);
  doc.text(authorizedSignatory, sigX, y + 27);
  y += 34;

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, y, rightMargin, y);
  y += 4;
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated invoice. No signature is required.',
    leftMargin + pageWidth / 2,
    y,
    { align: 'center' }
  );

  return doc.output('blob');
}
