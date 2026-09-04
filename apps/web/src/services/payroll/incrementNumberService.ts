import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const COUNTER_COLLECTION = 'counters';

export class IncrementNumberService {
  /**
   * Reads the expected next reference number without modifying the database or incrementing sequence.
   */
  static async peekNextReference(year?: number): Promise<string> {
    const targetYear = year || new Date().getFullYear();
    const counterDocId = `increment_letters_${targetYear}`;
    const counterRef = doc(db, COUNTER_COLLECTION, counterDocId);

    try {
      const snap = await getDoc(counterRef);
      const lastSeq = snap.exists() ? (snap.data().lastSequence || 0) : 0;
      const nextSeq = lastSeq + 1;
      const seqStr = String(nextSeq).padStart(3, '0');
      return `INC/${targetYear}/${seqStr}`;
    } catch {
      return `INC/${targetYear}/001`;
    }
  }

  /**
   * Generates next reference number atomically using a Firestore transaction.
   */
  static async generateIncrementReference(year?: number): Promise<string> {
    const targetYear = year || new Date().getFullYear();
    const counterDocId = `increment_letters_${targetYear}`;
    const counterRef = doc(db, COUNTER_COLLECTION, counterDocId);

    try {
      const newSequence = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let nextSequence = 1;
        if (counterDoc.exists()) {
          const data = counterDoc.data();
          const lastSeq = typeof data.lastSequence === 'number' ? data.lastSequence : 0;
          nextSequence = lastSeq + 1;
        }

        transaction.set(
          counterRef,
          {
            year: targetYear,
            lastSequence: nextSequence,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        return nextSequence;
      });

      const sequenceString = String(newSequence).padStart(3, '0');
      return `INC/${targetYear}/${sequenceString}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to generate Increment reference number: ${msg}`);
    }
  }
}
