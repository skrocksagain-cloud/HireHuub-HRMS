import { useState, useEffect, useCallback } from 'react';
import type { Opening } from '../../../../types/Opening';
import { openingService } from '../services/openingService';

export function useOpenings() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await openingService.getOpenings();
      setOpenings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch openings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOpenings();
  }, [fetchOpenings]);

  const createOpening = async (input: Omit<Opening, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const newOpening = await openingService.createOpening(input);
    await fetchOpenings();
    return newOpening;
  };

  const updateOpening = async (id: string, updates: Partial<Opening>) => {
    const updated = await openingService.updateOpening(id, updates);
    await fetchOpenings();
    return updated;
  };

  const deleteOpening = async (id: string) => {
    const success = await openingService.deleteOpening(id);
    await fetchOpenings();
    return success;
  };

  return {
    openings,
    loading,
    error,
    refresh: fetchOpenings,
    createOpening,
    updateOpening,
    deleteOpening,
    openingService,
  };
}

export function useOpeningProfile(id?: string) {
  const [opening, setOpening] = useState<Opening | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpening = useCallback(async () => {
    if (!id) {
      setOpening(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await openingService.getOpeningById(id);
      setOpening(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opening details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchOpening();
  }, [fetchOpening]);

  const updateProfile = async (updates: Partial<Opening>) => {
    if (!id) return;
    const updated = await openingService.updateOpening(id, updates);
    setOpening(updated);
    return updated;
  };

  return {
    opening,
    loading,
    error,
    refresh: fetchOpening,
    updateProfile,
  };
}
