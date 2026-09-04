import { removeUndefinedFields } from '../apps/web/src/pages/Workbench/Network/clients/repositories/clientRepository';
import type { CreateClientInput } from '../apps/web/src/types/Client';

function hasUndefined(obj: any, path = ''): string | null {
  if (obj === undefined) return path || 'root';
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return null;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const err = hasUndefined(obj[i], `${path}[${i}]`);
      if (err) return err;
    }
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;
      if (value === undefined) return fieldPath;
      const err = hasUndefined(value, fieldPath);
      if (err) return err;
    }
  }
  return null;
}

console.log('Running Client Firestore Payload Serialization Tests...\n');

// Test Case 1: Percentage Payout Mode
const input1: CreateClientInput = {
  name: 'Blinkit Commerce',
  billingName: 'Blinkit Commerce Private Limited',
  gstin: '19AABCB1234F1Z1',
  state: 'West Bengal',
  type: 'Payroll Client',
  status: 'Active',
  points: 10,
  highlights: ['New Client'],
  commercial: {
    type: 'Payroll',
    points: 10,
    payoutType: 'Percentage',
    percentageBasis: 'Annual CTC',
    percentageRate: 8.33,
    payoutAmount: 0,
    tenureCondition: 90,
    poRequired: true,
  },
  gstConfig: {
    gstMode: 'India',
    scopeChoice: 'India',
    oneGstForAllIndia: true,
    isGstOptional: false,
    stateGstRecords: [
      {
        id: 'gst-rec-1',
        stateCode: '19',
        stateName: 'West Bengal',
        gstin: '19AABCB1234F1Z1',
        billingName: 'Blinkit Commerce Private Limited',
        billingAddress: { line1: 'Sector V', city: 'Kolkata', state: 'West Bengal', postalCode: '700091', country: 'India' },
        templateReference: 'Blinkit',
        templateVersion: 1,
        isGstOptional: false,
        isPrimary: true,
        isActive: true,
      },
    ],
  },
  spocs: [],
  invoiceConfig: {
    templateId: '',
    templateName: 'Blinkit',
    templateVersion: 1,
    templateReference: 'Blinkit',
    storagePath: '',
    referenceName: 'Blinkit',
    documentId: '',
  },
};

const clean1 = removeUndefinedFields(input1);
const err1 = hasUndefined(clean1);
if (err1) {
  console.error(`[FAILED] Test 1: Undefined field found at ${err1}`);
  process.exit(1);
} else {
  console.log('[PASSED] Test 1: Percentage Payout Mode (payoutAmount = 0, zero undefined)');
}

// Test Case 2: Amount Payout Mode
const input2: CreateClientInput = {
  name: 'Elastic Run Logistics',
  billingName: 'Ninjacart / Elastic Run Logistics Ltd',
  gstin: '27AABCE9988F1Z2',
  state: 'Maharashtra',
  type: 'OTS Client',
  status: 'Active',
  points: 15,
  highlights: ['OTS Logistics'],
  commercial: {
    type: 'OTS',
    points: 15,
    payoutType: 'Amount',
    percentageBasis: 'Annual CTC',
    percentageRate: 0,
    payoutAmount: 15000,
    tenureCondition: 90,
    poRequired: false,
  },
  gstConfig: {
    gstMode: 'IndividualStates',
    scopeChoice: 'IndividualStates',
    oneGstForAllIndia: false,
    isGstOptional: false,
    stateGstRecords: [
      {
        id: 'gst-rec-1',
        stateCode: '27',
        stateName: 'Maharashtra',
        gstin: '27AABCE9988F1Z2',
        billingName: 'Elastic Run Logistics Ltd',
        billingAddress: { line1: 'Hinjewadi Phase 1', city: 'Pune', state: 'Maharashtra', postalCode: '411057', country: 'India' },
        templateReference: 'Elastic Run',
        templateVersion: 1,
        isGstOptional: false,
        isPrimary: true,
        isActive: true,
      },
    ],
  },
  spocs: [],
  invoiceConfig: {
    templateId: '',
    templateName: 'Elastic Run',
    templateVersion: 1,
    templateReference: 'Elastic Run',
    storagePath: '',
    referenceName: 'Elastic Run',
    documentId: '',
  },
};

const clean2 = removeUndefinedFields(input2);
const err2 = hasUndefined(clean2);
if (err2) {
  console.error(`[FAILED] Test 2: Undefined field found at ${err2}`);
  process.exit(1);
} else {
  console.log('[PASSED] Test 2: Amount Payout Mode (percentageRate = 0, zero undefined)');
}

// Test Case 3: Optional Location / GST Fields Sanitization
const rawWithUndefined: any = {
  name: 'Sample Enterprise',
  billingName: 'Sample Enterprise Private Limited',
  gstin: '19AABCS1111F1Z0',
  state: 'West Bengal',
  type: 'Payroll Client',
  status: 'Active',
  points: 0,
  commercial: {
    type: 'Payroll',
    points: 0,
    payoutType: 'Percentage',
    percentageRate: 5,
    payoutAmount: undefined, // simulates undefined input
  },
  optionalNotes: undefined,
};

const clean3 = removeUndefinedFields(rawWithUndefined);
const err3 = hasUndefined(clean3);
if (err3) {
  console.error(`[FAILED] Test 3: Undefined field found at ${err3}`);
  process.exit(1);
} else if ('payoutAmount' in clean3.commercial || 'optionalNotes' in clean3) {
  console.error('[FAILED] Test 3: Undefined fields were not stripped');
  process.exit(1);
} else {
  console.log('[PASSED] Test 3: Undefined fields stripped cleanly by removeUndefinedFields()');
}

console.log('\n----------------------------------------');
console.log('ALL CLIENT SERIALIZATION TESTS PASSED SUCCESSFULLY!');
