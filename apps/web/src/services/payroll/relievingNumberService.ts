import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export class RelievingNumberService {
  /**
   * Reads the expected next reference number without modifying the database or incrementing sequence.
   * Used for UI drawer preview.
   */
  static async peekNextReference(year?: number): Promise<string> {
    const targetYear = year || new Date().getFullYear();
    const counterDocId = `relieving_letters_${targetYear}`;
    const counterRef = doc(db, 'counters', counterDocId);

    try {
      const snap = await getDoc(counterRef);
      let nextSeq = 1;
      if (snap.exists()) {
        const data = snap.data();
        nextSeq = (Number(data.lastSequence) || 0) + 1;
      }
      const paddedSeq = String(nextSeq).padStart(3, '0');
      return `REL/${targetYear}/${paddedSeq}`;
    } catch {
      return `REL/${targetYear}/001`;
    }
  }

  /**
   * Generates a global company-wide Relieving Letter reference string:
   * Format: REL/{YYYY}/{SEQUENCE} (e.g. REL/2026/001)
   *
   * Features:
   * - Independent of Brand.
   * - Separate yearly sequence resetting each calendar year.
   * - Persisted atomically in Firestore `counters/relieving_letters_{YYYY}`.
   * - Executed exactly ONCE per document generation request.
   */
  static async generateRelievingReference(year?: number): Promise<string> {
    const targetYear = year || new Date().getFullYear();
    const counterDocId = `relieving_letters_${targetYear}`;
    const counterRef = doc(db, 'counters', counterDocId);

    const sequenceNum = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;

      if (counterSnap.exists()) {
        const data = counterSnap.data();
        nextSeq = (Number(data.lastSequence) || 0) + 1;
      }

      transaction.set(
        counterRef,
        {
          year: targetYear,
          lastSequence: nextSeq,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return nextSeq;
    });

    const paddedSeq = String(sequenceNum).padStart(3, '0');
    return `REL/${targetYear}/${paddedSeq}`;
  }
}
