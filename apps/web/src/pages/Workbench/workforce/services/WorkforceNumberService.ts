export class WorkforceNumberService {
  /**
   * Automatically generates sequential Workforce ID for OTS candidates following Hire Huub One standards.
   * Pattern: HHWF000001, HHWF000002...
   */
  static generateOtsWorkforceId(sequenceNumber: number): string {
    const padded = sequenceNumber.toString().padStart(6, '0');
    return `HHWF${padded}`;
  }

  /**
   * Formats active date into a human readable Working From display.
   * e.g., '2026-07-15' -> '15 Jul 2026'
   */
  static calculateWorkingFrom(activeDate: string): string {
    if (!activeDate) return 'N/A';
    try {
      const date = new Date(activeDate);
      if (isNaN(date.getTime())) return activeDate;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return activeDate;
    }
  }

  /**
   * Calculates total elapsed days from joining/active date until last working date or current date.
   */
  static calculateTenureDays(startDateStr: string, lastWorkingDateStr?: string): number {
    if (!startDateStr) return 0;
    try {
      const start = new Date(startDateStr);
      const end = lastWorkingDateStr ? new Date(lastWorkingDateStr) : new Date();
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Formats tenure days into user friendly display string.
   */
  static formatTenure(tenureDays: number): string {
    if (tenureDays <= 0) return '0 Days';
    if (tenureDays === 1) return '1 Day';
    return `${tenureDays} Days`;
  }
}
