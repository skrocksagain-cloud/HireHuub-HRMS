import { addDoc, collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase/firebase';
import type { Client, CreateClientInput } from '../../../../../types/Client';

const CLIENTS_COLLECTION = 'clients';

const clientFrom = (id: string, data: Record<string, unknown>): Client => ({ id, ...data } as Client);

/**
 * Recursively strips undefined fields from an object/array payload to satisfy Firestore strict serialization requirements.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleanObj[key] = removeUndefinedFields(value);
      }
    }
    return cleanObj as T;
  }
  return obj;
}

export function parseClientIdNumber(clientId?: string): number {
  if (!clientId) return 0;
  const match = clientId.match(/HH\/CLI\/(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

export function formatClientId(serialNumber: number): string {
  return `HH/CLI/${String(serialNumber).padStart(6, '0')}`;
}

export function generateNextClientId(existingClients: Client[]): string {
  let maxNum = 0;
  for (const client of existingClients) {
    const num = parseClientIdNumber(client.clientId);
    if (num > maxNum) maxNum = num;
  }
  return formatClientId(maxNum + 1);
}

/**
 * Atomically fetches and increments the global business Client ID sequence counter.
 * Uses a Firestore transaction on `counters/client_sequence` to prevent race conditions.
 */
export async function getNextClientIdAtomic(): Promise<string> {
  const counterRef = doc(db, 'counters', 'client_sequence');

  const nextSerial = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let currentSerial = 0;

    if (counterSnap.exists()) {
      currentSerial = counterSnap.data().lastSerial || 0;
    } else {
      const clientsSnap = await getDocs(collection(db, CLIENTS_COLLECTION));
      for (const d of clientsSnap.docs) {
        const num = parseClientIdNumber(d.data().clientId);
        if (num > currentSerial) currentSerial = num;
      }
    }

    const newSerial = currentSerial + 1;
    transaction.set(counterRef, { lastSerial: newSerial, updatedAt: serverTimestamp() }, { merge: true });
    return newSerial;
  });

  return formatClientId(nextSerial);
}

/**
 * Controlled one-time migration utility for existing client records missing a business Client ID.
 * Does NOT run automatically on normal reads.
 */
export async function runClientMigration(): Promise<{ totalMigrated: number; highestSerial: number }> {
  const snapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
  const docs = snapshot.docs;

  let highestSerial = 0;
  const unassigned: Array<{ id: string }> = [];

  for (const d of docs) {
    const data = d.data();
    const num = parseClientIdNumber(data.clientId);
    if (num > highestSerial) highestSerial = num;
    if (!data.clientId) {
      unassigned.push({ id: d.id });
    }
  }

  let totalMigrated = 0;
  for (const item of unassigned) {
    highestSerial++;
    const assigned = formatClientId(highestSerial);
    await updateDoc(doc(db, CLIENTS_COLLECTION, item.id), { clientId: assigned });
    totalMigrated++;
  }

  const counterRef = doc(db, 'counters', 'client_sequence');
  await setDoc(counterRef, { lastSerial: highestSerial, updatedAt: serverTimestamp() }, { merge: true });

  return { totalMigrated, highestSerial };
}

class ClientRepository {
  /**
   * Strictly READ-ONLY query of client records. Zero side-effects or mutations.
   */
  async getClients(): Promise<Client[]> {
    const snapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
    return snapshot.docs.map((item) => clientFrom(item.id, item.data()));
  }

  /**
   * Strictly READ-ONLY lookup of a client record by ID. Zero side-effects.
   */
  async getClientById(id: string): Promise<Client | null> {
    const snapshot = await getDoc(doc(db, CLIENTS_COLLECTION, id));
    return snapshot.exists() ? clientFrom(snapshot.id, snapshot.data()) : null;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const assignedClientId = input.clientId || (await getNextClientIdAtomic());

    const sanitizedInput = removeUndefinedFields({
      ...input,
      clientId: assignedClientId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const result = await addDoc(collection(db, CLIENTS_COLLECTION), sanitizedInput);
    const created = await this.getClientById(result.id);
    if (!created) throw new Error('Client creation could not be verified.');
    return created;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const sanitizedUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, CLIENTS_COLLECTION, id), sanitizedUpdates);
    const updated = await this.getClientById(id);
    if (!updated) throw new Error('Client update could not be verified.');
    return updated;
  }
}

export const clientRepository = new ClientRepository();


