/**
 * Hire Huub Automation Hub - Validator Module
 *
 * Validates request payload according to the standard generic contract.
 * Standard fields: brandId, documentType, entityId, requestId, data, editableData
 */

/**
 * Validates the parsed JSON request body.
 *
 * @param {Object} body - Parsed JSON body.
 * @returns {Object} { isValid: boolean, error: Object|null }
 */
function validateRequestPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      isValid: false,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Request body must be a valid JSON object."
      }
    };
  }

  // Validate required generic fields
  if (!body.brandId || typeof body.brandId !== "string" || body.brandId.trim() === "") {
    return {
      isValid: false,
      error: {
        code: "MISSING_BRAND_ID",
        message: "Required field 'brandId' is missing or empty."
      }
    };
  }

  if (!body.documentType || typeof body.documentType !== "string" || body.documentType.trim() === "") {
    return {
      isValid: false,
      error: {
        code: "MISSING_DOCUMENT_TYPE",
        message: "Required field 'documentType' is missing or empty."
      }
    };
  }

  if (!body.entityId || typeof body.entityId !== "string" || body.entityId.trim() === "") {
    return {
      isValid: false,
      error: {
        code: "MISSING_ENTITY_ID",
        message: "Required field 'entityId' is missing or empty."
      }
    };
  }

  // Validate brand identification against active brands
  var normalizedBrand = body.brandId.trim().toLowerCase();
  if (CONFIG.ACTIVE_BRANDS.indexOf(normalizedBrand) === -1) {
    return {
      isValid: false,
      error: {
        code: "INVALID_BRAND",
        message: "Brand '" + body.brandId + "' is not recognized or supported."
      }
    };
  }

  return { isValid: true, error: null };
}
