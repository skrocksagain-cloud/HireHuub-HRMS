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
 * Generate the next HireHuub Employee ID.
 *
 * Format:
 * HH000001
 * HH000002
 * HH000003
 */
export async function generateEmployeeId(): Promise<{
  employeeId: string;
  employeeSequence: number;
}> {
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(
      COUNTER_DOCUMENT
    );

    if (!snapshot.exists()) {
      transaction.set(COUNTER_DOCUMENT, {
        employeeSequence: 1,
      });

      return {
        employeeId: "HH000001",
        employeeSequence: 1,
      };
    }

    const data = snapshot.data() as {
      employeeSequence?: number;
    };

    const nextSequence =
      (data.employeeSequence ?? 0) + 1;

    transaction.update(COUNTER_DOCUMENT, {
      employeeSequence: nextSequence,
    });

    return {
      employeeId: `HH${String(nextSequence).padStart(
        6,
        "0"
      )}`,
      employeeSequence: nextSequence,
    };
  });
}