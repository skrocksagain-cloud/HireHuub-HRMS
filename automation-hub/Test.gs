/**
 * Hire Huub Automation Hub - Foundation Verification Test Suite
 *
 * Runs test cases directly within Google Apps Script Editor or Node test runners.
 * Verifies all 8 foundation requirements specified in Step 1.
 */

/**
 * Main Test Runner
 * Execute this function to verify the entire foundation.
 */
function runFoundationTestSuite() {
  Logger.log("==================================================");
  Logger.log("STARTING HIRE HUUB AUTOMATION HUB TEST SUITE");
  Logger.log("==================================================");

  var passed = 0;
  var failed = 0;

  function assertTest(name, condition, details) {
    if (condition) {
      Logger.log("[PASS] " + name);
      passed++;
    } else {
      Logger.log("[FAIL] " + name + " -> Details: " + JSON.stringify(details));
      failed++;
    }
  }

  // ----------------------------------------------------
  // Test 1: OFFER_LETTER routing without templateId
  // ----------------------------------------------------
  var req1 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "OFFER_LETTER",
        entityId: "EMP-1001",
        requestId: "test-req-001",
        data: { candidateName: "John Doe" }
      })
    }
  };
  var res1 = JSON.parse(doPost(req1).getContent());
  assertTest(
    "Test 1: OFFER_LETTER routing (missing templateId handling)",
    res1.success === false &&
    res1.requestId === "test-req-001" &&
    res1.error.code === "TEMPLATE_NOT_FOUND" &&
    res1.documentType === "OFFER_LETTER",
    res1
  );

  // ----------------------------------------------------
  // Test 2: Missing brandId
  // ----------------------------------------------------
  var req2 = {
    postData: {
      contents: JSON.stringify({
        documentType: "OFFER_LETTER",
        entityId: "EMP-1001"
      })
    }
  };
  var res2 = JSON.parse(doPost(req2).getContent());
  assertTest(
    "Test 2: Missing brandId validation",
    res2.success === false && res2.error.code === "MISSING_BRAND_ID",
    res2
  );

  // ----------------------------------------------------
  // Test 3: Missing documentType
  // ----------------------------------------------------
  var req3 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        entityId: "EMP-1001"
      })
    }
  };
  var res3 = JSON.parse(doPost(req3).getContent());
  assertTest(
    "Test 3: Missing documentType validation",
    res3.success === false && res3.error.code === "MISSING_DOCUMENT_TYPE",
    res3
  );

  // ----------------------------------------------------
  // Test 4: Missing entityId
  // ----------------------------------------------------
  var req4 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "OFFER_LETTER"
      })
    }
  };
  var res4 = JSON.parse(doPost(req4).getContent());
  assertTest(
    "Test 4: Missing entityId validation",
    res4.success === false && res4.error.code === "MISSING_ENTITY_ID",
    res4
  );

  // ----------------------------------------------------
  // Test 5: Invalid JSON body
  // ----------------------------------------------------
  var req5 = {
    postData: {
      contents: "{ invalid_json_payload: "
    }
  };
  var res5 = JSON.parse(doPost(req5).getContent());
  assertTest(
    "Test 5: Invalid JSON syntax handling",
    res5.success === false && res5.error.code === "INVALID_JSON",
    res5
  );

  // ----------------------------------------------------
  // Test 6: Unsupported / Unknown document type
  // ----------------------------------------------------
  var req6 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "UNKNOWN_FUTURE_DOC",
        entityId: "DOC-999"
      })
    }
  };
  var res6 = JSON.parse(doPost(req6).getContent());
  assertTest(
    "Test 6: Unknown document type handling",
    res6.success === false && res6.error.code === "DOCUMENT_TYPE_NOT_IMPLEMENTED",
    res6
  );

  // ----------------------------------------------------
  // Test 7: Auto Request ID generation when omitted
  // ----------------------------------------------------
  var req7 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "PAYSLIP",
        entityId: "PAY-2026-08"
      })
    }
  };
  var res7 = JSON.parse(doPost(req7).getContent());
  assertTest(
    "Test 7: Automatic Request ID generation",
    res7.success === false && typeof res7.requestId === "string" && res7.requestId.length > 5,
    res7
  );

  // ----------------------------------------------------
  // Test 8: Response contract structure verification
  // ----------------------------------------------------
  var req8 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "INVOICE",
        entityId: "INV-500",
        requestId: "req-verify-contract"
      })
    }
  };
  var res8 = JSON.parse(doPost(req8).getContent());
  var keys = Object.keys(res8);
  var expectedKeys = [
    "success", "requestId", "documentId", "documentType",
    "fileName", "fileUrl", "driveFileId", "version", "generatedAt", "error"
  ];
  var contractValid = expectedKeys.every(function(k) { return keys.indexOf(k) !== -1; });

  assertTest(
    "Test 8: Generic Response Contract completeness",
    contractValid && res8.documentId === null && res8.fileUrl === null,
    res8
  );

  // ----------------------------------------------------
  // Test 9: Missing offerDate validation
  // ----------------------------------------------------
  var req9 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "OFFER_LETTER",
        entityId: "HH/OFFER/2026/0001",
        template: { templateId: "dummy_template_id" },
        folderId: "dummy_folder_id",
        data: { candidateName: "Ananya Roy" }
      })
    }
  };
  var res9 = JSON.parse(doPost(req9).getContent());
  assertTest(
    "Test 9: Missing offerDate validation error",
    res9.success === false && res9.error.code === "INVALID_OFFER_DATE",
    res9
  );

  // ----------------------------------------------------
  // Test 10: Invalid offerDate format validation
  // ----------------------------------------------------
  var req10 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "OFFER_LETTER",
        entityId: "HH/OFFER/2026/0001",
        template: { templateId: "dummy_template_id" },
        folderId: "dummy_folder_id",
        data: { candidateName: "Ananya Roy", offerDate: "INVALID_DATE" }
      })
    }
  };
  var res10 = JSON.parse(doPost(req10).getContent());
  assertTest(
    "Test 10: Invalid offerDate format validation error",
    res10.success === false && res10.error.code === "INVALID_OFFER_DATE",
    res10
  );

  // ----------------------------------------------------
  // Test 11: Missing folderId storage error
  // ----------------------------------------------------
  var req11 = {
    postData: {
      contents: JSON.stringify({
        brandId: "hirehuub",
        documentType: "OFFER_LETTER",
        entityId: "HH/OFFER/2026/0001",
        template: { templateId: "dummy_template_id" },
        data: { candidateName: "Ananya Roy", offerDate: "2026-08-16" }
      })
    }
  };
  var res11 = JSON.parse(doPost(req11).getContent());
  assertTest(
    "Test 11: Missing folderId returns STORAGE_NOT_CONFIGURED error",
    res11.success === false && res11.error.code === "STORAGE_NOT_CONFIGURED",
    res11
  );

  // ----------------------------------------------------
  // Test 12: Person Being Offered Placeholder Dictionary Mapping
  // ----------------------------------------------------
  var sampleDict = buildOfferPlaceholderDictionary({ entityId: "HH/OFFER/2026/0001" }, {
    candidateName: "Ananya Roy",
    candidateAddress: "Bangalore",
    candidateEmail: "ananya@example.com",
    candidatePhone: "+91 98765 43210",
    offerDate: "2026-08-16",
    monthlyGross: 25000
  });

  assertTest(
    "Test 12: Person Being Offered placeholders mapped correctly",
    sampleDict.PERSON_NAME === "Ananya Roy" &&
    sampleDict.PERSON_ADDRESS === "Bangalore" &&
    sampleDict.PERSON_EMAIL === "ananya@example.com" &&
    sampleDict.PERSON_PHONE === "+91 98765 43210" &&
    sampleDict.CANDIDATE_NAME === "Ananya Roy",
    sampleDict
  );

  Logger.log("==================================================");
  Logger.log("RESULTS: " + passed + " PASSED, " + failed + " FAILED.");
  Logger.log("==================================================");

  return { passed: passed, failed: failed };
}
