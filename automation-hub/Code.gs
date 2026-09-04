/**
 * Hire Huub Automation Hub - Main Web App Entry Point
 *
 * Handles HTTP GET / POST requests from external callers (ERP).
 * Entry point for Google Apps Script Web App deployment.
 */

/**
 * Main Web App POST Request Handler
 *
 * @param {Object} e - Apps Script HTTP Event Object.
 * @returns {TextOutput} JSON response.
 */
function doPost(e) {
  var startTime = new Date().getTime();
  var requestId = generateRequestId();
  
  try {
    // 1. Check for request data
    if (!e || !e.postData || !e.postData.contents) {
      logExecutionEvent(requestId, null, null, "BAD_REQUEST", { errorCode: "EMPTY_BODY" });
      return createJsonResponse({
        success: false,
        requestId: requestId,
        documentId: null,
        documentType: null,
        fileName: null,
        fileUrl: null,
        driveFileId: null,
        version: CONFIG.VERSION,
        generatedAt: new Date().toISOString(),
        error: {
          code: "INVALID_REQUEST",
          message: "POST request must include a non-empty JSON body."
        }
      }, 400);
    }

    // 2. Parse JSON
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      logExecutionEvent(requestId, null, null, "INVALID_JSON", { errorCode: "JSON_PARSE_FAILED" });
      return createJsonResponse({
        success: false,
        requestId: requestId,
        documentId: null,
        documentType: null,
        fileName: null,
        fileUrl: null,
        driveFileId: null,
        version: CONFIG.VERSION,
        generatedAt: new Date().toISOString(),
        error: {
          code: "INVALID_JSON",
          message: "Failed to parse request body as valid JSON."
        }
      }, 400);
    }

    // 3. Preserve or assign Request ID
    if (payload && payload.requestId && typeof payload.requestId === "string" && payload.requestId.trim() !== "") {
      requestId = payload.requestId.trim();
    }

    // 4. Security / Authentication Check
    var authResult = authenticateRequest({ headers: (e ? e.headers : {}), body: payload });
    if (!authResult.isValid) {
      logExecutionEvent(requestId, payload.brandId, payload.documentType, "UNAUTHORIZED", { errorCode: authResult.error.code });
      return createJsonResponse({
        success: false,
        requestId: requestId,
        documentId: null,
        documentType: payload.documentType || null,
        fileName: null,
        fileUrl: null,
        driveFileId: null,
        version: CONFIG.VERSION,
        generatedAt: new Date().toISOString(),
        error: authResult.error
      }, 401);
    }

    // 5. Validate Required Generic Request Contract
    var valResult = validateRequestPayload(payload);
    if (!valResult.isValid) {
      logExecutionEvent(requestId, payload ? payload.brandId : null, payload ? payload.documentType : null, "VALIDATION_FAILED", {
        errorCode: valResult.error.code,
        errorMessage: valResult.error.message
      });
      return createJsonResponse({
        success: false,
        requestId: requestId,
        documentId: null,
        documentType: payload ? payload.documentType || null : null,
        fileName: null,
        fileUrl: null,
        driveFileId: null,
        version: CONFIG.VERSION,
        generatedAt: new Date().toISOString(),
        error: valResult.error
      }, 400);
    }

    // Log request start (without sensitive payload fields)
    logExecutionEvent(requestId, payload.brandId, payload.documentType, "PROCESSING_REQUEST");

    // 6. Route Document Request
    var response = routeDocumentRequest(payload, requestId);
    var durationMs = new Date().getTime() - startTime;

    // Log completion / routing result
    logExecutionEvent(requestId, payload.brandId, payload.documentType, response.success ? "SUCCESS" : "NOT_IMPLEMENTED", {
      durationMs: durationMs,
      errorCode: response.error ? response.error.code : null
    });

    return createJsonResponse(response, response.success ? 200 : 200);

  } catch (err) {
    var errDuration = new Date().getTime() - startTime;
    logExecutionEvent(requestId, null, null, "INTERNAL_ERROR", {
      durationMs: errDuration,
      errorMessage: err.message
    });

    return createJsonResponse({
      success: false,
      requestId: requestId,
      documentId: null,
      documentType: null,
      fileName: null,
      fileUrl: null,
      driveFileId: null,
      version: CONFIG.VERSION,
      generatedAt: new Date().toISOString(),
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during request processing."
      }
    }, 500);
  }
}

/**
 * Main Web App GET Request Handler (Health Check)
 *
 * @param {Object} e - Apps Script HTTP Event Object.
 * @returns {TextOutput} JSON response.
 */
function doGet(e) {
  return createJsonResponse({
    success: true,
    name: CONFIG.APP_NAME,
    version: CONFIG.VERSION,
    environment: CONFIG.ENVIRONMENT,
    status: "ONLINE",
    message: "Hire Huub Automation Hub Web App Endpoint is operational."
  }, 200);
}

/**
 * Generates a unique UUID v4 format Request ID if one is omitted in request.
 *
 * @returns {string} Unique request ID.
 */
function generateRequestId() {
  try {
    return Utilities.getUuid();
  } catch (err) {
    return "req_" + new Date().getTime() + "_" + Math.floor(Math.random() * 100000);
  }
}

/**
 * Creates standardized TextOutput JSON response for Apps Script Web App.
 *
 * @param {Object} data - JavaScript object payload.
 * @param {number} [statusCode] - Optional HTTP status code (informational reference).
 * @returns {TextOutput} Standard Google Apps Script ContentService output.
 */
function createJsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}
