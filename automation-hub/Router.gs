/**
 * Hire Huub Automation Hub - Document Router Module
 *
 * Routes incoming requests based on documentType.
 * Returns structured error responses for unsupported document types.
 * DO NOT generate fake documents, PDFs, or mock files here in Step 1.
 */

/**
 * Routes the document request.
 *
 * @param {Object} payload - Validated request payload.
 * @param {string} requestId - Unique request ID.
 * @returns {Object} Response object conforming to response contract.
 */
function routeDocumentRequest(payload, requestId) {
  var docType = payload.documentType ? payload.documentType.toUpperCase() : "";

  // Check if document type is registered in CONFIG
  var isKnownType = false;
  for (var key in CONFIG.DOCUMENT_TYPES) {
    if (CONFIG.DOCUMENT_TYPES[key] === docType) {
      isKnownType = true;
      break;
    }
  }

  // Route OFFER_LETTER to Offer Letter Generator Engine
  if (docType === CONFIG.DOCUMENT_TYPES.OFFER_LETTER) {
    return generateOfferLetterDocument(payload, requestId);
  }

  // Foundation response for unsupported or un-implemented document generators
  return {
    success: false,
    requestId: requestId,
    documentId: null,
    documentType: payload.documentType,
    fileName: null,
    fileUrl: null,
    driveFileId: null,
    version: CONFIG.VERSION,
    generatedAt: new Date().toISOString(),
    error: {
      code: "DOCUMENT_TYPE_NOT_IMPLEMENTED",
      message: isKnownType
        ? "Document generation is not implemented for document type '" + payload.documentType + "' yet."
        : "Unknown or unsupported document type '" + payload.documentType + "'."
    }
  };
}
