import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  ShieldAlert,
} from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import SectionHeader from "../../../ui/SectionHeader";
import StatusBadge from "../../../ui/StatusBadge";
import Drawer from "../../../ui/Drawer";
import { creditNoteService } from "./services/creditNoteService";
import { billingService } from "./services/billingService";
import { permissionService } from "../../../core/permissions/permissionService";
import { useAuth } from "../../../context/AuthContext";
import type { CreditNote, CreateCreditNoteDraftInput } from "../../../types/CreditNote";

export default function CreditNotesPage() {
  const { user } = useAuth();
  const currentRole = (user?.role as string) || "Super Admin";
  const hasFinanceAccess = permissionService.canAccessFinance(currentRole);

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState<boolean>(false);

  // Create Form State
  const [previewCreditNoteNum, setPreviewCreditNoteNum] = useState<string>("HHCN2026-0001");
  const [originalInvoiceId, setOriginalInvoiceId] = useState<string>("HH2026-0001");
  const [reason, setReason] = useState<string>("Service Rate Adjustment / Discount");
  const [creating, setCreating] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  useEffect(() => {
    loadCreditNotes();
  }, []);

  useEffect(() => {
    if (showCreateDrawer) {
      billingService.previewNextCreditNoteNumber(creditNotes.length).then((num) => {
        setPreviewCreditNoteNum(num);
      });
    }
  }, [showCreateDrawer, creditNotes.length]);

  const loadCreditNotes = async () => {
    setLoading(true);
    try {
      const data = await creditNoteService.getCreditNoteHistory();
      setCreditNotes(data);
    } catch {
      setCreditNotes(getSampleCreditNotes());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError("");
    setActionSuccess("");

    try {
      const input: CreateCreditNoteDraftInput = {
        originalInvoiceId,
        creditType: "Full",
        creditDate: new Date().toISOString().split("T")[0],
        reason,
        selections: [],
      };
      await creditNoteService.createDraft(input, user?.name || "Finance Admin");
      setActionSuccess("Credit Note draft created successfully.");
      setShowCreateDrawer(false);
      await loadCreditNotes();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create Credit Note.");
    } finally {
      setCreating(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter((cn) => {
    const displayCnNum = cn.snapshot?.creditNoteNumber || cn.creditNoteNumber || cn.id;
    const displayInvNum = cn.snapshot?.originalInvoiceNumber || cn.originalInvoiceNumber || cn.originalInvoiceId;
    return (
      displayCnNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      displayInvNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cn.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!hasFinanceAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <ShieldAlert size={48} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Access Restricted — Finance Module</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Your current role ('{currentRole}') does not have permission to view or manage Credit Notes.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionHeader
              title="Credit Notes Workspace"
              subtitle="Enterprise Numbering (HHCN2026-0001), Invoice Mapping, Adjustment Records, and Lifecycle Approvals."
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreateDrawer(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
          >
            <Plus size={14} />
            <span>Create Credit Note</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Credit Notes
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{creditNotes.length}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active / Applied
            </span>
            <span className="text-xl font-bold text-blue-700 mt-1 block">
              {creditNotes.filter((c) => c.status === "Applied" || c.status === "Issued").length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Draft Credit Notes
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {creditNotes.filter((c) => c.status === "Draft").length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cancelled Notes
            </span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">
              {creditNotes.filter((c) => c.status === "Cancelled").length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Credit Note #, Invoice #, Reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {actionSuccess}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Credit Note #</th>
                  <th className="p-3.5">Mapped Invoice #</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5 text-right">Adjustment Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading Credit Notes…
                    </td>
                  </tr>
                ) : filteredCreditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No credit notes recorded.
                    </td>
                  </tr>
                ) : (
                  filteredCreditNotes.map((cn) => {
                    const amount = cn.snapshot?.grandTotal ?? 5000;
                    const displayCnNum = cn.snapshot?.creditNoteNumber || cn.creditNoteNumber || cn.id;
                    const displayInvNum = cn.snapshot?.originalInvoiceNumber || cn.originalInvoiceNumber || cn.originalInvoiceId;
                    return (
                      <tr key={cn.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{displayCnNum}</td>
                        <td className="p-3.5 font-semibold text-emerald-700 font-mono">
                          {displayInvNum}
                        </td>
                        <td className="p-3.5 font-semibold text-purple-700">{cn.creditType}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{cn.reason}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900">
                          ₹{amount.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={cn.status} />
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCreditNote(cn);
                              setShowPreviewDrawer(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 font-semibold transition"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Credit Note Drawer */}
        <Drawer
          isOpen={showCreateDrawer}
          onClose={() => setShowCreateDrawer(false)}
          title="New Credit Note"
          subtitle={`Credit Note Number ${previewCreditNoteNum}`}
        >
          <form onSubmit={handleCreateDraft} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Original Invoice Number</label>
              <input
                type="text"
                value={originalInvoiceId}
                onChange={(e) => setOriginalInvoiceId(e.target.value)}
                placeholder="e.g. HHINV000001"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Reason for Credit Note</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify exact commercial reason for credit adjustment..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
                {actionError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs text-xs"
            >
              {creating ? "Creating Draft…" : `Generate Draft Credit Note ${previewCreditNoteNum}`}
            </button>
          </form>
        </Drawer>

        {/* Detail Modal / Drawer */}
        {showPreviewDrawer && selectedCreditNote && (
          <Drawer
            isOpen={showPreviewDrawer}
            onClose={() => setShowPreviewDrawer(false)}
            title={`Credit Note ${selectedCreditNote.snapshot?.creditNoteNumber || selectedCreditNote.creditNoteNumber || selectedCreditNote.id}`}
            subtitle={`Mapped to Invoice ${selectedCreditNote.snapshot?.originalInvoiceNumber || selectedCreditNote.originalInvoiceNumber || selectedCreditNote.originalInvoiceId}`}
          >
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Status</span>
                  <StatusBadge status={selectedCreditNote.status} />
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Reason</span>
                  <span>{selectedCreditNote.reason}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Credit Type</span>
                  <span>{selectedCreditNote.creditType}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t pt-2">
                  <span>Grand Total Credit</span>
                  <span className="text-emerald-700">
                    ₹{(selectedCreditNote.snapshot?.grandTotal ?? 5000).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPreviewDrawer(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </Drawer>
        )}
      </div>
    </DashboardLayout>
  );
}

function getSampleCreditNotes(): CreditNote[] {
  return [
    {
      id: "HHCN2026-0001",
      originalInvoiceId: "HH2026-0001",
      creditType: "Full",
      creditDate: "2026-08-02",
      reason: "Volume Discount Adjustment for July Placements",
      selections: [],
      status: "Applied",
      statusHistory: [],
      createdBy: "Somnath (Admin)",
      createdAt: { seconds: 1785500000, nanoseconds: 0 } as any,
      updatedAt: { seconds: 1785500000, nanoseconds: 0 } as any,
      snapshot: {
        creditNoteNumber: "HHCN2026-0001",
        creditDate: "2026-08-02",
        reason: "Volume Discount Adjustment for July Placements",
        creditType: "Full",
        generatedBy: "Somnath (Admin)",
        originalInvoiceNumber: "HH2026-0001",
        originalInvoiceSnapshot: {
          invoiceNumber: "HH2026-0001",
          invoiceDate: "2026-08-01",
          company: { companyName: "Hire Huub", legalName: "Hire Huub People Solution Pvt Ltd", gstin: "27AAAAA0000A1Z5", pan: "AAAAA0000A", registeredAddress: { line1: "Warje", city: "Pune", state: "Maharashtra", postalCode: "411058", country: "India" }, bankDetails: { accountHolderName: "Hire Huub", bankName: "HDFC", accountNumber: "123456789", ifscCode: "HDFC0001234", branchName: "Warje" }, authorizedSignatory: "Director" },
          client: { clientId: "client-001", clientName: "Elastic Run", gstin: "27AAAAA0000A1Z5", billingState: "Maharashtra", billingAddress: { line1: "Warje Industrial Estate", city: "Pune", state: "Maharashtra", postalCode: "411058", country: "India" } },
          lineItems: [],
          taxableAmount: 5000,
          gst: { type: "CGST_SGST", cgstAmount: 450, sgstAmount: 450, igstAmount: 0, totalGstAmount: 900 },
          grandTotal: 5900,
          template: { templateId: "default", templateVersion: 1 },
        },
        lineItems: [{ invoiceLineIndex: 0, description: "Volume Commercial Adjustment", originalQuantity: 1, creditedQuantity: 1, taxableAmount: 5000, gstAmount: 900, totalAmount: 5900 }],
        taxableAmount: 5000,
        gst: { type: "CGST_SGST", cgstAmount: 450, sgstAmount: 450, igstAmount: 0, totalGstAmount: 900 },
        grandTotal: 5900,
        template: { templateId: "default", templateVersion: 1 },
      },
    },
  ];
}
