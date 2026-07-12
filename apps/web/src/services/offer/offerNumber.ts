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
 * ==================================================
 * Generate Offer Number
 *
 * Format:
 *
 * OFF-2026-000001
 * OFF-2026-000002
 * OFF-2026-000003
 * ==================================================
 */
export async function generateOfferNumber(): Promise<{
  offerId: string;
  offerSequence: number;
}> {
  return runTransaction(
    db,
    async (transaction) => {
      const snapshot = await transaction.get(
        COUNTER_DOCUMENT
      );

      // Create counter document if it doesn't exist
      if (!snapshot.exists()) {
        transaction.set(COUNTER_DOCUMENT, {
          employeeSequence: 0,
          offerSequence: 1,
        });

        const year = new Date().getFullYear();

        return {
          offerId: `OFF-${year}-000001`,
          offerSequence: 1,
        };
      }

      const data = snapshot.data() as {
        offerSequence?: number;
        employeeSequence?: number;
      };

      const nextSequence =
        (data.offerSequence ?? 0) + 1;

      transaction.update(COUNTER_DOCUMENT, {
        offerSequence: nextSequence,
      });

      const year = new Date().getFullYear();

      return {
        offerId: `OFF-${year}-${String(
          nextSequence
        ).padStart(6, "0")}`,
        offerSequence: nextSequence,
      };
    }
  );
}