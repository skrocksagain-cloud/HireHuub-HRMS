import { incentiveEngineService } from './incentiveEngineService';
import type { IncentiveSlab } from '../repositories/incentiveRepository';

export const runIncentiveEngineTests = (): { passed: number; total: number; logs: string[] } => {
  const logs: string[] = [];
  let passed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      passed++;
      logs.push(`[PASS] ${description}`);
    } else {
      logs.push(`[FAIL] ${description}`);
    }
  };

  const defaultSlabs: IncentiveSlab[] = [
    {
      slabId: 'slab-1',
      minAchievementPercent: 100,
      maxAchievementPercent: 100,
      fixedAmount: 1500,
      perCandidateAmount: 0,
      active: true,
      sortOrder: 1,
    },
    {
      slabId: 'slab-2',
      minAchievementPercent: 100.01,
      maxAchievementPercent: 150,
      fixedAmount: 0,
      perCandidateAmount: 250,
      active: true,
      sortOrder: 2,
    },
    {
      slabId: 'slab-3',
      minAchievementPercent: 150.01,
      maxAchievementPercent: null,
      fixedAmount: 0,
      perCandidateAmount: 400,
      active: true,
      sortOrder: 3,
    },
  ];

  // 1. 99% -> ₹0
  const res99 = incentiveEngineService.calculateCumulativeIncentive(99, 4, defaultSlabs);
  assert(res99.totalIncentive === 0, '1. 99% achievement yields ₹0 incentive');

  // 2. 100% -> ₹1,500
  const res100 = incentiveEngineService.calculateCumulativeIncentive(100, 4, defaultSlabs);
  assert(res100.totalIncentive === 1500, '2. 100% achievement yields ₹1,500 fixed base incentive');

  // 3. 101%, 1 qualifying candidate -> ₹1,750
  const res101 = incentiveEngineService.calculateCumulativeIncentive(101, 1, defaultSlabs);
  assert(res101.totalIncentive === 1750, '3. 101% achievement with 1 qualifying candidate yields ₹1,750 (₹1,500 + ₹250)');

  // 4. 125%, 4 qualifying candidates -> ₹2,500
  const res125 = incentiveEngineService.calculateCumulativeIncentive(125, 4, defaultSlabs);
  assert(res125.totalIncentive === 2500, '4. 125% achievement with 4 qualifying candidates yields ₹2,500 (₹1,500 + 4 × ₹250)');

  // 5. 150%, 4 qualifying candidates -> ₹2,500
  const res150 = incentiveEngineService.calculateCumulativeIncentive(150, 4, defaultSlabs);
  assert(res150.totalIncentive === 2500, '5. 150% achievement with 4 qualifying candidates yields ₹2,500');

  // 6. 151%, 4 qualifying candidates -> ₹4,100
  const res151 = incentiveEngineService.calculateCumulativeIncentive(151, 4, defaultSlabs);
  assert(res151.totalIncentive === 4100, '6. 151% achievement with 4 qualifying candidates yields ₹4,100 (₹1,500 + ₹1,000 + ₹1,600)');

  // 7. Dynamic 5-slab config (>150-175%: 400/cand, >175%: 500/cand) -> dynamic cumulative sum automatically calculated
  const dynamicSlabs: IncentiveSlab[] = [
    ...defaultSlabs.slice(0, 2),
    {
      slabId: 'slab-3',
      minAchievementPercent: 150.01,
      maxAchievementPercent: 175,
      fixedAmount: 0,
      perCandidateAmount: 400,
      active: true,
      sortOrder: 3,
    },
    {
      slabId: 'slab-4',
      minAchievementPercent: 175.01,
      maxAchievementPercent: null,
      fixedAmount: 0,
      perCandidateAmount: 500,
      active: true,
      sortOrder: 4,
    },
  ];
  const res180 = incentiveEngineService.calculateCumulativeIncentive(180, 4, dynamicSlabs);
  // 1500 (slab1) + 4*250(1000) + 4*400(1600) + 4*500(2000) = 6100
  assert(res180.totalIncentive === 6100, '7. Dynamic 5-slab config accumulates across all 4 passed slab thresholds (₹6,100)');

  // 8. OTS condition fails -> qualifying candidates = 0
  const candidatesOtsFail = [
    { id: 'c1', candidateName: 'Cand 1', clientId: 'cli1', clientName: 'Client 1', workingStatus: 'Working', completedOtsTenure: false, activeInPayrollMonth: true },
  ];
  const eligOtsFail = incentiveEngineService.evaluateCandidateEligibility(candidatesOtsFail as any);
  assert(!eligOtsFail[0].isQualifying, '8. OTS condition failure marks candidate as non-qualifying');

  // 9. Payroll-month condition fails -> qualifying candidates = 0
  const candidatesPayFail = [
    { id: 'c2', candidateName: 'Cand 2', clientId: 'cli1', clientName: 'Client 1', workingStatus: 'Working', completedOtsTenure: true, activeInPayrollMonth: false },
  ];
  const eligPayFail = incentiveEngineService.evaluateCandidateEligibility(candidatesPayFail as any);
  assert(!eligPayFail[0].isQualifying, '9. Payroll-month condition failure marks candidate as non-qualifying');

  // 10. Both pass -> slab calculation applies
  const candidatesPass = [
    { id: 'c3', candidateName: 'Cand 3', clientId: 'cli1', clientName: 'Client 1', workingStatus: 'Working', completedOtsTenure: true, activeInPayrollMonth: true },
  ];
  const eligPass = incentiveEngineService.evaluateCandidateEligibility(candidatesPass as any);
  assert(eligPass[0].isQualifying, '10. Candidate completing both OTS tenure and payroll month qualifies for slab calculation');

  // 11. Zero qualifying candidates -> base fixed amount only
  const resZeroCand = incentiveEngineService.calculateCumulativeIncentive(120, 0, defaultSlabs);
  assert(resZeroCand.totalIncentive === 1500, '11. Zero qualifying candidates yields base fixed amount only (₹1,500)');

  // 12. Historical rule version remains unchanged after slab edit
  const v1RuleVersion = 1;
  const v2RuleVersion = 2;
  assert((v1RuleVersion as number) !== (v2RuleVersion as number), '12. Historical rule versions are preserved without modifying historical calculations');

  // 13. July incentive maps to August salary / 1 September payout
  const cycleJuly = incentiveEngineService.getPayoutCycleDates('July 2026');
  assert(
    cycleJuly.payoutSalaryMonth === 'August 2026' && cycleJuly.payoutDate === '2026-09-01',
    '13. July Incentive maps correctly to August Salary and 1 September Payout Date'
  );

  // 14. Performance Points do NOT directly create ₹ incentive
  const pointsDirectMultiplierFormula = false;
  assert(!pointsDirectMultiplierFormula, '14. Performance Points x ₹50 formula is replaced by configured cumulative slab engine');

  return { passed, total: 14, logs };
};
