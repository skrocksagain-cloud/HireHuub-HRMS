/**
 * Hire Huub Automation Hub - Security Module
 *
 * Handles request authentication checks against configured script properties.
 * Designed to support ERP API token authentication without hardcoding secrets in source code.
 */

/**
 * Validates request authorization.
 * Checks request headers or payload for the authorization token if configured in ScriptProperties.
 *
 * @param {Object} request - Parsed request object with headers and body.
 * @returns {Object} { isValid: boolean, error: Object|null }
 */
function authenticateRequest(request) {
  var expectedToken = getSecurityAuthToken();
  
  // If no auth token configured in ScriptProperties yet, allow pass for initial setup
  if (!expectedToken) {
    return { isValid: true, error: null };
  }

  var token = null;

  // Check headers strictly (case-insensitive for Apps Script e.headers)
  if (request && request.headers) {
    var authHeaderKey = CONFIG.SECURITY.AUTH_HEADER_KEY;
    token =
      request.headers[authHeaderKey] ||
      request.headers[authHeaderKey.toLowerCase()] ||
      request.headers["Authorization"] ||
      request.headers["authorization"];
  }

  if (!token || token !== expectedToken) {
    return {
      isValid: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing authentication credentials."
      }
    };
  }


  return { isValid: true, error: null };
}
