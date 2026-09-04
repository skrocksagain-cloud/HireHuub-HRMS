import { importMappingService } from '../apps/web/src/pages/Workbench/openings/services/importMappingService';
import { googleSheetsSyncService } from '../apps/web/src/pages/Workbench/openings/services/googleSheetsSyncService';
import { openingNumberService } from '../apps/web/src/services/numbering/openingNumberService';
import { getIndianStates, getCitiesForState, isValidCityForState } from '../apps/web/src/core/location/indiaLocationMaster';
import type { Opening } from '../apps/web/src/types/Opening';

async function runTests() {
  console.log('=== Openings Reference Attachments, Location Master & Google Sheet Test Suite ===\n');

  // Test 0: Opening Number Prefix Generation & Default Fallback (HHOP0001)
  const num1 = openingNumberService.calculateNextNumber([], 'HHOP');
  const num2 = openingNumberService.calculateNextNumber([{ id: 'HHOP0001' }], 'HHOP');
  if (num1 === 'HHOP0001' && num2 === 'HHOP0002') {
    console.log('[PASS] Test 0: Opening Number Service calculates next sequential ID cleanly (HHOP0001, HHOP0002).');
  } else {
    console.error('[FAIL] Test 0: Unexpected opening numbers:', num1, num2);
    process.exit(1);
  }

  // Test 1: Approved Spreadsheet ID & Vacancy Tab Name Configuration
  if (
    googleSheetsSyncService.SPREADSHEET_ID === '1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g' &&
    googleSheetsSyncService.SHEET_TAB_NAME === 'Vacancy'
  ) {
    console.log('[PASS] Test 1: Verified approved Spreadsheet ID (1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g) and "Vacancy" tab name.');
  } else {
    console.error('[FAIL] Test 1: Unexpected Spreadsheet ID or Tab Name.');
    process.exit(1);
  }

  // Test 2: Indian Location Master State & City Validation
  const states = getIndianStates();
  const maharashtraCities = getCitiesForState('Maharashtra');
  const westBengalCities = getCitiesForState('West Bengal');

  const isPuneInMaharashtra = isValidCityForState('Maharashtra', 'Pune');
  const isPuneInWestBengal = isValidCityForState('West Bengal', 'Pune');

  if (
    states.some((s) => s.stateName === 'Maharashtra') &&
    maharashtraCities.includes('Pune') &&
    westBengalCities.includes('Kolkata') &&
    isPuneInMaharashtra &&
    !isPuneInWestBengal
  ) {
    console.log('[PASS] Test 2: India Location Master correctly validated State and state-specific Cities (rejected Pune for West Bengal).');
  } else {
    console.error('[FAIL] Test 2: India Location Master validation failed.');
    process.exit(1);
  }

  // Test 3: Import Mapping Location Validation
  const validMapped = importMappingService.mapToOpeningModel({
    source: 'Excel',
    rawFields: { Title: 'Logistics Lead', State: 'West Bengal', City: 'Kolkata', Vacancies: '8' },
  });

  const invalidCityMapped = importMappingService.mapToOpeningModel({
    source: 'Excel',
    rawFields: { Title: 'Logistics Lead', State: 'West Bengal', City: 'Pune', Vacancies: '8' },
  });

  if (validMapped.state === 'West Bengal' && validMapped.city === 'Kolkata' && invalidCityMapped.city === '') {
    console.log('[PASS] Test 3: Excel import mapping validated State/City against Location Master and cleared invalid City.');
  } else {
    console.error('[FAIL] Test 3: Excel import mapping location validation failed:', validMapped, invalidCityMapped);
    process.exit(1);
  }

  // Test 4: Google Sheet Outsourced Vacancy Sync Lifecycle Matrix (Live Execution)
  const baseOpening: Opening = {
    id: 'HHOP0001',
    clientId: 'cli-101',
    clientName: 'Shadowfax Logistics',
    title: 'Delivery Executive',
    description: 'Deliver packages across Pune Warje route.',
    location: 'Warje Hub',
    city: 'Pune',
    state: 'Maharashtra',
    openPositions: 12,
    status: 'Active',
    priority: 'High',
    isOutsourced: true,
    outsourcedVendor: 'QuickStaff Solutions',
    minExperience: 0,
    maxExperience: 2,
    qualification: '10th Pass',
    genderPreference: 'Any',
    ageLimit: 35,
    skills: ['Driving', 'Navigation'],
    minSalary: 18000,
    maxSalary: 22000,
    salaryType: 'Monthly',
    assignedRecruiterIds: [],
    attachments: [
      {
        id: 'att-1',
        fileName: 'job_req.jpg',
        fileType: 'image/jpeg',
        fileUrl: 'blob:http://localhost/att-1',
        uploadedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Matrix Case 1: Active + Outsourced Yes -> Added to Sheet
  await googleSheetsSyncService.handleOpeningSyncLifecycle(baseOpening);
  let published = googleSheetsSyncService.getPublishedVacancies();
  if (published.length === 1 && published[0].openingId === 'HHOP0001') {
    console.log('[PASS] Matrix Case 1: Active + Outsourced Yes published row to Sheet.');
  } else {
    console.error('[FAIL] Matrix Case 1: Active + Outsourced Yes failed to publish.');
    process.exit(1);
  }

  // Matrix Case 2: Active + Outsourced No -> Removed from Sheet
  const inHouseOpening: Opening = { ...baseOpening, isOutsourced: false };
  await googleSheetsSyncService.handleOpeningSyncLifecycle(inHouseOpening);
  published = googleSheetsSyncService.getPublishedVacancies();
  if (published.length === 0) {
    console.log('[PASS] Matrix Case 2: Active + Outsourced No removed row from Sheet.');
  } else {
    console.error('[FAIL] Matrix Case 2: Active + Outsourced No failed to remove row.');
    process.exit(1);
  }

  // Matrix Case 3: Draft + Outsourced Yes -> Not published
  const draftOpening: Opening = { ...baseOpening, status: 'Draft', isOutsourced: true };
  await googleSheetsSyncService.handleOpeningSyncLifecycle(draftOpening);
  published = googleSheetsSyncService.getPublishedVacancies();
  if (published.length === 0) {
    console.log('[PASS] Matrix Case 3: Draft + Outsourced Yes not published.');
  } else {
    console.error('[FAIL] Matrix Case 3: Draft + Outsourced Yes erroneously published.');
    process.exit(1);
  }

  // Matrix Case 4: Active + Yes -> OnHold -> Removed
  await googleSheetsSyncService.handleOpeningSyncLifecycle(baseOpening); // Publish again
  const onHoldOpening: Opening = { ...baseOpening, status: 'OnHold' };
  await googleSheetsSyncService.handleOpeningSyncLifecycle(onHoldOpening);
  published = googleSheetsSyncService.getPublishedVacancies();
  if (published.length === 0) {
    console.log('[PASS] Matrix Case 4: Active + Yes -> OnHold removed row from Sheet.');
  } else {
    console.error('[FAIL] Matrix Case 4: Transition to OnHold failed to remove row.');
    process.exit(1);
  }

  // Matrix Case 5: OnHold -> Active -> Re-added
  await googleSheetsSyncService.handleOpeningSyncLifecycle(baseOpening);
  published = googleSheetsSyncService.getPublishedVacancies();
  if (published.length === 1 && published[0].openingId === 'HHOP0001') {
    console.log('[PASS] Matrix Case 5: OnHold -> Active re-added row to Sheet.');
  } else {
    console.error('[FAIL] Matrix Case 5: Transition to Active failed to re-add row.');
    process.exit(1);
  }

  // Matrix Case 6: Edit Opening updates row without creating duplicates
  const updatedOpening: Opening = { ...baseOpening, openPositions: 15, minSalary: 20000 };
  await googleSheetsSyncService.handleOpeningSyncLifecycle(updatedOpening);
  published = googleSheetsSyncService.getPublishedVacancies();
  if (published.length === 1 && published[0].vacanciesCount === 15) {
    console.log('[PASS] Matrix Case 6: Editing eligible Opening updated row without duplicate rows (1 total row).');
  } else {
    console.error('[FAIL] Matrix Case 6: Duplicate rows created or row update failed:', published);
    process.exit(1);
  }

  // Test 5: Safe Column Verification (15 recruitment-facing fields)
  const row = published[0];
  const keys = Object.keys(row);
  if (keys.length === 15 && row.openingId === 'HHOP0001' && row.employmentType === 'Outsourced Staffing') {
    console.log('[PASS] Test 5: Exported row uses Opening ID (HHOP0001) and contains all 15 safe recruitment fields.');
  } else {
    console.error('[FAIL] Test 5: Row contains unexpected fields:', keys);
    process.exit(1);
  }

  console.log('\n=== ALL OPENINGS LOCATION MASTER & GOOGLE SHEETS TESTS PASSED 100% ===');
}

runTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
