// Mock import.meta.env for Node test runner
if (typeof (globalThis as any).import === 'undefined') {
  (globalThis as any).import = { meta: { env: {} } };
}
if (!(globalThis as any).import.meta) {
  (globalThis as any).import.meta = { env: {} };
}
if (!(globalThis as any).import.meta.env) {
  (globalThis as any).import.meta.env = {};
}

import { runHireHuubInvoiceTemplateTests } from '../apps/web/src/services/payroll/__tests__/invoiceTemplates.test';

console.log('Running Hire Huub Invoice Template & GST Engine Tests...\n');
const results = runHireHuubInvoiceTemplateTests();

results.forEach((r, idx) => {
  console.log(`[${r.status}] ${r.test}`);
  if (r.details) console.log(`   Details: ${r.details}`);
});

const failures = results.filter((r) => r.status === 'FAILED');
console.log(`\n----------------------------------------`);
if (failures.length > 0) {
  console.error(`FAILED ${failures.length} TESTS!`);
  process.exit(1);
} else {
  console.log(`ALL ${results.length} TESTS PASSED SUCCESSFULLY! (0 failures)`);
  process.exit(0);
}
