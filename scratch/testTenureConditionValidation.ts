import { formatTenureCondition } from '../apps/web/src/types/ClientCommercial';
import type { CreateClientInput } from '../apps/web/src/types/Client';

// Helper to simulate clientService validateClientInput logic
function validateClientInput(input: CreateClientInput): void {
  if (!input.name.trim()) throw new Error('Client Name (Short/Common Name) is required.');
  if (!input.billingName.trim()) throw new Error('Billing Name (Legal Entity Name) is required.');
  if (!input.gstin.trim()) throw new Error('GSTIN is required.');
  if (!input.state.trim()) throw new Error('State is required.');
  if (!input.invoiceConfig.templateReference.trim()) throw new Error('Invoice Template Reference is required.');

  if (input.commercial?.type === 'OTS') {
    const tenure = input.commercial.tenureCondition;
    if (tenure === undefined || tenure === null || (typeof tenure === 'string' && (tenure as string).trim() === '')) {
      throw new Error('Tenure Condition is required for OTS clients.');
    }
    const num = typeof tenure === 'number' ? tenure : Number(tenure);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      throw new Error('Tenure Condition must be a valid whole number of at least 1 day.');
    }
  }
}

function buildDummyInput(type: 'OTS' | 'Payroll', tenure?: any): CreateClientInput {
  return {
    name: 'Test Client',
    billingName: 'Test Client Pvt Ltd',
    gstin: '19AABCT1234F1Z1',
    state: 'West Bengal',
    type: type === 'OTS' ? 'OTS Client' : 'Payroll Client',
    status: 'Active',
    points: 10,
    highlights: [],
    commercial: {
      type,
      points: 10,
      payoutType: 'Amount',
      payoutAmount: 10000,
      tenureCondition: tenure,
      poRequired: true,
    },
    gstConfig: {
      gstMode: 'India',
      scopeChoice: 'India',
      oneGstForAllIndia: true,
      isGstOptional: false,
      stateGstRecords: [],
    },
    spocs: [],
    invoiceConfig: {
      templateId: '',
      templateName: 'All',
      templateVersion: 1,
      templateReference: 'All',
      storagePath: '',
      referenceName: 'All',
      documentId: '',
    },
  };
}

console.log('=== OTS Tenure Condition Verification Suite ===\n');

// Valid numbers
const validNumbers = [30, 45, 60, 90, 120, 180, 365];
for (const val of validNumbers) {
  const input = buildDummyInput('OTS', val);
  validateClientInput(input);
  const formatted = formatTenureCondition(input.commercial.tenureCondition);
  if (formatted !== `${val} Days`) {
    throw new Error(`Expected "${val} Days", got "${formatted}"`);
  }
  console.log(`[PASS] Valid OTS Tenure ${val} -> Formatted: "${formatted}"`);
}

// Invalid numbers
const invalidValues = [
  { val: 0, reason: 'Zero value (0)' },
  { val: -10, reason: 'Negative number (-10)' },
  { val: 45.5, reason: 'Decimal value (45.5)' },
  { val: undefined, reason: 'Missing tenure' },
  { val: '', reason: 'Empty string' },
];

for (const item of invalidValues) {
  try {
    const input = buildDummyInput('OTS', item.val);
    validateClientInput(input);
    console.error(`[FAIL] Expected rejection for ${item.reason}, but it passed!`);
    process.exit(1);
  } catch (err: any) {
    console.log(`[PASS] Rejected ${item.reason}: "${err.message}"`);
  }
}

// Non-OTS (Payroll) with undefined tenureCondition
try {
  const input = buildDummyInput('Payroll', undefined);
  validateClientInput(input);
  console.log('[PASS] Non-OTS (Payroll) without tenure condition validated successfully.');
} catch (err: any) {
  console.error(`[FAIL] Non-OTS should not require tenure: ${err.message}`);
  process.exit(1);
}

console.log('\n=== ALL TENURE CONDITION VERIFICATIONS PASSED ===');
