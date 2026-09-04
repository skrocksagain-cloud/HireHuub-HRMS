import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Eye,
  CreditCard,
  Layers,
  MapPin,
  CheckCircle2,
  Award,
  Lock,
} from 'lucide-react';

import DashboardLayout from '../../../../../layouts/DashboardLayout';
import SectionHeader from '../../../../../ui/SectionHeader';
import StatusBadge from '../../../../../ui/StatusBadge';
import Drawer from '../../../../../ui/Drawer';
import KpiCard from '../../../../../ui/KpiCard';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../../../../../context/AuthContext';
import type { CreateClientInput, UserRole } from '../../../../../types/Client';
import { formatTenureCondition, type CommercialType, type PayoutType, type PercentageBasis } from '../../../../../types/ClientCommercial';
import type { SpocRole } from '../../../../../types/ClientSPOC';
import { getIndianStates, getCitiesForState, getStateCode } from '../../../../../core/location/indiaLocationMaster';

export default function ClientsPage() {
  const navigate = useNavigate();
  const { clients, loading, error, createClient } = useClients();
  const { user } = useAuth();

  // Role derived from current authentication session
  const currentRole: UserRole = (user?.role as UserRole) || 'Super Admin';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gstFilter, setGstFilter] = useState<string>('ALL');

  // Create Client Drawer State
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Form fields
  const [name, setName] = useState('');
  const [billingName, setBillingName] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [scopeChoice, setScopeChoice] = useState<'India' | 'IndividualStates'>('India');
  const [points, setPoints] = useState<number>(0);

  // Commercial fields (Payroll / OTS)
  const [commercialType, setCommercialType] = useState<CommercialType>('OTS');
  const [payoutType, setPayoutType] = useState<PayoutType>('Amount');
  const [percentageBasis, setPercentageBasis] = useState<PercentageBasis>('Annual CTC');
  const [percentageRate, setPercentageRate] = useState<number>(0);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [tenureCondition, setTenureCondition] = useState<number | ''>(90);
  const [poRequired, setPoRequired] = useState<boolean>(true);
  const [templateReference, setTemplateReference] = useState('All');
  const [templateVersion, setTemplateVersion] = useState<number>(1);

  // SPOC inputs
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  const [accountsName, setAccountsName] = useState('');
  const [accountsEmail, setAccountsEmail] = useState('');
  const [accountsPhone, setAccountsPhone] = useState('');

  // Access Control Permissions
  const canCreate = currentRole === 'Super Admin' || currentRole === 'Marketing';

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      setFormError(`Your current role '${currentRole}' is not permitted to create clients.`);
      return;
    }
    if (commercialType === 'OTS') {
      if (tenureCondition === '' || tenureCondition === undefined || tenureCondition === null) {
        setFormError('Tenure Condition is required for OTS clients.');
        return;
      }
      const numTenure = Number(tenureCondition);
      if (isNaN(numTenure) || !Number.isInteger(numTenure) || numTenure < 1) {
        setFormError('Tenure Condition must be a valid whole number of at least 1 day.');
        return;
      }
    }

    setCreating(true);
    setFormError('');

    try {
      const nowId = Math.random().toString(36).substring(2, 9);
      const spocs = [
        {
          id: `spoc-hr-${nowId}`,
          role: 'HR' as SpocRole,
          name: hrName.trim(),
          designation: 'HR Manager',
          email: hrEmail.trim(),
          phone: hrPhone.trim(),
          scope: 'All India' as const,
          isPrimary: true,
        },
        {
          id: `spoc-acc-${nowId}`,
          role: 'Accounts' as SpocRole,
          name: accountsName.trim(),
          designation: 'Accounts Executive',
          email: accountsEmail.trim(),
          phone: accountsPhone.trim(),
          scope: 'All India' as const,
          isPrimary: false,
        },
      ];

      const input: CreateClientInput = {
        name,
        billingName: billingName || name,
        billingAddress: {
          line1,
          city,
          state,
          postalCode,
          country: 'India',
        },
        gstin,
        state,
        type: commercialType === 'OTS' ? 'OTS Client' : 'Payroll Client',
        status: 'Active',
        points,
        highlights: ['New Client'],
        commercial: {
          type: commercialType,
          points: Number(points) || 0,
          payoutType,
          percentageBasis: payoutType === 'Percentage' ? percentageBasis || 'Annual CTC' : 'Annual CTC',
          percentageRate: payoutType === 'Percentage' ? Number(percentageRate) || 0 : 0,
          payoutAmount: payoutType === 'Amount' ? Number(payoutAmount) || 0 : 0,
          tenureCondition: commercialType === 'OTS' ? Number(tenureCondition) : undefined,
          poRequired: Boolean(poRequired),
        },
        gstConfig: {
          gstMode: scopeChoice,
          scopeChoice,
          oneGstForAllIndia: scopeChoice === 'India',
          isGstOptional: false,
          stateGstRecords: [
            {
              id: `gst-rec-1`,
              stateCode: getStateCode(state),
              stateName: state,
              gstin,
              billingName: billingName || name,
              billingAddress: { line1, city, state, postalCode, country: 'India' },
              templateReference,
              templateVersion,
              isGstOptional: false,
              isPrimary: true,
              isActive: true,
            },
          ],
        },
        spocs,
        invoiceConfig: {
          templateId: '',
          templateName: templateReference || 'All',
          templateVersion: 1,
          templateReference: templateReference || 'All',
          storagePath: '',
          referenceName: templateReference || 'All',
          documentId: '',
        },
      };

      await createClient(input);
      setShowCreateDrawer(false);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create client record.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBillingName('');
    setGstin('');
    setState('');
    setLine1('');
    setCity('');
    setPostalCode('');
    setScopeChoice('India');
    setPoints(0);
    setCommercialType('OTS');
    setPayoutType('Amount');
    setPercentageBasis('Annual CTC');
    setPercentageRate(0);
    setPayoutAmount(0);
    setTenureCondition(90);
    setPoRequired(true);
    setTemplateReference('');
    setTemplateVersion(1);
    setHrName('');
    setHrEmail('');
    setHrPhone('');
    setAccountsName('');
    setAccountsEmail('');
    setAccountsPhone('');
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.billingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;
    const matchesGst =
      gstFilter === 'ALL' ||
      (gstFilter === 'India' && (client.gstConfig.scopeChoice === 'India' || client.gstConfig.gstMode === 'India')) ||
      (gstFilter === 'IndividualStates' && (client.gstConfig.scopeChoice === 'IndividualStates' || client.gstConfig.gstMode === 'IndividualStates'));
    return matchesSearch && matchesStatus && matchesGst;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const multiGstClients = clients.filter((c) => c.gstConfig.scopeChoice === 'IndividualStates' || c.gstConfig.gstMode === 'IndividualStates').length;
  const totalOutstanding = clients.reduce((sum, c) => sum + (c.financeSummary?.outstandingAmount || 0), 0);

  return (
    <DashboardLayout>
      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="Client Master Workspace"
            subtitle="Single Source of Truth for Client Info, Role-Based Access Control, India vs Multi-State GST, Recruiter Points, and Finance Integration."
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canCreate ? (
            <button
              type="button"
              onClick={() => setShowCreateDrawer(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
            >
              <Plus size={16} />
              <span>Add New Client</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={`Role '${currentRole}' cannot create clients`}
              className="inline-flex items-center gap-2 bg-slate-200 text-slate-400 cursor-not-allowed font-semibold text-xs px-4 py-2.5 rounded-xl shrink-0"
            >
              <Lock size={14} />
              <span>Add New Client</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          metric={{
            id: 'total-clients',
            title: 'Total Clients',
            value: totalClients.toString(),
            change: '+100%',
            trend: 'up',
            subtext: 'Master Single Source Accounts',
            category: 'invoices',
          }}
          icon={<Building2 size={20} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <KpiCard
          metric={{
            id: 'active-clients',
            title: 'Active Accounts',
            value: activeClients.toString(),
            change: 'Active',
            trend: 'up',
            subtext: 'Super Admin managed status',
            category: 'invoices',
          }}
          icon={<CheckCircle2 size={20} className="text-teal-600" />}
          badgeBg="bg-teal-50 text-teal-700 border-teal-200"
        />
        <KpiCard
          metric={{
            id: 'multi-gst-clients',
            title: 'Multi-State GST',
            value: multiGstClients.toString(),
            change: 'Individual States',
            trend: 'neutral',
            subtext: 'Clients with multiple state GSTs',
            category: 'invoices',
          }}
          icon={<Layers size={20} className="text-amber-600" />}
          badgeBg="bg-amber-50 text-amber-700 border-amber-200"
        />
        <KpiCard
          metric={{
            id: 'total-outstanding',
            title: 'Total Outstanding',
            value: `₹${(totalOutstanding / 1000).toFixed(1)}k`,
            change: 'Finance',
            trend: 'up',
            subtext: 'Read-only finance summary',
            category: 'invoices',
          }}
          icon={<CreditCard size={20} className="text-blue-600" />}
          badgeBg="bg-blue-50 text-blue-700 border-blue-200"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, billing name, or GSTIN..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">GST Coverage:</label>
            <select
              value={gstFilter}
              onChange={(e) => setGstFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="ALL">All Coverages</option>
              <option value="India">India (One GST All India)</option>
              <option value="IndividualStates">Individual States (Multi GST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading Client Master Records…</div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No clients found matching the search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Client Short & Legal Name</th>
                  <th className="py-3.5 px-4">GST Coverage</th>
                  <th className="py-3.5 px-4">Primary GSTIN / State</th>
                  <th className="py-3.5 px-4">Recruiter Points</th>
                  <th className="py-3.5 px-4">Commercial Type & Payout</th>
                  <th className="py-3.5 px-4">Tenure Condition</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold text-sm">{client.name}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {client.clientId || client.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{client.billingName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {client.gstConfig.scopeChoice === 'IndividualStates' || client.gstConfig.gstMode === 'IndividualStates' || client.gstConfig.gstMode === 'MultiState' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Individual States ({client.gstConfig.stateGstRecords.length})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          India (One GST)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-mono font-bold text-slate-900">{client.gstin}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin size={10} />
                        <span>{client.state}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-xl border border-amber-200">
                        <Award size={14} className="text-amber-600" />
                        <span>{client.points} Points</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div className="font-bold text-slate-900">{client.commercial.type}</div>
                      <div className="text-[10px] text-slate-500">
                        {client.commercial.payoutType === 'Percentage'
                          ? `${client.commercial.percentageRate}% of ${client.commercial.percentageBasis}`
                          : `₹${(client.commercial.payoutAmount || 0).toLocaleString('en-IN')}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {client.commercial.type === 'OTS' ? (
                        <span className="font-semibold text-slate-800">{formatTenureCondition(client.commercial.tenureCondition)}</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">— (Payroll)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/workbench/network/clients/${client.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition text-xs font-semibold"
                        title="View Full Client Master Profile"
                      >
                        <Eye size={14} />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer: Add New Client Master Record */}
      <Drawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="Add New Client Master Record"
      >
        <form onSubmit={handleCreateClientSubmit} className="space-y-6 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider text-emerald-700">
              Basic Client Information (Marketing)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Name (Short / Common Name) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elastic Run"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Name (Legal Name) *
                </label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="e.g. Ntex Logistics Pvt Ltd"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* GST Configuration (Marketing Selection: India vs Individual States) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider text-emerald-700">
              GST Coverage Selection (Marketing)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScopeChoice('India')}
                className={`p-3 rounded-xl border text-left transition ${
                  scopeChoice === 'India'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-bold text-xs">India</div>
                <div className="text-[10px] text-slate-500 mt-0.5">One GST for All India (No State selector)</div>
              </button>
              <button
                type="button"
                onClick={() => setScopeChoice('IndividualStates')}
                className={`p-3 rounded-xl border text-left transition ${
                  scopeChoice === 'IndividualStates'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-bold text-xs">Individual States</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Multiple state GST registrations (+ Add State enabled)</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary GSTIN Number *</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="27AABCN1234F1Z9"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State / Union Territory *</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setCity('');
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">Select State / UT</option>
                  {getIndianStates().map((s) => (
                    <option key={s.stateCode} value={s.stateName}>
                      {s.stateName} ({s.stateCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  readOnly
                  value="India"
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!state}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  <option value="">{state ? 'Select City' : 'Select State First'}</option>
                  {state &&
                    getCitiesForState(state).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  {city && state && !getCitiesForState(state).includes(city) && (
                    <option value={city}>{city} (Historical)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 700091"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Street Address</label>
              <input
                type="text"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Street address line 1"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Commercial Information (Strictly Payroll or OTS) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider text-emerald-700">
              Commercial Information & Recruiter Points
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commercial Type *</label>
                <select
                  value={commercialType}
                  onChange={(e) => setCommercialType(e.target.value as CommercialType)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Payroll">Payroll</option>
                  <option value="OTS">OTS (One Time Settlement)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-amber-800 mb-1 flex items-center gap-1">
                  <Award size={14} className="text-amber-600" /> Recruiter Points *
                </label>
                <input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  placeholder="e.g. 2"
                  className="w-full p-2 bg-amber-50/50 border border-amber-300 rounded-xl font-bold text-amber-900 focus:border-amber-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Points awarded per active candidate activation</span>
              </div>
            </div>

            {/* Payout Options: Percentage or Amount */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-800 text-[11px] block">Payout Configuration</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="payoutType"
                    checked={payoutType === 'Percentage'}
                    onChange={() => setPayoutType('Percentage')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Percentage</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="payoutType"
                    checked={payoutType === 'Amount'}
                    onChange={() => setPayoutType('Amount')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Amount</span>
                </label>
              </div>

              {payoutType === 'Percentage' ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Percentage Based On</label>
                    <select
                      value={percentageBasis}
                      onChange={(e) => setPercentageBasis(e.target.value as PercentageBasis)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="Monthly CTC">Monthly CTC</option>
                      <option value="Annual CTC">Annual CTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Percentage %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={percentageRate}
                      onChange={(e) => setPercentageRate(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount ₹</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Tenure Condition: Visible ONLY when Type = OTS */}
            {commercialType === 'OTS' && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <label className="block font-semibold text-amber-900 text-xs">Tenure Condition (OTS Only) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tenureCondition}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setTenureCondition('');
                      } else {
                        const parsed = Number(val);
                        setTenureCondition(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    placeholder="90"
                    required={commercialType === 'OTS'}
                    className="w-28 p-2 bg-white border border-amber-300 rounded-xl font-semibold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  <span className="font-bold text-amber-900 text-sm">Days</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Required service retention period before OTS payout</span>
              </div>
            )}

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={poRequired}
                  onChange={(e) => setPoRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Purchase Order (PO) Required</span>
              </label>
            </div>
          </div>

          {/* Hire Huub Billing Configuration */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider text-emerald-700">
              Hire Huub Billing Configuration
            </h4>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Template *</label>
              <select
                value={templateReference || 'All'}
                onChange={(e) => {
                  setTemplateReference(e.target.value);
                  setTemplateVersion(1);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                required
              >
                <option value="Blinkit">Blinkit</option>
                <option value="Elastic Run">Elastic Run</option>
                <option value="All">All</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateDrawer(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              {creating ? 'Saving Client…' : 'Create Client Record'}
            </button>
          </div>
        </form>
      </Drawer>
    </DashboardLayout>
  );
}
