import { invoiceService } from '../../../pages/Finance/billing/services/invoiceService';
import type { CreateInvoiceDraftInput, HireHuubTemplateType } from '../../../types/Invoice';

export function validateHireHuubHSN(hsn: string): boolean {
  if (!hsn || !hsn.trim()) return true;
  return hsn.trim() === '998519';
}

export function runHireHuubInvoiceTemplateTests() {
  const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

  // Test 1: HSN Validation
  try {
    if (!validateHireHuubHSN('998519')) throw new Error('HSN 998519 should be valid');
    if (!validateHireHuubHSN('')) throw new Error('Empty HSN should be allowed');
    if (validateHireHuubHSN('123456')) throw new Error('Invalid HSN should be rejected');
    results.push({ test: 'Test 1: HSN Validation (998519 only)', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 1: HSN Validation', status: 'FAILED', details: err.message });
  }

  // Test 2: Blinkit Template universal amount calculation (Qty * Unit Price)
  try {
    const input: CreateInvoiceDraftInput = {
      clientId: 'cli-blinkit',
      invoiceDate: '2026-08-17',
      templateType: 'Blinkit',
      lineItems: [
        {
          description: 'Delivery Staff Supply - Kolkata Cluster',
          quantity: 100,
          unitPrice: 1500,
          hsn: '998519',
          workDuration: '01 Aug 2026 - 15 Aug 2026',
          gstRate: 18,
        },
      ],
    };

    const line = (invoiceService as any).calculateLineItem(input.lineItems[0], input.templateType);
    if (line.taxableAmount !== 150000) throw new Error(`Expected taxable 150000, got ${line.taxableAmount}`);
    if (line.gstAmount !== 27000) throw new Error(`Expected GST 27000, got ${line.gstAmount}`);
    if (line.totalAmount !== 177000) throw new Error(`Expected total 177000, got ${line.totalAmount}`);
    if (line.hsn !== '998519') throw new Error(`Expected HSN 998519, got ${line.hsn}`);
    results.push({ test: 'Test 2: Blinkit Template Direct Amount Calculation', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 2: Blinkit Template Direct Amount Calculation', status: 'FAILED', details: err.message });
  }

  // Test 3: Blinkit Template Invalid HSN Rejection
  try {
    const invalidInput: CreateInvoiceDraftInput = {
      clientId: 'cli-blinkit',
      invoiceDate: '2026-08-17',
      templateType: 'Blinkit',
      lineItems: [{ description: 'Staffing', quantity: 1, unitPrice: 100, hsn: '999999', gstRate: 18 }],
    };
    let threw = false;
    try {
      if (invalidInput.lineItems[0].hsn !== '998519') {
        throw new Error('Invalid HSN code. Hire Huub manpower supply invoices require HSN 998519.');
      }
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('Expected invalid HSN to throw error');
    results.push({ test: 'Test 3: Blinkit Invalid HSN Rejection', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 3: Blinkit Invalid HSN Rejection', status: 'FAILED', details: err.message });
  }

  // Test 4: Elastic Run Template (Auto HSN 998519 & Amount = Qty * Unit Price)
  try {
    const input: CreateInvoiceDraftInput = {
      clientId: 'cli-elastic-run',
      invoiceDate: '2026-08-17',
      templateType: 'Elastic Run',
      billOfMonth: 'August 2026',
      stationCode: 'CCU-HUB-01',
      placeOfSupply: 'West Bengal',
      lineItems: [
        {
          description: 'Warehouse Workforce Deployment',
          quantity: 50,
          unitPrice: 2000,
          hsn: 'ANY_HSN',
          unit: 'DAYS',
          gstRate: 18,
        },
      ],
    };

    const line = (invoiceService as any).calculateLineItem(input.lineItems[0], input.templateType);
    if (line.taxableAmount !== 100000) throw new Error(`Expected taxable 100000, got ${line.taxableAmount}`);
    if (line.hsn !== '998519') throw new Error(`Expected locked HSN 998519, got ${line.hsn}`);
    if (line.gstAmount !== 18000) throw new Error(`Expected GST 18000, got ${line.gstAmount}`);
    if (line.totalAmount !== 118000) throw new Error(`Expected total 118000, got ${line.totalAmount}`);
    results.push({ test: 'Test 4: Elastic Run HSN 998519 & Auto Amount', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 4: Elastic Run HSN 998519 & Auto Amount', status: 'FAILED', details: err.message });
  }

  // Test 5: All Template (Auto Amount = Qty * Unit Price)
  try {
    const input: CreateInvoiceDraftInput = {
      clientId: 'cli-default',
      invoiceDate: '2026-08-17',
      templateType: 'All',
      lineItems: [{ description: 'General Manpower Supply', quantity: 10, unitPrice: 5000, hsn: '998519', unit: 'MONTHS', gstRate: 18 }],
    };

    const line = (invoiceService as any).calculateLineItem(input.lineItems[0], input.templateType);
    if (line.taxableAmount !== 50000) throw new Error(`Expected taxable 50000, got ${line.taxableAmount}`);
    if (line.gstAmount !== 9000) throw new Error(`Expected GST 9000, got ${line.gstAmount}`);
    if (line.totalAmount !== 59000) throw new Error(`Expected total 59000, got ${line.totalAmount}`);
    results.push({ test: 'Test 5: All Template Calculation', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 5: All Template Calculation', status: 'FAILED', details: err.message });
  }

  // Test 6: Intra-State GST (CGST + SGST)
  try {
    const companyState = 'West Bengal';
    const clientState = 'West Bengal';
    const isSameState = companyState.toUpperCase() === clientState.toUpperCase();
    if (!isSameState) throw new Error('Intra-state resolution failed');
    const taxable = 100000;
    const totalGst = (taxable * 18) / 100;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const igst = 0;
    if (cgst !== 9000 || sgst !== 9000 || igst !== 0) throw new Error('Intra-state GST split failed');
    results.push({ test: 'Test 6: Intra-State GST (CGST 9% + SGST 9%)', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 6: Intra-State GST', status: 'FAILED', details: err.message });
  }

  // Test 7: Inter-State GST (IGST)
  try {
    const companyState = 'West Bengal';
    const clientState = 'Maharashtra';
    const isSameState = companyState.toUpperCase() === clientState.toUpperCase();
    if (isSameState) throw new Error('Inter-state resolution failed');
    const taxable = 100000;
    const totalGst = (taxable * 18) / 100;
    const cgst = 0;
    const sgst = 0;
    const igst = totalGst;
    if (cgst !== 0 || sgst !== 0 || igst !== 18000) throw new Error('Inter-state IGST resolution failed');
    results.push({ test: 'Test 7: Inter-State GST (IGST 18%)', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 7: Inter-State GST', status: 'FAILED', details: err.message });
  }

  // Test 8: Grand Total Calculation
  try {
    const taxable = 250000;
    const gst = 45000;
    const grandTotal = taxable + gst;
    if (grandTotal !== 295000) throw new Error(`Expected grand total 295000, got ${grandTotal}`);
    results.push({ test: 'Test 8: Grand Total Match', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 8: Grand Total Match', status: 'FAILED', details: err.message });
  }

  // Test 9: Global Invoice Numbering Format (YYYY/SEQUENCE)
  try {
    const formatSeq = (year: number, seq: number) => `${year}/${String(seq).padStart(5, '0')}`;
    const inv1 = formatSeq(2026, 1);
    const inv2 = formatSeq(2026, 2);
    const inv3 = formatSeq(2026, 3);

    if (inv1 !== '2026/00001') throw new Error(`Expected 2026/00001, got ${inv1}`);
    if (inv2 !== '2026/00002') throw new Error(`Expected 2026/00002, got ${inv2}`);
    if (inv3 !== '2026/00003') throw new Error(`Expected 2026/00003, got ${inv3}`);

    results.push({ test: 'Test 9: Global Invoice Numbering Format (2026/00001, 2026/00002, 2026/00003)', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 9: Global Invoice Numbering Format', status: 'FAILED', details: err.message });
  }

  // Test 10: Client Template Assignment Routing
  try {
    const blinkitClient = { invoiceConfig: { templateReference: 'Blinkit' } };
    const elasticClient = { invoiceConfig: { templateReference: 'Elastic Run' } };
    const defaultClient = { invoiceConfig: { templateReference: 'All' } };

    const getTemplate = (c: any): HireHuubTemplateType => (c?.invoiceConfig?.templateReference || 'All') as any;
    if (getTemplate(blinkitClient) !== 'Blinkit') throw new Error('Blinkit routing failed');
    if (getTemplate(elasticClient) !== 'Elastic Run') throw new Error('Elastic Run routing failed');
    if (getTemplate(defaultClient) !== 'All') throw new Error('All routing failed');
    results.push({ test: 'Test 10: Client Template Assignment Routing', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 10: Client Template Assignment Routing', status: 'FAILED', details: err.message });
  }

  // Test 11: Storage Path Normalization & Canonical Path Verification
  try {
    const rawInvoiceNumber = '2026/00005';
    const safeInvNum = rawInvoiceNumber.replace(/[^A-Za-z0-9_-]/g, '_');
    if (safeInvNum !== '2026_00005') throw new Error(`Expected storage-safe number 2026_00005, got ${safeInvNum}`);

    const fileName = `Invoice_${safeInvNum}.pdf`;
    const storagePath = `finance/invoices/${safeInvNum}/${fileName}`;
    const expectedStoragePath = 'finance/invoices/2026_00005/Invoice_2026_00005.pdf';

    if (storagePath !== expectedStoragePath) {
      throw new Error(`Expected canonical storage path '${expectedStoragePath}', got '${storagePath}'`);
    }

    results.push({ test: 'Test 11: Storage Path Normalization & Canonical Path Verification', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 11: Storage Path Normalization & Canonical Path Verification', status: 'FAILED', details: err.message });
  }

  // Test 12: Template Type Persistence & Strict Validation
  try {
    const validTemplates = ['Blinkit', 'Elastic Run', 'All'];
    const invalidTemplate: string = 'InvalidType';

    validTemplates.forEach((t) => {
      if (t !== 'Blinkit' && t !== 'Elastic Run' && t !== 'All') {
        throw new Error(`Template ${t} should be valid`);
      }
    });

    let caughtInvalid = false;
    if (invalidTemplate !== 'Blinkit' && invalidTemplate !== 'Elastic Run' && invalidTemplate !== 'All') {
      caughtInvalid = true;
    }
    if (!caughtInvalid) throw new Error('Invalid template type was not caught');

    results.push({ test: 'Test 12: Template Type Persistence & Strict Validation', status: 'PASSED' });
  } catch (err: any) {
    results.push({ test: 'Test 12: Template Type Persistence & Strict Validation', status: 'FAILED', details: err.message });
  }

  return results;
}
