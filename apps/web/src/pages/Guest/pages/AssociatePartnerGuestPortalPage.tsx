import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Building2, Eye, Banknote, RefreshCw, Briefcase } from 'lucide-react';
import GuestPortalLayout from '../layouts/GuestPortalLayout';
import GuestVacancyDetailsDrawer from '../components/GuestVacancyDetailsDrawer';
import { associatePartnerGuestService } from '../services/associatePartnerGuestService';
import type { ExternalVacancy } from '../../../types/ExternalVacancy';
import { getIndianStates, getCitiesForState } from '../../../core/location/indiaLocationMaster';

import { useGuestAuth } from '../../../context/GuestAuthContext';

export default function AssociatePartnerGuestPortalPage() {
  const { guestSession } = useGuestAuth();
  const [vacancies, setVacancies] = useState<ExternalVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState<ExternalVacancy | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const availableStates = getIndianStates();
  const availableCities = selectedState ? getCitiesForState(selectedState) : [];

  const loadVacancies = useCallback(async () => {
    try {
      if (!guestSession?.partnerId) return;
      setLoading(true);
      const data = await associatePartnerGuestService.getVacancies(guestSession.partnerId);
      setVacancies(data);
    } catch {
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  }, [guestSession?.partnerId]);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  const filteredVacancies = vacancies.filter((v) => {
    if (!v) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (v.title || '').toLowerCase().includes(q) ||
      (v.openingId || '').toLowerCase().includes(q) ||
      (v.clientName || '').toLowerCase().includes(q) ||
      (v.city || '').toLowerCase().includes(q) ||
      (Array.isArray(v.skillsRequired) ? v.skillsRequired : []).some((s) => (s || '').toLowerCase().includes(q));

    const matchesState = !selectedState || v.state === selectedState;
    const matchesCity = !selectedCity || v.city === selectedCity;

    return matchesSearch && matchesState && matchesCity;
  });

  const handleStateSelect = (st: string) => {
    setSelectedState(st);
    setSelectedCity('');
  };

  const handleOpenDetails = (v: ExternalVacancy) => {
    setSelectedVacancy(v);
    setDrawerOpen(true);
  };

  return (
    <GuestPortalLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Outsourced Vacancies</h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                {filteredVacancies.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active outsourced openings published for Associate Partner fulfillment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadVacancies()}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
            <span>Refresh Vacancies</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Title, Opening ID, City, or Skill…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* State Filter */}
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateSelect(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="">All States ({availableStates.length})</option>
                {availableStates.map((st) => (
                  <option key={st.stateCode || st.stateName} value={st.stateName}>
                    {st.stateName}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold disabled:opacity-50"
              >
                <option value="">{selectedState ? 'All Cities in ' + selectedState : 'Select State First'}</option>
                {availableCities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Vacancies Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-medium text-xs">
            <RefreshCw size={24} className="animate-spin text-emerald-600 mb-2" />
            <span>Loading active outsourced vacancies…</span>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
            <Briefcase size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Active Outsourced Vacancies Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are currently no active outsourced openings matching your search criteria. Check back soon or reset your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVacancies.map((vacancy) => (
              <div
                key={vacancy.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-mono font-bold rounded-lg border border-slate-200">
                      {vacancy.openingId}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                      {vacancy.openPositions} Vacancies
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{vacancy.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                      <Building2 size={13} className="text-slate-400" />
                      <span className="font-medium truncate">{vacancy.clientName}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-600 shrink-0" />
                      <span>{vacancy.city}, {vacancy.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-slate-400 shrink-0" />
                      <span>Exp: {vacancy.experienceRange}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Banknote size={13} className="text-emerald-600 shrink-0" />
                      <span>{vacancy.salaryRange || 'Negotiable'} ({vacancy.salaryPeriod})</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Updated: {vacancy.lastUpdated}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(vacancy)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <Eye size={13} />
                    <span>View Vacancy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vacancy Details Drawer */}
        <GuestVacancyDetailsDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          vacancy={selectedVacancy}
        />
      </div>
    </GuestPortalLayout>
  );
}
