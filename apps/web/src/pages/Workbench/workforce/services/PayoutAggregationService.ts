import type { ClientPayoutImportRecord, ClientPayoutImportRow, ImportValidationSummary, WorkforceItem } from '../types/workforce';

export class PayoutAggregationService {
  /**
   * Aggregates weekly, fortnightly, and monthly import records into monthly total earnings and orders per candidate.
   */
  static aggregateMonthlyTotals(
    employeeId: string,
    activeMonth: string,
    imports: ClientPayoutImportRecord[]
  ): { totalEarnings: number; totalOrders: number; lastImportDate?: string } {
    let totalEarnings = 0;
    let totalOrders = 0;
    let lastImportDate: string | undefined = undefined;

    const relevantImports = imports.filter(
      (imp) => imp.month === activeMonth && imp.isApproved
    );

    for (const imp of relevantImports) {
      const match = imp.rows.find(
        (r) => r.employeeId.trim().toLowerCase() === employeeId.trim().toLowerCase()
      );

      if (match) {
        totalEarnings += match.earnings || 0;
        totalOrders += match.orders || 0;
        if (!lastImportDate || new Date(imp.importedAt) > new Date(lastImportDate)) {
          lastImportDate = imp.importedAt;
        }
      }
    }

    return {
      totalEarnings,
      totalOrders,
      lastImportDate,
    };
  }

  /**
   * Validates raw uploaded rows against existing workforce single source records.
   * Computes Matched, Unmatched, Duplicate Employee IDs, Missing Employee IDs, Invalid Earnings.
   */
  static validateImportRows(
    rawRows: Array<{ rawEmployeeId: string; rawName: string; rawEarnings: number; rawOrders?: number }>,
    existingWorkforce: WorkforceItem[]
  ): { validationSummary: ImportValidationSummary; processedRows: ClientPayoutImportRow[] } {
    let matchedCount = 0;
    let unmatchedCount = 0;
    let duplicateCount = 0;
    let missingIdCount = 0;
    let invalidEarningsCount = 0;

    const seenIds = new Set<string>();
    const processedRows: ClientPayoutImportRow[] = [];

    const existingEmpIds = new Set(
      existingWorkforce.map((w) => w.id.trim().toLowerCase())
    );

    for (const raw of rawRows) {
      const cleanEmpId = (raw.rawEmployeeId || '').trim();
      const cleanName = (raw.rawName || '').trim();
      const earnings = Number(raw.rawEarnings) || 0;
      const orders = raw.rawOrders !== undefined ? Number(raw.rawOrders) : undefined;

      let validationStatus: 'Valid' | 'Duplicate Employee ID' | 'Missing Employee ID' | 'Invalid Earnings' = 'Valid';
      let isMatched = false;

      if (!cleanEmpId) {
        validationStatus = 'Missing Employee ID';
        missingIdCount++;
      } else if (seenIds.has(cleanEmpId.toLowerCase())) {
        validationStatus = 'Duplicate Employee ID';
        duplicateCount++;
      } else if (isNaN(earnings) || earnings < 0) {
        validationStatus = 'Invalid Earnings';
        invalidEarningsCount++;
      } else {
        seenIds.add(cleanEmpId.toLowerCase());
        isMatched = existingEmpIds.has(cleanEmpId.toLowerCase());

        if (isMatched) {
          matchedCount++;
        } else {
          unmatchedCount++;
        }
      }

      processedRows.push({
        employeeId: cleanEmpId || 'MISSING',
        candidateName: cleanName || 'Unknown Candidate',
        earnings,
        orders,
        matched: isMatched,
        validationStatus,
      });
    }

    const totalRecords = rawRows.length;
    const canProceed = totalRecords > 0 && duplicateCount === 0 && missingIdCount === 0 && invalidEarningsCount === 0;

    return {
      validationSummary: {
        totalRecords,
        matchedRecords: matchedCount,
        unmatchedRecords: unmatchedCount,
        duplicateCount,
        missingIdCount,
        invalidEarningsCount,
        canProceed,
      },
      processedRows,
    };
  }
}
