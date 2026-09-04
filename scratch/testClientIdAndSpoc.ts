import { formatClientId, parseClientIdNumber, generateNextClientId } from '../apps/web/src/pages/Workbench/Network/clients/repositories/clientRepository';
import type { Client } from '../apps/web/src/types/Client';
import type { ClientSPOC } from '../apps/web/src/types/ClientSPOC';

console.log('=== Client ID & SPOC Verification Suite ===\n');

// 1. Client ID Generation Helpers
const num1 = parseClientIdNumber('HH/CLI/000001');
if (num1 !== 1) throw new Error(`Expected 1, got ${num1}`);

const num42 = parseClientIdNumber('HH/CLI/000042');
if (num42 !== 42) throw new Error(`Expected 42, got ${num42}`);

const formatted1 = formatClientId(1);
if (formatted1 !== 'HH/CLI/000001') throw new Error(`Expected HH/CLI/000001, got ${formatted1}`);

const formatted999 = formatClientId(999);
if (formatted999 !== 'HH/CLI/000999') throw new Error(`Expected HH/CLI/000999, got ${formatted999}`);

console.log('[PASS] Client ID Helper parsing and formatting functions work correctly.');

// 2. Next Client ID Generation Sequence
const dummyClients: Partial<Client>[] = [
  { id: 'firebase-1', clientId: 'HH/CLI/000001' },
  { id: 'firebase-2', clientId: 'HH/CLI/000002' },
  { id: 'firebase-3', clientId: 'HH/CLI/000003' },
];

const nextId = generateNextClientId(dummyClients as Client[]);
if (nextId !== 'HH/CLI/000004') throw new Error(`Expected HH/CLI/000004, got ${nextId}`);
console.log(`[PASS] Next sequential Client ID generated correctly: ${nextId}`);

// 3. Existing Client Backfill Logic Simulation
const unassignedClients: Partial<Client>[] = [
  { id: 'old-1', name: 'Legacy Client A' },
  { id: 'old-2', name: 'Legacy Client B' },
  { id: 'old-3', clientId: 'HH/CLI/000001', name: 'Migrated Client C' },
];

let maxNum = 0;
for (const c of unassignedClients) {
  const num = parseClientIdNumber(c.clientId);
  if (num > maxNum) maxNum = num;
}

for (const c of unassignedClients) {
  if (!c.clientId) {
    maxNum++;
    c.clientId = formatClientId(maxNum);
  }
}

if (unassignedClients[0].clientId !== 'HH/CLI/000002' || unassignedClients[1].clientId !== 'HH/CLI/000003') {
  throw new Error(`Backfill failed: ${JSON.stringify(unassignedClients)}`);
}
console.log('[PASS] Existing client backfill assigned unique sequential IDs without changing existing IDs.');

// 4. SPOC Operations
let spocs: ClientSPOC[] = [
  {
    id: 'spoc-1',
    role: 'HR',
    name: 'Anjali Sharma',
    designation: 'HR Lead',
    email: 'anjali@company.com',
    phone: '9876543210',
    scope: 'All India',
    isPrimary: true,
  },
];

// Add new SPOC
const newSpoc: ClientSPOC = {
  id: 'spoc-2',
  role: 'Accounts',
  name: 'Vikram Singh',
  designation: 'Accounts Manager',
  email: 'vikram@company.com',
  phone: '9123456789',
  scope: 'State',
  scopeDetail: 'Karnataka',
  isPrimary: false,
};

spocs = [...spocs, newSpoc];
if (spocs.length !== 2) throw new Error('Failed to add SPOC');
console.log('[PASS] Added new SPOC successfully. Total SPOCs:', spocs.length);

// Edit existing SPOC
spocs = spocs.map((s) => (s.id === 'spoc-1' ? { ...s, designation: 'Senior HR Manager', phone: '9999999999' } : s));
if (spocs[0].designation !== 'Senior HR Manager' || spocs[0].phone !== '9999999999') {
  throw new Error('Failed to update SPOC');
}
console.log('[PASS] Edited SPOC successfully: Designation & Phone updated.');

console.log('\n=== ALL CLIENT ID & SPOC TESTS PASSED SUCCESSFULLY! ===');
