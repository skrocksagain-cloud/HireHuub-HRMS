import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  LayoutGrid,
  List,
  FileText,
  TrendingUp,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import SectionHeader from "../../ui/SectionHeader";
import KpiCard from "../../ui/KpiCard";
import StatusBadge from "../../ui/StatusBadge";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { DataTable } from "../../ui/DataTable";
import type { DataTableColumn } from "../../ui/DataTable/types";

import EmployeeCard from "./components/EmployeeCard";
import EmployeeFilterPanel from "./components/EmployeeFilterPanel";
import GenerateOfferDrawer from "./components/GenerateOfferDrawer";
import NewEmployeeDrawer from "./components/NewEmployeeDrawer";
import AppraisalModal from "./components/AppraisalModal";
import { useEmployees } from "./hooks/useEmployees";
import { calculateProbationState } from "../Leave/services/leaveAccrualService";
import type { Employee } from "./types/Employee";

interface EmployeePageProps {
  initialPanel?: "create";
}

import { useNavigate, useSearchParams } from "react-router-dom";
import Drawer from "../../ui/Drawer";
import EmployeeForm from "./components/EmployeeForm";

export default function EmployeePage({ initialPanel }: EmployeePageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editEmpId = searchParams.get("edit");
  const hasInitializedCreatePanel = useRef(false);
  const {
    employees,
    filteredEmployees,
    filter,
    departments,
    designations,
    summary,
    isLoading,
    isSaving,
    isDeleting,
    error,
    successMessage,
    selectedEmployee,
    employeePendingDeletion,
    activePanel,
    setFilter,
    openEdit,
    closePanel,
    saveEmployee,
    requestDelete,
    cancelDelete,
    removeEmployee,
  } = useEmployees();

  useEffect(() => {
    if (editEmpId && employees.length > 0) {
      const found = employees.find(
        (e) => e.id === editEmpId || e.employeeId === editEmpId || e.employeeCode === editEmpId
      );
      if (found) {
        openEdit(found);
        setSearchParams({}, { replace: true });
      }
    }
  }, [editEmpId, employees, openEdit, setSearchParams]);

  // View Layout Mode (Grid vs Table)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Drawers
  const [showOfferDrawer, setShowOfferDrawer] = useState<boolean>(false);
  const [showNewEmployeeDrawer, setShowNewEmployeeDrawer] = useState<boolean>(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialPanel === "create" && !hasInitializedCreatePanel.current) {
      hasInitializedCreatePanel.current = true;
      setShowNewEmployeeDrawer(true);
    }
  }, [initialPanel]);

  const handleViewProfile = (emp: Employee) => {
    navigate(`/people/employees/${emp.employeeId || emp.employeeCode || emp.id}`);
  };

  // Table Columns Definition
  const columns: DataTableColumn<Employee>[] = [
    {
      key: "fullName",
      title: "Employee Name",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
            {row.firstName.slice(0, 1)}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{row.fullName}</span>
            <span className="text-[10px] text-slate-500 font-mono">{row.employeeCode || row.employeeId}</span>
          </div>
        </div>
      ),
    },
    { key: "department", title: "Department", sortable: true },
    { key: "designation", title: "Designation", sortable: true },
    { key: "reportingManager", title: "Manager", sortable: true },
    { key: "joiningDate", title: "Joining Date", sortable: true },
    {
      key: "employmentStatus",
      title: "Status",
      sortable: true,
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "id",
      title: "Actions",
      sortable: false,
      render: (_, row) => (
        <button
          type="button"
          onClick={() => handleViewProfile(row)}
          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg text-xs"
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* Header with Dual Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="People & Employee Hub"
            subtitle="Manage employee records, candidate hiring workflows, and active team profiles."
          />
        </div>

        {/* Actions: Generate Offer | Appraisal | New Employee */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowOfferDrawer(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <FileText size={16} />
            <span>Generate Offer</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAppraisalModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <TrendingUp size={16} />
            <span>Appraisal</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewEmployeeDrawer(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <UserPlus size={16} />
            <span>New Employee</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          metric={{
            id: "total-emp",
            title: "Total Employees",
            value: summary.total.toString(),
            change: "Live records",
            trend: "up",
            subtext: "Total registered workforce",
            category: "people",
          }}
          icon={<Users size={20} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />

        <KpiCard
          metric={{
            id: "active-emp",
            title: "Active Workforce",
            value: summary.active.toString(),
            change: "On Duty",
            trend: "up",
            subtext: "Active employee count",
            category: "people",
          }}
          icon={<UserCheck size={20} className="text-teal-600" />}
          badgeBg="bg-teal-50 text-teal-700 border-teal-200"
        />

        <KpiCard
          metric={{
            id: "probation-emp",
            title: "On Probation",
            value: filteredEmployees
              .filter((e) => calculateProbationState(e.joiningDate).isProbation)
              .length.toString(),
            change: "Under review",
            trend: "neutral",
            subtext: "Probationary employees (First 90 Days)",
            category: "people",
          }}
          icon={<Clock size={20} className="text-amber-600" />}
          badgeBg="bg-amber-50 text-amber-700 border-amber-200"
        />

        <KpiCard
          metric={{
            id: "other-emp",
            title: "Notice / Inactive",
            value: summary.inactive.toString(),
            change: "Status track",
            trend: "neutral",
            subtext: "Inactive / Notice period",
            category: "people",
          }}
          icon={<UserPlus size={20} className="text-blue-600" />}
          badgeBg="bg-blue-50 text-blue-700 border-blue-200"
        />
      </div>

      {/* Filter Panel */}
      <EmployeeFilterPanel
        filter={filter}
        departments={departments}
        designations={designations}
        onChange={setFilter}
      />

      {/* Toolbar with Grid/Table View Toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-600">
          Showing {filteredEmployees.length} Employee{filteredEmployees.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "grid" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid size={15} />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "table" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List size={15} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200/80">
          Loading employee directory…
        </div>
      ) : filteredEmployees.length === 0 ? (
        /* Premium Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <Users size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Employees Found</h3>
            <p className="text-xs text-slate-500">
              No employee records match your active search filters. Start by issuing a candidate offer letter or onboarding a joined employee.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowOfferDrawer(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <FileText size={15} />
              <span>Generate Offer</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewEmployeeDrawer(true)}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <UserPlus size={15} />
              <span>New Employee</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Employee Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id || emp.employeeId}
              employee={emp}
              onView={handleViewProfile}
              onEdit={openEdit}
              onDeactivate={requestDelete}
            />
          ))}
        </div>
      ) : (
        /* Employee Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <DataTable
            data={filteredEmployees}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Search employees..."
          />
        </div>
      )}

      {/* Generate Offer Drawer */}
      <GenerateOfferDrawer
        isOpen={showOfferDrawer}
        onClose={() => setShowOfferDrawer(false)}
        departments={departments}
        designations={designations}
      />

      {/* New Employee Onboarding Drawer */}
      <NewEmployeeDrawer
        isOpen={showNewEmployeeDrawer}
        onClose={() => setShowNewEmployeeDrawer(false)}
        departments={departments}
        designations={designations}
        isSaving={isSaving}
        onSave={saveEmployee}
      />

      {/* Edit Employee Profile Drawer */}
      {activePanel === "edit" && selectedEmployee && (
        <Drawer
          isOpen={activePanel === "edit"}
          onClose={closePanel}
          title={`Edit Employee: ${selectedEmployee.fullName || selectedEmployee.employeeCode}`}
        >
          <div className="p-1">
            <EmployeeForm
              employee={selectedEmployee}
              isSaving={isSaving}
              error={error}
              onSave={saveEmployee}
              onCancel={closePanel}
            />
          </div>
        </Drawer>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        open={employeePendingDeletion !== null}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${employeePendingDeletion?.fullName || "this employee"}?`}
        confirmText="Deactivate Employee"
        loading={isDeleting}
        onConfirm={() => {
          void removeEmployee();
        }}
        onCancel={cancelDelete}
      />

      {/* Appraisal Workflow Modal */}
      <AppraisalModal
        isOpen={showAppraisalModal}
        onClose={() => setShowAppraisalModal(false)}
      />
    </DashboardLayout>
  );
}
