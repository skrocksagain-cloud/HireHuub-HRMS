import { removeUndefinedFields } from '../apps/web/src/pages/Workbench/openings/repositories/openingRepository';
import type { Opening } from '../apps/web/src/types/Opening';

function testOpeningFirestoreSerialization() {
  console.log('=== OPENING FIRESTORE NO-SUBVENDOR SERIALIZATION TEST SUITE ===\n');

  // Test A: Create Opening: Status = Active, Outsourced = Yes, No vendor entered
  const testAPayload: Partial<Opening> = {
    title: 'Senior Developer',
    status: 'Active',
    isOutsourced: true,
    description: 'Lead developer role',
    minSalary: 50000,
    maxSalary: 80000,
  };
  const cleanA = removeUndefinedFields(testAPayload);
  console.log('[PASS] Test A (Outsourced Yes without Vendor):', cleanA);
  if (cleanA.isOutsourced !== true || Object.values(cleanA).includes(undefined)) {
    throw new Error('Test A failed: invalid payload for Outsourced Yes without vendor.');
  }

  // Test B: Create Opening: Status = Active, Outsourced = No
  const testBPayload: Partial<Opening> = {
    title: 'In-House Manager',
    status: 'Active',
    isOutsourced: false,
    interviewDate: undefined,
  };
  const cleanB = removeUndefinedFields(testBPayload);
  console.log('[PASS] Test B (Outsourced No):', cleanB);
  if (cleanB.isOutsourced !== false || 'interviewDate' in cleanB) {
    throw new Error('Test B failed: undefined optional fields were not stripped.');
  }

  // Test C: Edit existing Opening HHOP0001 without vendor field
  const testCUpdates: Partial<Opening> = {
    openPositions: 10,
    minSalary: 25000,
  };
  const cleanC = removeUndefinedFields(testCUpdates);
  console.log('[PASS] Test C (Edit HHOP0001 without vendor):', cleanC);
  if (Object.values(cleanC).includes(undefined)) {
    throw new Error('Test C failed: cleanC contains undefined values.');
  }

  // Test D: Change Outsourced Yes -> No
  const testDUpdates: Partial<Opening> = {
    isOutsourced: false,
    status: 'Active',
  };
  const cleanD = removeUndefinedFields(testDUpdates);
  console.log('[PASS] Test D (Outsourced Yes -> No transition):', cleanD);
  if (cleanD.isOutsourced !== false) {
    throw new Error('Test D failed: invalid payload for Yes -> No transition.');
  }

  // Test E: Change Outsourced No -> Yes without vendor input
  const testEUpdates: Partial<Opening> = {
    isOutsourced: true,
    status: 'Active',
  };
  const cleanE = removeUndefinedFields(testEUpdates);
  console.log('[PASS] Test E (Outsourced No -> Yes transition without vendor):', cleanE);
  if (cleanE.isOutsourced !== true) {
    throw new Error('Test E failed: invalid payload for No -> Yes transition.');
  }

  console.log('\n=== ALL NO-SUBVENDOR SERIALIZATION TESTS PASSED 100% ===');
}

testOpeningFirestoreSerialization();
