import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  MapPin,
  Award,
  UserCheck,
  UserCheck2,
} from 'lucide-react';

import DashboardLayout from '../../../../../layouts/DashboardLayout';
import SectionHeader from '../../../../../ui/SectionHeader';
import StatusBadge from '../../../../../ui/StatusBadge';
import Drawer from '../../../../../ui/Drawer';
import KpiCard from '../../../../../ui/KpiCard';
import { useAssociatePartners } from '../hooks/useAssociatePartners';
import { useAuth } from '../../../../../context/AuthContext';
import { employeeService } from '../../../../Employee/services/employeeService';
import { getIndianStates, getCitiesForState } from '../../../../../core/location/indiaLocationMaster';
import type { AssociatePartnerType, CreateAssociatePartnerInput } from '../../../../../types/AssociatePartner';
import { permissionService } from '../../../../../core/permissions/permissionService';

export default function AssociatePartnersPage() {
  const navigate = useNavigate();
  const { partners, loading, error, createPartner } = useAssociatePartners();
  const { user } = useAuth();

  // Role derived from authentication session
  const activeRole = permissionService.getEffectiveRole(user?.assignedRole || user?.role, user?.department);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Create Partner Drawer State
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Form fields
  const [employees, setEmployees] = useState<Array<{ id: string; employeeId: string; fullName: string; designation?: string; department?: string }>>([]);
  const [subVendorName, setSubVendorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Mumbai');
  const [type, setType] = useState<AssociatePartnerType>('SME');
  const [reportingToEmployeeId, setReportingToEmployeeId] = useState('');
  const [reportingToEmployeeName, setReportingToEmployeeName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaarOrTradeLicence, setAadhaarOrTradeLicence] = useState('');

  const availableStates = getIndianStates();
  const availableCities = getCitiesForState(state);

  useEffect(() => {
    let isMounted = true;
    async function loadEmployees() {
      try {
        const emps = await employeeService.getEmployees();
        if (isMounted) {
          const mapped = emps.map((e) => {
            const empId = e.employeeId || e.id || '';
            return {
              id: e.id || e.employeeId || empId,
              employeeId: empId,
              fullName: `${e.firstName} ${e.lastName}`,
              designation: e.designation,
              department: e.department,
            };
          });
          setEmployees(mapped);
          if (mapped.length > 0 && !reportingToEmployeeId) {
            const firstEmpId = mapped[0].employeeId;
            setReportingToEmployeeId(firstEmpId);
            setReportingToEmployeeName(`${mapped[0].fullName} (${mapped[0].designation || mapped[0].department || 'Staffing'})`);
          }
        }
      } catch {
        if (isMounted) setEmployees([]);
      }
    }
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, [reportingToEmployeeId]);

  // Access Control: Marketing, Staffing & Super Admin can create
  const canCreate = permissionService.canEdit(activeRole, 'Associate partner');

  const handleCreatePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      setFormError(`Your current role '${activeRole.name}' is not permitted to create Associate Partners.`);
      return;
    }
    setCreating(true);
    setFormError('');

    try {
      const input: CreateAssociatePartnerInput = {
        subVendorName: subVendorName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        type,
        reportingToEmployeeId,
        reportingToEmployeeName,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        pan: pan.trim(),
        aadhaarOrTradeLicence: aadhaarOrTradeLicence.trim(),
      };

      await createPartner(input);
      setShowCreateDrawer(false);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create Associate Partner record.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSubVendorName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setState('Maharashtra');
    setCity('Mumbai');
    setType('SME');
    setReportingToEmployeeId('emp-001');
    setReportingToEmployeeName('Somnath (Account Exec)');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setPan('');
    setAadhaarOrTradeLicence('');
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.subVendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.partnerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || partner.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || partner.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate Dashboard Metrics Summary
  const totalSubmitted = partners.reduce((sum, p) => sum + p.metrics.totalSubmitted, 0);
  const selected = partners.reduce((sum, p) => sum + p.metrics.selected, 0);
  const joined = partners.reduce((sum, p) => sum + p.metrics.joined, 0);
  const active = partners.reduce((sum, p) => sum + p.metrics.active, 0);
  const eligible = partners.reduce((sum, p) => sum + p.metrics.eligible, 0);

  return (
    <DashboardLayout>
      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="Associate Partner Workspace (Sub Vendors)"
            subtitle="Manage external Sub Vendors & Freelancers, monitor active candidate submissions, eligibility, and workforce progress."
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateDrawer(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
            >
              <Plus size={16} />
              <span>Add Associate Partner</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Associate Partner Dashboard KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          metric={{
            id: 'metric-submitted',
            title: 'Total Submitted',
            value: totalSubmitted.toString(),
            change: 'Candidates',
            trend: 'up',
            subtext: 'Referred by Sub Vendors',
            category: 'candidates',
          }}
          icon={<Users size={18} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <KpiCard
          metric={{
            id: 'metric-selected',
            title: 'Selected',
            value: selected.toString(),
            change: 'Interviewed',
            trend: 'neutral',
            subtext: 'Cleared interview rounds',
            category: 'candidates',
          }}
          icon={<UserCheck size={18} className="text-teal-600" />}
          badgeBg="bg-teal-50 text-teal-700 border-teal-200"
        />
        <KpiCard
          metric={{
            id: 'metric-joined',
            title: 'Joined',
            value: joined.toString(),
            change: 'Onboarded',
            trend: 'up',
            subtext: 'Joining date set',
            category: 'candidates',
          }}
          icon={<CheckCircle2 size={18} className="text-blue-600" />}
          badgeBg="bg-blue-50 text-blue-700 border-blue-200"
        />
        <KpiCard
          metric={{
            id: 'metric-active',
            title: 'Active',
            value: active.toString(),
            change: 'Workforce',
            trend: 'up',
            subtext: 'Active workforce count',
            category: 'candidates',
          }}
          icon={<UserCheck2 size={18} className="text-indigo-600" />}
          badgeBg="bg-indigo-50 text-indigo-700 border-indigo-200"
        />
        <KpiCard
          metric={{
            id: 'metric-eligible',
            title: 'Eligible',
            value: eligible.toString(),
            change: 'Tenure Passed',
            trend: 'up',
            subtext: 'Completed client tenure',
            category: 'candidates',
          }}
          icon={<Award size={18} className="text-amber-600" />}
          badgeBg="bg-amber-50 text-amber-700 border-amber-200"
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
            placeholder="Search sub vendor name, code, contact, or city..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="ALL">All Types</option>
              <option value="Freelancer">Freelancer</option>
              <option value="SME">SME</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Associate Partners Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading Associate Partners…</div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No associate partners found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Sub Vendor Name & Code</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Reporting To (Hire Huub Employee)</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">Submissions / Joined</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="text-emerald-700 font-bold text-sm">{partner.subVendorName}</div>
                      <div className="text-[11px] font-mono text-slate-500 font-medium">{partner.partnerCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
                        {partner.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{partner.contactPerson}</div>
                      <div className="text-[11px] text-slate-500">{partner.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <UserCheck size={12} className="text-emerald-600" />
                        <span>{partner.reportingTo.employeeName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Responsible Hire Huub Employee</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-600" />
                        <span>{partner.city}, {partner.state}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{partner.metrics.joined} Joined</div>
                      <div className="text-[10px] text-slate-500">{partner.metrics.totalSubmitted} total submitted</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={partner.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/workbench/network/associate-partners/${partner.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition text-xs font-semibold"
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

      {/* Drawer: Add New Associate Partner (Sub Vendor) */}
      <Drawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="Add New Associate Partner (Sub Vendor)"
      >
        <form onSubmit={handleCreatePartnerSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sub Vendor Name *</label>
              <input
                type="text"
                value={subVendorName}
                onChange={(e) => setSubVendorName(e.target.value)}
                placeholder="e.g. ABC Consultancy"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sub Vendor Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssociatePartnerType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="SME">SME</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
            <label className="block font-semibold text-emerald-900 text-xs">Reporting To (Assigned Hire Huub Employee) *</label>
            <select
              value={reportingToEmployeeId}
              onChange={(e) => {
                const val = e.target.value;
                setReportingToEmployeeId(val);
                const selectedText = e.target.options[e.target.selectedIndex]?.text || '';
                setReportingToEmployeeName(selectedText);
              }}
              className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-semibold text-slate-800"
            >
              {employees.length === 0 ? (
                <option value="" disabled>No records available.</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.id || emp.employeeId} value={emp.employeeId || emp.id}>
                    {emp.fullName} ({emp.designation || emp.department || 'Staffing'})
                  </option>
                ))
              )}
            </select>
            <span className="text-[10px] text-slate-500 block">Responsible employee for managing this Sub Vendor</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Vikramaditya Singh"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98220 11223"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@agency.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State *</label>
              <select
                value={state}
                onChange={(e) => {
                  const newSt = e.target.value;
                  setState(newSt);
                  const cities = getCitiesForState(newSt);
                  if (cities.length > 0) setCity(cities[0]);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                {availableStates.map((st) => (
                  <option key={st.stateCode} value={st.stateName}>
                    {st.stateName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              {availableCities.length > 0 ? (
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter City"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-900 text-[11px] block border-b border-slate-200 pb-1">
              Bank Details & Tax Information
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="HDFC Bank"
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="50100234567890"
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="HDFC0000123"
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Number *</label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  placeholder="ABCDE1234F"
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aadhaar / Trade Licence *</label>
                <input
                  type="text"
                  value={aadhaarOrTradeLicence}
                  onChange={(e) => setAadhaarOrTradeLicence(e.target.value)}
                  placeholder="Aadhaar or Licence"
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
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
              {creating ? 'Saving Partner…' : 'Save Associate Partner'}
            </button>
          </div>
        </form>
      </Drawer>
    </DashboardLayout>
  );
}

