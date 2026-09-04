import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { leaveService } from '../services/leaveService';
import type {
  CarryForwardInput,
  LeaveActor,
  LeaveApplicationInput,
  LeaveDashboardData,
  LeaveDecisionInput,
  LeaveRequest,
} from '../types/leave';

const emptyDashboard: LeaveDashboardData = {
  balances: [],
  requests: [],
  approvalRequests: [],
  organizationRequests: [],
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load or update leave data.';

export const useLeave = (actor: LeaveActor | null) => {
  const [data, setData] = useState<LeaveDashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extract primitive identity to prevent infinite useEffect loops
  const actorId = actor?.employeeId || '';
  const actorRole = actor?.role || '';

  // Store actor reference in ref to safely pass to async services
  const actorRef = useRef<LeaveActor | null>(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const refresh = useCallback(async (): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor || !currentActor.employeeId) {
      setData(emptyDashboard);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const dashboardData = await leaveService.getDashboard(currentActor);
      setData(dashboardData);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [actorId, actorRole]);

  useEffect(() => {
    let isMounted = true;

    if (!actorId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (actorRef.current) {
          const res = await leaveService.getDashboard(actorRef.current);
          if (isMounted) {
            setData(res);
          }
        }
      } catch (caught) {
        if (isMounted) {
          setError(getErrorMessage(caught));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [actorId, actorRole]);

  const run = useCallback(
    async (operation: () => Promise<void>, successMessage: string): Promise<void> => {
      try {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        await operation();
        setSuccess(successMessage);
        await refresh();
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const apply = (input: LeaveApplicationInput): void => {
    if (actorRef.current) {
      void run(() => leaveService.apply(actorRef.current!, input), 'Leave request submitted.');
    }
  };

  const decide = (input: LeaveDecisionInput): void => {
    if (actorRef.current) {
      void run(
        () => leaveService.decide(actorRef.current!, input),
        `Leave request ${input.decision.toLowerCase()}.`
      );
    }
  };

  const cancel = (requestId: string): void => {
    if (actorRef.current) {
      void run(() => leaveService.cancel(actorRef.current!, requestId), 'Leave request cancelled.');
    }
  };

  const carryForward = (input: CarryForwardInput): void => {
    if (actorRef.current) {
      void run(
        () => leaveService.carryForward(actorRef.current!, input),
        'Leave carry-forward updated.'
      );
    }
  };

  // Derive leave requests list based on role permission
  const requests = useMemo<LeaveRequest[]>(() => {
    if (data.organizationRequests && data.organizationRequests.length > 0) {
      return data.organizationRequests;
    }
    return data.requests || [];
  }, [data.organizationRequests, data.requests]);

  return {
    data,
    requests,
    isLoading,
    isSaving,
    error,
    success,
    refresh,
    apply,
    decide,
    cancel,
    carryForward,
  };
};
