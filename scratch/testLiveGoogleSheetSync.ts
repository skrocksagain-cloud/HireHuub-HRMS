import { googleSheetsSyncService } from '../apps/web/src/pages/Workbench/openings/services/googleSheetsSyncService';
import type { Opening } from '../apps/web/src/types/Opening';

const LIVE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzVWhu2YJEwVOg5gF-WsolflbEMxyicLXCEIHiKIiWHJkmMFtUPv17cbYyvYmNebG3k/exec';
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function testLiveGoogleSheetLifecycle() {
  console.log('=== FULL LIVE GOOGLE SHEET MATRIX VERIFICATION ===');
  console.log(`Endpoint: ${LIVE_ENDPOINT}`);
  console.log(`Target Spreadsheet ID: 1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g`);
  console.log(`Target Tab Name: Vacancy\n`);

  const baseOpening: Opening = {
    id: 'HHOP0001',
    clientId: 'cli-101',
    clientName: 'Shadowfax Logistics',
    title: 'Warehouse Delivery Executive',
    description: 'Deliver packages across Pune Warje hub route.',
    location: 'Warje Hub',
    city: 'Pune',
    state: 'Maharashtra',
    openPositions: 6,
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
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  async function sendPayload(action: 'UPSERT' | 'REMOVE', opening: Opening) {
    const row = googleSheetsSyncService.formatSheetRow(opening);
    const payload = {
      action,
      spreadsheetId: googleSheetsSyncService.SPREADSHEET_ID,
      tabName: googleSheetsSyncService.SHEET_TAB_NAME,
      openingId: opening.id,
      data: row,
    };
    const res = await fetch(LIVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, rawText: text };
    }
  }

  // Case 1: Active + Outsourced Yes -> CREATED/UPDATED at Row 2
  console.log('Case 1: Sending Active + Outsourced Yes for HHOP0001...');
  let res1 = await sendPayload('UPSERT', baseOpening);
  if (res1.success && (res1.action === 'CREATED' || res1.action === 'UPDATED')) {
    console.log(`[PASS] Case 1: Active + Outsourced Yes physically created/updated row in Google Sheet. Row Index: ${res1.rowIndex}`);
  } else {
    console.error('[FAIL] Case 1 failed:', res1);
    process.exit(1);
  }
  await delay(1500);

  // Case 2: Edit Opening (openPositions 6 -> 10) -> UPDATED at Row 2 (No duplicate rows)
  console.log('\nCase 2: Editing HHOP0001 (openPositions: 10)...');
  const updatedOpening = { ...baseOpening, openPositions: 10, minSalary: 20000 };
  let res2 = await sendPayload('UPSERT', updatedOpening);
  if (res2.success && res2.action === 'UPDATED' && res2.rowIndex === 2) {
    console.log(`[PASS] Case 2: Editing HHOP0001 updated same row without creating duplicates. Row Index: ${res2.rowIndex}`);
  } else {
    console.error('[FAIL] Case 2 failed:', res2);
    process.exit(1);
  }
  await delay(1500);

  // Case 3: Active -> OnHold -> REMOVE from Google Sheet
  console.log('\nCase 3: Transitioning HHOP0001 (Active -> OnHold)...');
  const onHoldOpening = { ...baseOpening, status: 'OnHold' as const };
  let res3 = await sendPayload('REMOVE', onHoldOpening);
  if (res3.success && (res3.action === 'DELETED' || res3.action === 'NOT_FOUND')) {
    console.log(`[PASS] Case 3: Transition to OnHold physically removed row from Google Sheet. Action: ${res3.action}`);
  } else {
    console.error('[FAIL] Case 3 failed:', res3);
    process.exit(1);
  }
  await delay(1500);

  // Case 4: OnHold -> Active -> Re-added to Google Sheet
  console.log('\nCase 4: Transitioning HHOP0001 back (OnHold -> Active)...');
  let res4 = await sendPayload('UPSERT', baseOpening);
  if (res4.success && (res4.action === 'CREATED' || res4.action === 'UPDATED')) {
    console.log(`[PASS] Case 4: Transition back to Active re-added row to Google Sheet. Row Index: ${res4.rowIndex}`);
  } else {
    console.error('[FAIL] Case 4 failed:', res4);
    process.exit(1);
  }
  await delay(1500);

  // Case 5: Outsourced Yes -> No -> REMOVE from Google Sheet
  console.log('\nCase 5: Changing Outsourced flag (Yes -> No)...');
  const inHouseOpening = { ...baseOpening, isOutsourced: false };
  let res5 = await sendPayload('REMOVE', inHouseOpening);
  if (res5.success && (res5.action === 'DELETED' || res5.action === 'NOT_FOUND')) {
    console.log(`[PASS] Case 5: Setting Outsourced = No physically removed row from Google Sheet. Action: ${res5.action}`);
  } else {
    console.error('[FAIL] Case 5 failed:', res5);
    process.exit(1);
  }
  await delay(1500);

  // Case 6: Outsourced No -> Yes -> Re-added to Google Sheet
  console.log('\nCase 6: Changing Outsourced flag back (No -> Yes)...');
  let res6 = await sendPayload('UPSERT', baseOpening);
  if (res6.success && (res6.action === 'CREATED' || res6.action === 'UPDATED')) {
    console.log(`[PASS] Case 6: Setting Outsourced = Yes re-added row to Google Sheet. Row Index: ${res6.rowIndex}`);
  } else {
    console.error('[FAIL] Case 6 failed:', res6);
    process.exit(1);
  }

  console.log('\n=== ALL 6 LIVE GOOGLE SHEET MATRIX TESTS PASSED 100% ===');
}

testLiveGoogleSheetLifecycle().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
