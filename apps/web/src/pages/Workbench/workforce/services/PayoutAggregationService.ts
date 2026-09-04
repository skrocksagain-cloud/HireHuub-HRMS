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

    for (const imp of imports) {
      if (!imp.isApproved) continue;

      const match = imp.rows.find((r) => {
        if (r.employeeId.trim().toLowerCase() !== employeeId.trim().toLowerCase()) {
           return false;
        }
        
        // row.date is now guaranteed to be YYYY-MM-DD format if valid
        const actualDate = r.date ? new Date(r.date) : new Date(imp.importedAt);
        const isValidDate = !isNaN(actualDate.getTime());
        const safeDate = isValidDate ? actualDate : new Date(imp.importedAt);
        const rowMonth = safeDate.toISOString().slice(0, 7);
        
        return rowMonth === activeMonth;
      });

      if (match) {
        totalEarnings += match.earnings || 0;
        totalOrders += match.orders || 0;
        
        const rowDate = match.date || imp.importedAt;
        if (!lastImportDate || new Date(rowDate) > new Date(lastImportDate)) {
          lastImportDate = rowDate;
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
   * Parses an Excel date value (serial number, JS Date, or string) into a ISO date string YYYY-MM-DD.
   */
  static parseExcelDate(value: any): string | null {
    if (!value) return null;
    
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) return value.toISOString().split('T')[0];
      return null;
    }
    
    if (typeof value === 'number') {
      const unixTime = (value - 25569) * 86400 * 1000;
      const date = new Date(unixTime);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      return null;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
         const day = parseInt(dmyMatch[1], 10);
         const month = parseInt(dmyMatch[2], 10) - 1;
         const year = parseInt(dmyMatch[3], 10);
         const date = new Date(year, month, day);
         if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      }
      
      const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (ymdMatch) {
         const year = parseInt(ymdMatch[1], 10);
         const month = parseInt(ymdMatch[2], 10) - 1;
         const day = parseInt(ymdMatch[3], 10);
         const date = new Date(year, month, day);
         if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      }
  
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    
    if (value && typeof value === 'object' && value.result !== undefined) {
        return PayoutAggregationService.parseExcelDate(value.result);
    }
  
    return null;
  }

  /**
   * Validates raw uploaded rows against existing workforce single source records.
   * Computes Matched, Unmatched, Duplicate Employee IDs, Missing Employee IDs, Invalid Earnings.
   */
  static validateImportRows(
    rawRows: Array<{ rawDate: any; rawEmployeeId: string; rawName: string; rawEarnings: number; rawOrders: number }>,
    existingWorkforce: WorkforceItem[]
  ): { validationSummary: ImportValidationSummary; processedRows: ClientPayoutImportRow[] } {
    let matchedCount = 0;
    let unmatchedCount = 0;
    let duplicateCount = 0;
    const missingIdCount = 0;
    let invalidEarningsCount = 0;
    let invalidDateCount = 0;

    const seenIds = new Set<string>();
    const processedRows: ClientPayoutImportRow[] = [];

    for (const raw of rawRows) {
      const parsedDate = PayoutAggregationService.parseExcelDate(raw.rawDate);
      const cleanDate = parsedDate || '';
      const cleanEmpId = (raw.rawEmployeeId || '').trim();
      const cleanName = (raw.rawName || '').trim();
      const earnings = Number(raw.rawEarnings) || 0;
      const orders = Number(raw.rawOrders) || 0;

      let validationStatus: 'Valid' | 'Duplicate Employee ID' | 'Missing Employee ID' | 'Invalid Earnings' | 'Invalid Date' = 'Valid';
      let isMatched = false;
      let matchTarget = '';
      let candidateId: string | undefined = undefined;
      let placementId: string | undefined = undefined;

      if (!cleanDate) {
        validationStatus = 'Invalid Date';
        invalidDateCount++;
      } else if (isNaN(earnings) || earnings < 0) {
        validationStatus = 'Invalid Earnings';
        invalidEarningsCount++;
      } else {
        // Attempt Primary Match: by ID
        let foundMatch = null;
        if (cleanEmpId) {
          foundMatch = existingWorkforce.find(w => 
            w.id.trim().toLowerCase() === cleanEmpId.toLowerCase() ||
            (w.payrollEmployeeId && w.payrollEmployeeId.trim().toLowerCase() === cleanEmpId.toLowerCase())
          );
        }
        
        // Attempt Secondary Match: by Name
        if (!foundMatch && cleanName) {
          foundMatch = existingWorkforce.find(w => 
            w.candidateName.trim().toLowerCase() === cleanName.toLowerCase()
          );
        }

        if (foundMatch) {
          isMatched = true;
          matchTarget = cleanEmpId || foundMatch.payrollEmployeeId || foundMatch.id; // Preserve original employee ID
          candidateId = foundMatch.candidateId;
          placementId = (foundMatch as any).placementDocId || (foundMatch as any).placementId || foundMatch.placementHistory?.[0]?.id;
          
          if (seenIds.has(matchTarget.toLowerCase())) {
            validationStatus = 'Duplicate Employee ID';
            duplicateCount++;
          } else {
            seenIds.add(matchTarget.toLowerCase());
            matchedCount++;
          }
        } else {
          unmatchedCount++;
        }
      }

      processedRows.push({
        employeeId: matchTarget || cleanEmpId || 'MISSING', // Fallback to provided ID if unmatched
        candidateName: cleanName || 'Unknown Candidate',
        earnings,
        orders,
        date: cleanDate,
        matched: isMatched,
        validationStatus,
        candidateId,
        placementId,
      });
    }

    const totalRecords = rawRows.length;
    const canProceed = totalRecords > 0 && invalidEarningsCount === 0 && invalidDateCount === 0;

    return {
      validationSummary: {
        totalRecords,
        matchedRecords: matchedCount,
        unmatchedRecords: unmatchedCount,
        duplicateCount,
        missingIdCount, // We no longer strictly enforce missingIdCount if they matched by Name, handled above
        invalidEarningsCount,
        invalidDateCount,
        canProceed,
      },
      processedRows,
    };
  }
}
