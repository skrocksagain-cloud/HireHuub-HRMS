import React, { useState } from 'react';
import Drawer from '../../../../ui/Drawer';
import type {
  CampaignType,
  CampaignSource,
  OfflineMaterialType,
  CreateCampaignInput,
} from '../types/campaign';
import {
  CAMPAIGN_TYPES,
  CAMPAIGN_SOURCES,
  OFFLINE_MATERIAL_TYPES,
  SAMPLE_LOCATION_MASTER,
} from '../constants/campaignConstants';

interface CreateCampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCampaignInput) => Promise<void>;
  creatorName: string;
}

export default function CreateCampaignDrawer({
  isOpen,
  onClose,
  onSubmit,
  creatorName,
}: CreateCampaignDrawerProps) {
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('Offline');
  const [campaignSource, setCampaignSource] = useState<CampaignSource>('Poster');
  const [owner, setOwner] = useState(creatorName);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [plannedBudget, setPlannedBudget] = useState<number>(50000);
  const [expectedLeads, setExpectedLeads] = useState<number>(500);
  const [expectedJoins, setExpectedJoins] = useState<number>(75);

  // Online specifics
  const [platform, setPlatform] = useState('Meta Ads Manager');
  const [campaignUrl, setCampaignUrl] = useState('');

  // Offline specifics
  const [materialType, setMaterialType] = useState<OfflineMaterialType>('Poster');
  const [vendor, setVendor] = useState('');
  const [quantity, setQuantity] = useState<number>(2000);

  // Location Master selections
  const [selectedState, setSelectedState] = useState('West Bengal');
  const [selectedCity, setSelectedCity] = useState('Kolkata');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Kasba', 'Behala']);
  const [newAreaInput, setNewAreaInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    const cities = Object.keys(SAMPLE_LOCATION_MASTER[st] || {});
    if (cities.length > 0) {
      setSelectedCity(cities[0]);
      setSelectedAreas(SAMPLE_LOCATION_MASTER[st][cities[0]] || []);
    } else {
      setSelectedCity('Central');
      setSelectedAreas(['Default Cluster']);
    }
  };

  const handleCityChange = (c: string) => {
    setSelectedCity(c);
    const areas = SAMPLE_LOCATION_MASTER[selectedState]?.[c] || [];
    setSelectedAreas(areas);
  };

  const toggleArea = (areaName: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaName) ? prev.filter((a) => a !== areaName) : [...prev, areaName]
    );
  };

  const addCustomArea = () => {
    if (!newAreaInput.trim()) return;
    if (!selectedAreas.includes(newAreaInput.trim())) {
      setSelectedAreas((prev) => [...prev, newAreaInput.trim()]);
    }
    setNewAreaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setErrorMsg('Campaign name is required.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const input: CreateCampaignInput = {
        campaignName: campaignName.trim(),
        campaignType,
        campaignSource,
        owner: owner || creatorName,
        description,
        startDate,
        endDate,
        plannedBudget: Number(plannedBudget) || 0,
        expectedLeads: Number(expectedLeads) || 0,
        expectedJoins: Number(expectedJoins) || 0,
        primaryState: selectedState,
        primaryCity: selectedCity,
        areas: selectedAreas.length > 0 ? selectedAreas : ['Central Cluster'],
        platform: campaignType === 'Online' ? platform : undefined,
        campaignUrl: campaignType === 'Online' ? campaignUrl : undefined,
        materialType: campaignType === 'Offline' ? materialType : undefined,
        vendor: campaignType === 'Offline' ? vendor : undefined,
        quantity: campaignType === 'Offline' ? Number(quantity) : undefined,
      };

      await onSubmit(input);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Create New Marketing Campaign">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700 p-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 font-medium text-xs border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Basic Campaign Master Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kolkata Q3 Retail Staffing Drive"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Campaign Type</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value as CampaignType)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Campaign Source</label>
              <select
                value={campaignSource}
                onChange={(e) => setCampaignSource(e.target.value as CampaignSource)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {CAMPAIGN_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Campaign Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Budget & Target Projections */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <h4 className="font-bold text-slate-900 text-xs">Planned Budget & Acquisition Targets</h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Planned Budget (₹)</label>
              <input
                type="number"
                min={0}
                value={plannedBudget}
                onChange={(e) => setPlannedBudget(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Expected Leads</label>
              <input
                type="number"
                min={1}
                value={expectedLeads}
                onChange={(e) => setExpectedLeads(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Expected Joins</label>
              <input
                type="number"
                min={1}
                value={expectedJoins}
                onChange={(e) => setExpectedJoins(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Online vs Offline Conditional Fields */}
        {campaignType === 'Online' ? (
          <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-3">
            <h4 className="font-bold text-indigo-900 text-xs">Online Digital Campaign Parameters</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-indigo-700 mb-1">Platform / Channel</label>
                <input
                  type="text"
                  placeholder="e.g. Meta Ads, Google Ads"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-indigo-700 mb-1">Target Landing URL</label>
                <input
                  type="url"
                  placeholder="https://hirehuub.com/landing"
                  value={campaignUrl}
                  onChange={(e) => setCampaignUrl(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
            <h4 className="font-bold text-emerald-900 text-xs">Offline Ground Campaign Parameters</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Material Type</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as OfflineMaterialType)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {OFFLINE_MATERIAL_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Vendor / Agency</label>
                <input
                  type="text"
                  placeholder="Printing Agency"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Location Master Integration */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <h4 className="font-bold text-slate-900 text-xs">Target Location Master Integration</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {Object.keys(SAMPLE_LOCATION_MASTER).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {Object.keys(SAMPLE_LOCATION_MASTER[selectedState] || {}).map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Areas / Industrial Clusters
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(SAMPLE_LOCATION_MASTER[selectedState]?.[selectedCity] || []).map((area) => {
                const isSelected = selectedAreas.includes(area);
                return (
                  <button
                    type="button"
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {area} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom area name..."
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={addCustomArea}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Dates & Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Add campaign background and strategy notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition text-xs disabled:opacity-50"
          >
            {submitting ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
