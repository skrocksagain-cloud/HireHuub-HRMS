import { useState, useEffect } from 'react';
import { TrendingUp, Plus, CheckCircle2, AlertCircle, Edit2, Power, ShieldCheck, X } from 'lucide-react';
import { adminService } from '../../../services/admin/adminService';
import { incentiveRepository, type IncentiveRuleConfig, type IncentiveSlab } from '../repositories/incentiveRepository';
import type { BrandProfile } from '../../../types/Admin';

export default function IncentiveTab() {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [ruleConfig, setRuleConfig] = useState<IncentiveRuleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State for Add/Edit Slab
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [editingSlabId, setEditingSlabId] = useState<string | null>(null);
  const [minAchInput, setMinAchInput] = useState<number>(100);
  const [maxAchInput, setMaxAchInput] = useState<number | null>(150);
  const [isOpenEnded, setIsOpenEnded] = useState<boolean>(false);
  const [fixedAmtInput, setFixedAmtInput] = useState<number>(0);
  const [perCandAmtInput, setPerCandAmtInput] = useState<number>(250);

  // Load Active Brands
  useEffect(() => {
    adminService
      .getCompanySettings()
      .then((settings) => {
        const activeBrands = (settings?.brandProfilesList || []).filter((b) => b.isActive !== false);
        setBrands(activeBrands);
        if (activeBrands.length > 0) {
          setSelectedBrandId(activeBrands[0].id);
        }
      })
      .catch(() => setBrands([]));
  }, []);

  // Load Incentive Rule Config for Selected Brand
  const loadRuleConfig = async () => {
    if (!selectedBrandId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const config = await incentiveRepository.getActiveRuleForBrand(selectedBrandId);
      setRuleConfig(config);
    } catch (caught) {
      setErrorMsg(caught instanceof Error ? caught.message : 'Unable to load incentive configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBrandId) {
      void loadRuleConfig();
    }
  }, [selectedBrandId]);

  const handleOpenAddSlab = () => {
    setEditingSlabId(null);
    setMinAchInput(100);
    setMaxAchInput(150);
    setIsOpenEnded(false);
    setFixedAmtInput(0);
    setPerCandAmtInput(250);
    setShowSlabModal(true);
  };

  const handleOpenEditSlab = (slab: IncentiveSlab) => {
    setEditingSlabId(slab.slabId);
    setMinAchInput(slab.minAchievementPercent);
    setMaxAchInput(slab.maxAchievementPercent);
    setIsOpenEnded(slab.maxAchievementPercent === null);
    setFixedAmtInput(slab.fixedAmount);
    setPerCandAmtInput(slab.perCandidateAmount);
    setShowSlabModal(true);
  };

  const handleToggleSlabStatus = async (slabId: string) => {
    if (!ruleConfig) return;
    try {
      setSaving(true);
      const updatedSlabs = ruleConfig.slabs.map((s) => (s.slabId === slabId ? { ...s, active: !s.active } : s));
      const newVersion = ruleConfig.ruleVersion + 1;

      const newConfig: IncentiveRuleConfig = {
        ...ruleConfig,
        ruleVersion: newVersion,
        slabs: updatedSlabs,
      };

      await incentiveRepository.saveRuleConfig(newConfig);
      setRuleConfig(newConfig);
      setStatusMsg(`Slab status updated! Created Rule Version ${newVersion}.`);
    } catch (caught) {
      setErrorMsg(caught instanceof Error ? caught.message : 'Failed to update slab status.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleConfig) return;

    const minAch = Number(minAchInput);
    const maxAch = isOpenEnded ? null : Number(maxAchInput);

    // Validation: Min must be <= Max if Max is specified
    if (maxAch !== null && minAch > maxAch) {
      setErrorMsg('Minimum Achievement % cannot be greater than Maximum Achievement %.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      let updatedSlabs = [...ruleConfig.slabs];

      if (editingSlabId) {
        updatedSlabs = updatedSlabs.map((s) =>
          s.slabId === editingSlabId
            ? {
                ...s,
                minAchievementPercent: minAch,
                maxAchievementPercent: maxAch,
                fixedAmount: Number(fixedAmtInput),
                perCandidateAmount: Number(perCandAmtInput),
              }
            : s
        );
      } else {
        const newSlabId = `slab-${Date.now()}`;
        updatedSlabs.push({
          slabId: newSlabId,
          minAchievementPercent: minAch,
          maxAchievementPercent: maxAch,
          fixedAmount: Number(fixedAmtInput),
          perCandidateAmount: Number(perCandAmtInput),
          active: true,
          sortOrder: updatedSlabs.length + 1,
        });
      }

      // Sort slabs by minAchievementPercent
      updatedSlabs.sort((a, b) => a.minAchievementPercent - b.minAchievementPercent);
      updatedSlabs.forEach((s, idx) => {
        s.sortOrder = idx + 1;
      });

      const newVersion = ruleConfig.ruleVersion + 1;
      const newConfig: IncentiveRuleConfig = {
        ...ruleConfig,
        ruleVersion: newVersion,
        slabs: updatedSlabs,
      };

      await incentiveRepository.saveRuleConfig(newConfig);
      setRuleConfig(newConfig);
      setShowSlabModal(false);
      setStatusMsg(`Incentive Slab saved successfully! Rule Version updated to v${newVersion}.`);
    } catch (caught) {
      setErrorMsg(caught instanceof Error ? caught.message : 'Failed to save slab.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" /> Incentive Rules Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure cumulative performance incentive slabs and payout cycle rules.
          </p>
        </div>

        {brands.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Brand Scope:</span>
            <select
              aria-label="Select Brand Scope"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brandName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {statusMsg && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} /> {statusMsg}
        </p>
      )}

      {errorMsg && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} /> {errorMsg}
        </p>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading incentive rules…</div>
      ) : (
        <>
          {/* Policy Metadata & Fixed Eligibility Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Policy Metadata */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Incentive Policy Metadata</h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Version v{ruleConfig?.ruleVersion || 1}
                </span>
              </div>
              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Effective From</span>
                  <span className="font-bold text-slate-800">{ruleConfig?.effectiveFrom || '2026-08'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-slate-500">Payout Cycle</span>
                  <span className="font-bold text-slate-800">{ruleConfig?.payoutCycle}</span>
                </div>
              </div>
            </div>

            {/* READ-ONLY Eligibility Rules */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" /> Fixed Eligibility Logic (Read-Only)
              </h3>
              <ul className="text-xs space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule 1 — OTS Candidate:</strong> Candidate must complete the client-specific tenure requirement.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule 2 — Payroll Candidate:</strong> Candidate must remain active for the applicable payroll month.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule 3 — Both Conditions Required:</strong> A candidate qualifies for slab incentive ONLY when BOTH conditions are satisfied.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Configurable Cumulative Incentive Slabs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Configurable Cumulative Slabs</h3>
                <p className="text-xs text-slate-500">
                  Slabs accumulate sequentially across all passed achievement thresholds.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddSlab}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Add Slab
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Min Achievement</th>
                    <th className="py-3 px-3">Max Achievement</th>
                    <th className="py-3 px-3">Fixed Amount</th>
                    <th className="py-3 px-3">Per Candidate Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(ruleConfig?.slabs || []).map((slab) => {
                    const maxLabel = slab.maxAchievementPercent !== null ? `${slab.maxAchievementPercent}%` : '∞';

                    return (
                      <tr key={slab.slabId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">{slab.minAchievementPercent}%</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{maxLabel}</td>
                        <td className="py-3 px-3 font-bold text-emerald-600">
                          {slab.fixedAmount > 0 ? `₹${slab.fixedAmount.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-700">
                          {slab.perCandidateAmount > 0 ? `₹${slab.perCandidateAmount.toLocaleString('en-IN')} / cand` : '₹0'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              slab.active !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {slab.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlab(slab)}
                            className="p-1 text-slate-500 hover:text-emerald-600 transition"
                            title="Edit Slab"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleSlabStatus(slab.slabId)}
                            className="p-1 text-slate-500 hover:text-rose-600 transition"
                            title={slab.active !== false ? 'Deactivate Slab' : 'Activate Slab'}
                          >
                            <Power size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Slab Modal Drawer */}
      {showSlabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSlabId ? 'Edit Incentive Slab' : 'Add Cumulative Incentive Slab'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSlabModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlab} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Achievement % *</label>
                <input
                  type="number"
                  aria-label="Minimum Achievement %"
                  step="0.01"
                  min="0"
                  value={minAchInput}
                  onChange={(e) => setMinAchInput(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Maximum Achievement %</label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOpenEnded}
                      onChange={(e) => setIsOpenEnded(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Open-Ended (∞)
                  </label>
                </div>
                {!isOpenEnded && (
                  <input
                    type="number"
                    aria-label="Maximum Achievement %"
                    step="0.01"
                    min="0"
                    value={maxAchInput ?? 150}
                    onChange={(e) => setMaxAchInput(Number(e.target.value))}
                    required={!isOpenEnded}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Amount (₹)</label>
                <input
                  type="number"
                  aria-label="Fixed Amount"
                  min="0"
                  value={fixedAmtInput}
                  onChange={(e) => setFixedAmtInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Per Candidate Amount (₹)</label>
                <input
                  type="number"
                  aria-label="Per Candidate Amount"
                  min="0"
                  value={perCandAmtInput}
                  onChange={(e) => setPerCandAmtInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSlabModal(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving…' : 'Save Slab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
