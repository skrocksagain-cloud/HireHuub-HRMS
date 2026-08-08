/**
 * Calculates Cost per Lead
 */
export function calculateCostPerLead(actualSpend: number, actualLeads: number): number {
  if (!actualLeads || actualLeads <= 0) return 0;
  return Number((actualSpend / actualLeads).toFixed(2));
}

/**
 * Calculates Cost per Join
 */
export function calculateCostPerJoin(actualSpend: number, actualJoins: number): number {
  if (!actualJoins || actualJoins <= 0) return 0;
  return Number((actualSpend / actualJoins).toFixed(2));
}

/**
 * Calculates Conversion Rate Percentage
 */
export function calculateConversionRate(actualJoins: number, actualLeads: number): number {
  if (!actualLeads || actualLeads <= 0) return 0;
  return Number(((actualJoins / actualLeads) * 100).toFixed(2));
}

/**
 * Formats a numeric value into Indian Rupee currency string
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Formats ISO date string to readable format
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
