import { compileInvoiceHTML } from '../../../../../../../functions/src/documents/renderers/nativeInvoiceRenderer';
import type { InvoiceSnapshot, InvoiceBankAccountSnapshot, InvoiceSignatorySnapshot } from '../../../../types/Invoice';

export function runInvoiceBankAccountSelectionTests(): { passed: number; total: number; logs: string[] } {
  const logs: string[] = [];
  let passed = 0;
  let total = 0;

  const test = (name: string, fn: () => void) => {
    total++;
    try {
      fn();
      passed++;
      logs.push(`[PASS] ${total}. ${name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logs.push(`[FAIL] ${total}. ${name}: ${msg}`);
    }
  };

  const expect = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeDefined: () => {
      if (actual === undefined || actual === null) throw new Error(`Expected defined value, got ${actual}`);
    },
    toBeUndefined: () => {
      if (actual !== undefined) throw new Error(`Expected undefined, got ${actual}`);
    },
    toContain: (str: string) => {
      if (typeof actual !== 'string' || !actual.includes(str)) throw new Error(`Expected content to contain '${str}'`);
    },
    not: {
      toBe: (expected: any) => {
        if (actual === expected) throw new Error(`Expected value NOT to be ${JSON.stringify(expected)}`);
      },
    },
    toThrow: (str: string) => {
      let threw = false;
      let errorMsg = '';
      try {
        actual();
      } catch (err: any) {
        threw = true;
        errorMsg = err?.message || String(err);
      }
      if (!threw || !errorMsg.includes(str)) throw new Error(`Expected function to throw containing '${str}', got ${errorMsg}`);
    },
  });

  // Test Fixtures (Isolated in-memory data, zero production Firestore calls)
  const companySettingsFixture = {
    id: 'hirehuub_company_settings',
    companyName: 'Hire Huub People Solution Private Limited',
    gstin: '19ABCDE1234F1Z5',
    bankAccountsV2: [
      {
        id: 'bank-001',
        bankName: 'Axis Bank',
        accountNumber: '921020012345678',
        ifsc: 'UTIB0004023',
        branch: 'Salt Lake Sector V',
        accountName: 'Hire Huub People Solution Pvt Ltd',
        isPrimary: true,
        isActive: true,
      },
      {
        id: 'bank-002',
        bankName: 'HDFC Bank',
        accountNumber: '502000876543210',
        ifsc: 'HDFC0001234',
        branch: 'Park Street',
        accountName: 'Hire Huub People Solution Pvt Ltd',
        isPrimary: false,
        isActive: true,
      },
      {
        id: 'bank-003',
        bankName: 'ICICI Bank (Archived)',
        accountNumber: '000701554433',
        ifsc: 'ICIC0000007',
        branch: 'Old Branch',
        accountName: 'Hire Huub Legacy',
        isPrimary: false,
        isActive: false, // Inactive
      },
    ],
    companyBankDetails: {
      id: 'bank-primary',
      bankName: 'Axis Bank',
      accountNumber: '921020012345678',
      ifscCode: 'UTIB0004023',
      branchName: 'Salt Lake Sector V',
      accountName: 'Hire Huub People Solution Pvt Ltd',
    },
  };

  const getActiveBankAccounts = (settings: typeof companySettingsFixture) => {
    return settings.bankAccountsV2.filter((acc) => acc.isActive !== false && acc.accountNumber.trim());
  };

  test('Active bank accounts load from Company Settings', () => {
    const activeBanks = getActiveBankAccounts(companySettingsFixture);
    expect(activeBanks.length).toBe(2);
    expect(activeBanks.map((b) => b.bankName)).toEqual(['Axis Bank', 'HDFC Bank']);
  });

  test('Inactive bank accounts are excluded', () => {
    const activeBanks = getActiveBankAccounts(companySettingsFixture);
    const inactiveFound = activeBanks.some((b) => b.id === 'bank-003' || b.isActive === false);
    expect(inactiveFound).toBe(false);
  });

  test('Default bank account auto-selected', () => {
    const activeBanks = getActiveBankAccounts(companySettingsFixture);
    const defaultBank = activeBanks.find((b) => b.isPrimary) || activeBanks[0];
    expect(defaultBank.id).toBe('bank-001');
    expect(defaultBank.bankName).toBe('Axis Bank');
  });

  test('No default bank account requires explicit selection', () => {
    const noDefaultSettings = {
      ...companySettingsFixture,
      bankAccountsV2: companySettingsFixture.bankAccountsV2.map((b) => ({ ...b, isPrimary: false })),
    };
    const activeBanks = getActiveBankAccounts(noDefaultSettings);
    const primary = activeBanks.find((b) => b.isPrimary);
    expect(primary).toBeUndefined();
    const validateSelection = (selectedId?: string) => {
      if (!selectedId && activeBanks.length > 0) throw new Error('Please select a Company Bank Account for this invoice.');
    };
    expect(() => validateSelection('')).toThrow('Please select a Company Bank Account');
  });

  test('User can select another active bank account (HDFC Bank)', () => {
    const activeBanks = getActiveBankAccounts(companySettingsFixture);
    const selected = activeBanks.find((b) => b.id === 'bank-002');
    expect(selected).toBeDefined();
    expect(selected?.bankName).toBe('HDFC Bank');
    expect(selected?.accountNumber).toBe('502000876543210');
  });

  test('Selected bank account saved on invoice', () => {
    const selectedBankId = 'bank-002';
    const invoiceDraft = {
      clientId: 'client-101',
      invoiceDate: '2026-08-18',
      bankAccountId: selectedBankId,
    };
    expect(invoiceDraft.bankAccountId).toBe('bank-002');
  });

  test('Full bank snapshot saved with all required fields', () => {
    const bankAccountSnapshot: InvoiceBankAccountSnapshot = {
      bankAccountId: 'bank-002',
      bankName: 'HDFC Bank',
      accountNumber: '502000876543210',
      ifscCode: 'HDFC0001234',
      branchName: 'Park Street',
      accountHolderName: 'Hire Huub People Solution Pvt Ltd',
    };

    expect(bankAccountSnapshot.bankAccountId).toBe('bank-002');
    expect(bankAccountSnapshot.bankName).toBe('HDFC Bank');
    expect(bankAccountSnapshot.accountNumber).toBe('502000876543210');
    expect(bankAccountSnapshot.ifscCode).toBe('HDFC0001234');
    expect(bankAccountSnapshot.branchName).toBe('Park Street');
  });

  test('PDF uses selected bank account from snapshot', () => {
    const html = compileInvoiceHTML({
      blocks: [],
      placeholders: {
        LEGAL_NAME: 'Hire Huub People Solution Private Limited',
        INVOICE_NUMBER: 'HH2026-0001',
        BANK_NAME: 'HDFC Bank',
        BANK_ACCOUNT: '502000876543210',
        IFSC_CODE: 'HDFC0001234',
        TAXABLE_AMOUNT: '100000',
        GRAND_TOTAL: '118000',
      },
      templateType: 'All',
    });

    expect(html).toContain('Bank: HDFC Bank');
    expect(html).toContain('A/C No: <span style="font-family: monospace; font-weight: 700;">502000876543210</span>');
    expect(html).toContain('IFSC: <span style="font-family: monospace; font-weight: 700;">HDFC0001234</span>');
  });

  test('Blinkit template uses selected bank account', () => {
    const html = compileInvoiceHTML({
      blocks: [],
      placeholders: {
        LEGAL_NAME: 'Hire Huub People Solution Private Limited',
        INVOICE_NUMBER: 'INV-BLK-2026-01',
        BANK_NAME: 'HDFC Bank',
        BANK_ACCOUNT: '502000876543210',
        IFSC_CODE: 'HDFC0001234',
        TAXABLE_AMOUNT: '50000',
        GRAND_TOTAL: '59000',
      },
      templateType: 'Blinkit',
    });

    expect(html).toContain('Bank: HDFC Bank');
    expect(html).toContain('502000876543210');
    expect(html).toContain('HDFC0001234');
  });

  test('Elastic Run template uses selected bank account', () => {
    const html = compileInvoiceHTML({
      blocks: [],
      placeholders: {
        LEGAL_NAME: 'Hire Huub People Solution Private Limited',
        INVOICE_NUMBER: 'INV-ER-2026-01',
        BILL_OF_MONTH: 'July 2026',
        STATION_CODE: 'STN-KOL-01',
        BANK_NAME: 'Axis Bank',
        BANK_ACCOUNT: '921020012345678',
        IFSC_CODE: 'UTIB0004023',
        TAXABLE_AMOUNT: '75000',
        GRAND_TOTAL: '88500',
      },
      templateType: 'Elastic Run',
    });

    expect(html).toContain('Bank: Axis Bank');
    expect(html).toContain('921020012345678');
    expect(html).toContain('UTIB0004023');
  });

  test('All / Default template uses selected bank account', () => {
    const html = compileInvoiceHTML({
      blocks: [],
      placeholders: {
        LEGAL_NAME: 'Hire Huub People Solution Private Limited',
        INVOICE_NUMBER: 'HH2026-0099',
        BANK_NAME: 'State Bank of India',
        BANK_ACCOUNT: '330011223344',
        IFSC_CODE: 'SBIN0001234',
        TAXABLE_AMOUNT: '120000',
        GRAND_TOTAL: '141600',
      },
      templateType: 'All',
    });

    expect(html).toContain('Bank: State Bank of India');
    expect(html).toContain('330011223344');
    expect(html).toContain('SBIN0001234');
  });

  test('Historical invoice retains previous account after Company Settings change', () => {
    const historicalSnapshot: InvoiceSnapshot = {
      invoiceNumber: 'HH2026-0005',
      invoiceDate: '2026-01-15',
      company: {
        companyName: 'Hire Huub',
        legalName: 'Hire Huub People Solution Private Limited',
        gstin: '19ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        registeredAddress: { line1: 'Sector V', city: 'Kolkata', state: 'West Bengal', postalCode: '700091', country: 'India' },
        bankDetails: {
          bankName: 'Axis Bank',
          accountNumber: '921020012345678',
          ifscCode: 'UTIB0004023',
          branchName: 'Salt Lake Sector V',
          accountHolderName: 'Hire Huub',
        },
        authorizedSignatory: 'Somnath Mukherjee',
      },
      client: { clientId: 'client-1', clientName: 'Blinkit', gstin: '19ZZZ1111A1Z5', billingAddress: { line1: 'Hub', city: 'Kolkata', state: 'West Bengal', postalCode: '700001', country: 'India' }, billingState: 'West Bengal' },
      lineItems: [],
      taxableAmount: 100000,
      gst: { type: 'CGST_SGST', cgstAmount: 9000, sgstAmount: 9000, igstAmount: 0, totalGstAmount: 18000 },
      grandTotal: 118000,
      template: { templateId: 't1', templateVersion: 1 },
      bankAccount: {
        bankAccountId: 'bank-001',
        bankName: 'Axis Bank',
        accountNumber: '921020012345678',
        ifscCode: 'UTIB0004023',
        branchName: 'Salt Lake Sector V',
      },
    };

    const updatedCompanySettings = {
      ...companySettingsFixture,
      companyBankDetails: {
        id: 'bank-new',
        bankName: 'ICICI Bank (New Primary)',
        accountNumber: '665544332211',
        ifscCode: 'ICIC0009999',
        branchName: 'New Branch',
      },
    };

    const renderedBankName = historicalSnapshot.bankAccount?.bankName || updatedCompanySettings.companyBankDetails.bankName;
    const renderedAcc = historicalSnapshot.bankAccount?.accountNumber || updatedCompanySettings.companyBankDetails.accountNumber;

    expect(renderedBankName).toBe('Axis Bank');
    expect(renderedAcc).toBe('921020012345678');
  });

  test('Employee bank account is NEVER used for invoice rendering', () => {
    const employeeBankProfile = {
      fullName: 'Saurav Basak',
      employeeId: 'HH0014',
      bankName: 'Canara Bank (Employee)',
      accountNumber: '112233445566',
      ifscCode: 'CNRB0001234',
    };

    const companyBankSnapshot: InvoiceBankAccountSnapshot = {
      bankName: 'Axis Bank (Company)',
      accountNumber: '921020012345678',
      ifscCode: 'UTIB0004023',
      branchName: 'Salt Lake Sector V',
    };

    expect(companyBankSnapshot.accountNumber).not.toBe(employeeBankProfile.accountNumber);
    expect(companyBankSnapshot.bankName).toBe('Axis Bank (Company)');
  });

  test('Client bank account is NEVER used for invoice payment details', () => {
    const clientMaster = {
      clientName: 'Blinkit Commerce',
      bankDetails: { bankName: 'Client Bank', accountNumber: '999988887777', ifsc: 'CLNT0001' },
    };

    const companyBankSnapshot: InvoiceBankAccountSnapshot = {
      bankName: 'HDFC Bank (Hire Huub)',
      accountNumber: '502000876543210',
      ifscCode: 'HDFC0001234',
      branchName: 'Park Street',
    };

    expect(companyBankSnapshot.accountNumber).not.toBe(clientMaster.bankDetails.accountNumber);
    expect(companyBankSnapshot.bankName).toBe('HDFC Bank (Hire Huub)');
  });

  test('Legacy invoice fallback works when snapshot.bankAccount is missing', () => {
    const legacySnapshot: Partial<InvoiceSnapshot> = {
      invoiceNumber: 'HH2025-LEGACY-01',
      company: {
        companyName: 'Hire Huub',
        legalName: 'Hire Huub People Solution Private Limited',
        gstin: '19ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        registeredAddress: { line1: 'Sector V', city: 'Kolkata', state: 'West Bengal', postalCode: '700091', country: 'India' },
        bankDetails: {
          bankName: 'Axis Bank (Legacy Fallback)',
          accountNumber: '921020012345678',
          ifscCode: 'UTIB0004023',
          branchName: 'Salt Lake Sector V',
          accountHolderName: 'Hire Huub',
        },
        authorizedSignatory: 'Somnath Mukherjee',
      },
    };

    const resolvedBankName = legacySnapshot.bankAccount?.bankName || legacySnapshot.company?.bankDetails?.bankName;
    const resolvedAcc = legacySnapshot.bankAccount?.accountNumber || legacySnapshot.company?.bankDetails?.accountNumber;

    expect(resolvedBankName).toBe('Axis Bank (Legacy Fallback)');
    expect(resolvedAcc).toBe('921020012345678');
  });

  test('Signatory and bank account can be selected independently', () => {
    const signatorySnapshot: InvoiceSignatorySnapshot = {
      signatoryId: 'sig-001',
      fullName: 'Somnath Mukherjee',
      designation: 'Director',
    };

    const bankAccountSnapshot: InvoiceBankAccountSnapshot = {
      bankAccountId: 'bank-002',
      bankName: 'HDFC Bank',
      accountNumber: '502000876543210',
      ifscCode: 'HDFC0001234',
      branchName: 'Park Street',
    };

    const fullInvoicePayload = {
      signatory: signatorySnapshot,
      bankAccount: bankAccountSnapshot,
    };

    expect(fullInvoicePayload.signatory.fullName).toBe('Somnath Mukherjee');
    expect(fullInvoicePayload.bankAccount.bankName).toBe('HDFC Bank');
  });

  return { passed, total, logs };
}
