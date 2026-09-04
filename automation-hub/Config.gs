/**
 * Hire Huub Automation Hub - Centralized Configuration
 *
 * Provides configuration constants, brand registry, supported document types,
 * and security property accessors. Keep separate from document logic.
 */

var CONFIG = {
  APP_NAME: "Hire Huub Automation Hub",
  VERSION: "1.0.0-foundation",
  ENVIRONMENT: "production",
  
  // Currently active brand IDs
  ACTIVE_BRANDS: ["hirehuub"],
  DEFAULT_BRAND: "hirehuub",
  
  // Supported Document Types (Registry for future document generators)
  DOCUMENT_TYPES: {
    OFFER_LETTER: "OFFER_LETTER",
    APPOINTMENT_LETTER: "APPOINTMENT_LETTER",
    EXPERIENCE_LETTER: "EXPERIENCE_LETTER",
    RELIEVING_LETTER: "RELIEVING_LETTER",
    PAYSLIP: "PAYSLIP",
    INVOICE: "INVOICE",
    CREDIT_NOTE: "CREDIT_NOTE",
    DEBIT_NOTE: "DEBIT_NOTE",
    QUOTATION: "QUOTATION",
    PURCHASE_ORDER: "PURCHASE_ORDER",
    WORK_ORDER: "WORK_ORDER"
  },
  
  // Security property keys stored in Apps Script ScriptProperties
  SECURITY: {
    AUTH_HEADER_KEY: "X-HireHuub-Auth-Token",
    SCRIPT_PROP_AUTH_TOKEN: "AUTOMATION_HUB_AUTH_TOKEN"
  }
};

/**
 * Gets the configured Auth Token from Apps Script ScriptProperties.
 * Returns null if not configured (allowing unauthenticated dev mode if explicitly handled).
 */
function getSecurityAuthToken() {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty(CONFIG.SECURITY.SCRIPT_PROP_AUTH_TOKEN);
  } catch (err) {
    return null;
  }
}
