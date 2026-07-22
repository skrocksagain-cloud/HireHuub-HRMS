import { useCallback, useEffect, useMemo, useState } from 'react';

import { leaveService } from '../services/leaveService';
import type { CarryForwardInput, LeaveActor, LeaveApplicationInput, LeaveDashboardData, LeaveDecisionInput, LeaveRequest } from '../types/leave';

const emptyDashboard: LeaveDashboardData = { balances: [], requests: [], approvalRequests: [], organizationRequests: [] };
const message = (error: unknown): string => error instanceof Error ? error.message : 'Unable to update leave.';

export const useLeave = (actor: LeaveActor | null) => {
  const [data, setData] = useState<LeaveDashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(Boolean(actor));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const refresh = useCallback(async (): Promise<void> => { if (!actor) { setData(emptyDashboard); setIsLoading(false); return; } try { setIsLoading(true); setError(null); setData(await leaveService.getDashboard(actor)); } catch (caught) { setError(message(caught)); } finally { setIsLoading(false); } }, [actor]);
  useEffect(() => { const timer = window.setTimeout(() => { void refresh(); }); return () => window.clearTimeout(timer); }, [refresh]);
  const run = useCallback(async (operation: () => Promise<void>, successMessage: string): Promise<void> => { try { setIsSaving(true); setError(null); setSuccess(null); await operation(); setSuccess(successMessage); await refresh(); } catch (caught) { setError(message(caught)); } finally { setIsSaving(false); } }, [refresh]);
  const apply = (input: LeaveApplicationInput): void => { if (actor) void run(() => leaveService.apply(actor, input), 'Leave request submitted.'); };
  const decide = (input: LeaveDecisionInput): void => { if (actor) void run(() => leaveService.decide(actor, input), `Leave request ${input.decision.toLowerCase()}.`); };
  const cancel = (requestId: string): void => { if (actor) void run(() => leaveService.cancel(actor, requestId), 'Leave request cancelled.'); };
  const carryForward = (input: CarryForwardInput): void => { if (actor) void run(() => leaveService.carryForward(actor, input), 'Leave carry-forward updated.'); };
  const requests = useMemo<LeaveRequest[]>(() => data.organizationRequests.length > 0 ? data.organizationRequests : data.requests, [data.organizationRequests, data.requests]);
  return { data, requests, isLoading, isSaving, error, success, refresh, apply, decide, cancel, carryForward };
};
