import {
  doc,
  runTransaction,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

const COUNTER_DOCUMENT = doc(
  db,
  "settings",
  "counters"
);

/**
 * ============================================================
 * Generate Next Document Number
 *
 * Format:
 *
 * DOC000001
 * DOC000002
 * DOC000003
 * ============================================================
 */
export async function generateDocumentNumber(): Promise<{
  documentId: string;
  sequence: number;
}> {
  return await runTransaction(
    db,
    async (transaction) => {
      const snapshot = await transaction.get(
        COUNTER_DOCUMENT
      );

      if (!snapshot.exists()) {
        transaction.set(COUNTER_DOCUMENT, {
          documentSequence: 1,
        });

        return {
          documentId: "DOC000001",
          sequence: 1,
        };
      }

      const data = snapshot.data();

      const nextSequence =
        (data.documentSequence ?? 0) + 1;

      transaction.update(
        COUNTER_DOCUMENT,
        {
          documentSequence: nextSequence,
        }
      );

      return {
        documentId:
          "DOC" +
          String(nextSequence).padStart(
            6,
            "0"
          ),

        sequence: nextSequence,
      };
    }
  );
}