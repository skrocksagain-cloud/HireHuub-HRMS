import React, { useState } from "react";
import { AutomationService, type AutomationDocumentResponse } from "../../services/automation/automationService";


export const AutomationHubTestModal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AutomationDocumentResponse | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setResponse(null);

    const testPayload = {
      brandId: "hirehuub",
      documentType: "OFFER_LETTER",
      entityId: "TEST-EMP-001",
      requestId: `req_test_${Date.now()}`,
      data: {},
      editableData: {},
    };

    const res = await AutomationService.requestDocumentGeneration(testPayload);
    setResponse(res);
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc", marginTop: "20px" }}>
      <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a" }}>Automation Hub Dev Connection Test</h3>
      <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 15px 0" }}>
        Admin/Dev utility to send a test <code>OFFER_LETTER</code> request via secure Firebase Cloud Function. Expected return code: <code>DOCUMENT_TYPE_NOT_IMPLEMENTED</code>.
      </p>

      <button
        onClick={handleRunTest}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "#0284c7",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending HTTPS Request..." : "Run Connection Test"}
      </button>

      {response && (
        <div style={{ marginTop: "15px", padding: "12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: response.error?.code === "DOCUMENT_TYPE_NOT_IMPLEMENTED" ? "#0369a1" : "#b91c1c" }}>
            {response.error?.code === "DOCUMENT_TYPE_NOT_IMPLEMENTED"
              ? "✅ Connection Test Successful! Received Expected Response."
              : "⚠️ Connection Result Received"}
          </h4>
          <pre style={{ fontSize: "11px", background: "#f1f5f9", padding: "10px", borderRadius: "4px", overflowX: "auto" }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
