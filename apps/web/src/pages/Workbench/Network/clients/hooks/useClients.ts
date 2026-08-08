import { useState, useEffect, useCallback } from 'react';
import type { Client, CreateClientInput } from '../../../../../types/Client';
import { clientService, type ResolvedClientBilling } from '../services/clientService';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const createClient = async (input: CreateClientInput): Promise<Client> => {
    const created = await clientService.createClient(input);
    await loadClients();
    return created;
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
    const updated = await clientService.updateClient(id, updates);
    await loadClients();
    return updated;
  };

  return {
    clients,
    loading,
    error,
    refreshClients: loadClients,
    createClient,
    updateClient,
  };
}

export function useClientProfile(clientId?: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadClient = useCallback(async () => {
    if (!clientId) {
      setClient(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await clientService.getClientById(clientId);
      setClient(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client details.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const updateProfile = async (updates: Partial<Client>): Promise<void> => {
    if (!clientId) return;
    await clientService.updateClient(clientId, updates);
    await loadClient();
  };

  const resolveBilling = async (stateName?: string): Promise<ResolvedClientBilling | null> => {
    if (!clientId) return null;
    return clientService.resolveClientBillingForState(clientId, stateName);
  };

  return {
    client,
    loading,
    error,
    refreshClient: loadClient,
    updateProfile,
    resolveBilling,
  };
}
