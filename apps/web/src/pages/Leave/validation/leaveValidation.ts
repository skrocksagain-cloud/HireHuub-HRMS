import { getLeaveDays } from '../utils/leave';
import type { LeaveApplicationInput, LeaveDecisionInput } from '../types/leave';

export const validateLeaveApplication = (input: LeaveApplicationInput): void => { if (!input.leaveType.trim()) throw new Error('Leave type is required.'); if (!input.startDate || !input.endDate) throw new Error('Leave dates are required.'); if (input.endDate < input.startDate) throw new Error('The end date must not be before the start date.'); if (!input.reason.trim()) throw new Error('A leave reason is required.'); if (getLeaveDays(input.startDate, input.endDate) < 1) throw new Error('Leave duration must be at least one day.'); };
export const validateLeaveDecision = (input: LeaveDecisionInput): void => { if (!input.reason.trim()) throw new Error('A decision reason is required.'); };
export const validateCarryForward = (days: number): void => { if (!Number.isFinite(days) || days <= 0) throw new Error('Carry-forward days must be greater than zero.'); };
