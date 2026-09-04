/**
 * Hire Huub Automation Hub - Logger Module
 *
 * Provides structured logging without revealing sensitive data.
 * Adheres to rule: No console.log statements. Uses Logger.log / StackDriver logging instead.
 */

/**
 * Logs a request event in a clean, structured JSON format.
 *
 * @param {string} requestId - Unique request identifier.
 * @param {string} brandId - Target brand ID.
 * @param {string} documentType - Requested document type.
 * @param {string} status - Event status (e.g. RECEIVED, VALIDATED, NOT_IMPLEMENTED, ERROR, COMPLETED).
 * @param {Object} [extraDetails] - Additional safe operational metadata (NO sensitive content).
 */
function logExecutionEvent(requestId, brandId, documentType, status, extraDetails) {
  var logEntry = {
    timestamp: new Date().toISOString(),
    appName: CONFIG.APP_NAME,
    version: CONFIG.VERSION,
    requestId: requestId || "N/A",
    brandId: brandId || "N/A",
    documentType: documentType || "N/A",
    status: status
  };

  if (extraDetails && typeof extraDetails === "object") {
    // Only copy non-sensitive diagnostic info if safe
    if (extraDetails.errorCode) logEntry.errorCode = extraDetails.errorCode;
    if (extraDetails.errorMessage) logEntry.errorMessage = extraDetails.errorMessage;
    if (extraDetails.durationMs) logEntry.durationMs = extraDetails.durationMs;
  }

  // Google Apps Script built-in logger (no prohibited console.log)
  Logger.log(JSON.stringify(logEntry));
}
