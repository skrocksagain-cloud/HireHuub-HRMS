import { formatPartnerCode } from '../apps/web/src/pages/Workbench/Network/associatePartners/repositories/associatePartnerRepository';
import { associatePartnerService, AddActiveCandidateInput } from '../apps/web/src/pages/Workbench/Network/associatePartners/services/associatePartnerService';

async function runTests() {
  console.log('=== Associate Partner Simplification & Workforce Integration Test Suite ===\n');

  // Test 1: Business Partner ID format HH/AP/000001
  const code1 = formatPartnerCode(1);
  const code125 = formatPartnerCode(125);
  if (code1 === 'HH/AP/000001' && code125 === 'HH/AP/000125') {
    console.log('[PASS] Test 1: Partner Code formatted correctly (HH/AP/000001, HH/AP/000125).');
  } else {
    console.error(`[FAIL] Test 1: Unexpected partner codes (${code1}, ${code125})`);
    process.exit(1);
  }

  // Test 2: Validation of Single Active Candidate Input
  const validCandidate: AddActiveCandidateInput = {
    candidateName: 'Rajesh Kumar',
    phone: '9876543210',
    state: 'Maharashtra',
    city: 'Mumbai',
    associatePartnerId: 'ap-001',
    clientId: 'cli-001',
    clientName: 'Elastic Run',
    activeDate: '2026-08-15',
    role: 'Delivery Driver',
  };

  try {
    associatePartnerService.validateActiveCandidateInput(validCandidate);
    console.log('[PASS] Test 2A: Valid candidate input passed validation.');
  } catch (err) {
    console.error('[FAIL] Test 2A:', err);
    process.exit(1);
  }

  // Test 2B: Invalid state rejection
  try {
    associatePartnerService.validateActiveCandidateInput({
      ...validCandidate,
      state: 'InvalidStateName',
    });
    console.error('[FAIL] Test 2B: Invalid state was not rejected.');
    process.exit(1);
  } catch {
    console.log('[PASS] Test 2B: Invalid Indian State correctly rejected.');
  }

  // Test 2C: Invalid city rejection for given state
  try {
    associatePartnerService.validateActiveCandidateInput({
      ...validCandidate,
      state: 'Maharashtra',
      city: 'Bengaluru', // Bengaluru belongs to Karnataka, not Maharashtra
    });
    console.error('[FAIL] Test 2C: City not matching state was not rejected.');
    process.exit(1);
  } catch {
    console.log('[PASS] Test 2C: Invalid City for selected State correctly rejected.');
  }

  // Test 3: Bulk Upload Row Validation
  const bulkRows = [
    {
      'Candidate Name': 'Aarav Patel',
      'Phone Number': '9822011223',
      'City': 'Pune',
      'State': 'Maharashtra',
      'Role': 'Warehouse Executive',
      'Candidate Active Date': '2026-08-10',
      'Client ID': 'cli-101',
      'Client Name': 'Shadowfax',
      'Associate Partner ID': 'ap-001',
    },
    {
      'Candidate Name': '', // Invalid: missing name
      'Phone Number': '9822011224',
      'City': 'Pune',
      'State': 'Maharashtra',
      'Role': 'Worker',
      'Candidate Active Date': '2026-08-10',
      'Client ID': 'cli-101',
      'Client Name': 'Shadowfax',
      'Associate Partner ID': 'ap-001',
    },
  ];

  const bulkResult = await associatePartnerService.validateBulkCandidateRows(bulkRows, 'ap-001');
  if (bulkResult.validInputs.length === 1 && bulkResult.invalidRows.length === 1 && bulkResult.invalidRows[0].rowNumber === 2) {
    console.log('[PASS] Test 3: Bulk Upload validation separated 1 valid row and 1 invalid row cleanly with error reporting.');
  } else {
    console.error('[FAIL] Test 3: Unexpected bulk validation result:', bulkResult);
    process.exit(1);
  }

  console.log('\n=== ALL ASSOCIATE PARTNER INTEGRATION TESTS PASSED 100% ===');
}

runTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
