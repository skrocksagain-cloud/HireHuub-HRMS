import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import OrganizationPage from "../pages/Organization";
import EmployeePage from '../pages/Employee/EmployeePage';
import OfferPage from "../pages/InternalHiring/OfferPage";
import OfferForm from "../pages/InternalHiring/OfferForm";
import DocumentDashboard from '../pages/DocumentCenter/DocumentDashboard';
import AttendancePage from '../pages/Attendance';
import LeavePage from '../pages/Leave';

// Lazy Loaded Pages
const EmployeeProfilePage = lazy(() => import("../pages/Employee/pages/EmployeeProfilePage"));
const PerformancePage = lazy(() => import("../pages/People/PerformancePage"));
const StaffingHubPage = lazy(() => import("../pages/Workbench/StaffingHubPage"));
const WorkforcePage = lazy(() => import("../pages/Workbench/WorkforcePage"));
const WorkforceProfilePage = lazy(() => import("../pages/Workbench/workforce/pages/WorkforceProfilePage"));
const CampaignHubPage = lazy(() => import("../pages/Workbench/campaignHub/pages/CampaignHubPage"));
const CampaignProfilePage = lazy(() => import("../pages/Workbench/campaignHub/pages/CampaignProfilePage"));
const ManagementPage = lazy(() => import("../pages/Management/ManagementPage"));
const CalendarEventsPage = lazy(() => import("../pages/Administration/Calendar/CalendarEventsPage"));
const AnnouncementsPage = lazy(() => import("../pages/Administration/Announcements/AnnouncementsPage"));

// Finance – lazy loaded
const InvoicesPage = lazy(() => import("../pages/Finance/billing/InvoicesPage"));
const InvoiceProfilePage = lazy(() => import("../pages/Finance/billing/pages/InvoiceProfilePage"));
const CreditNotesPage = lazy(() => import("../pages/Finance/billing/CreditNotesPage"));
const TransactionsPage = lazy(() => import("../pages/Finance/transactions/TransactionsPage"));

// Workbench / Network – lazy loaded
const ClientsPage = lazy(() => import("../pages/Workbench/Network/clients/pages/ClientsPage"));
const ClientProfilePage = lazy(() => import("../pages/Workbench/Network/clients/pages/ClientProfilePage"));
const AssociatePartnersPage = lazy(() => import("../pages/Workbench/Network/associatePartners/pages/AssociatePartnersPage"));
const AssociatePartnerProfilePage = lazy(() => import("../pages/Workbench/Network/associatePartners/pages/AssociatePartnerProfilePage"));
const OpeningsPage = lazy(() => import("../pages/Workbench/openings/pages/OpeningsPage"));
const OpeningDetailsPage = lazy(() => import("../pages/Workbench/openings/pages/OpeningDetailsPage"));

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500 font-medium">Loading Hire Huub One…</div>}>
      {children}
    </Suspense>
  );
}

const PayrollPage = lazy(() => import("../pages/Payroll"));
const ReportsPage = lazy(() => import("../pages/Reports"));
const SettingsPage = lazy(() => import("../pages/Settings"));
const RecruitmentPage = lazy(() => import("../pages/Recruitment"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute moduleKey="dashboard"><Dashboard /></ProtectedRoute>} />

        {/* People */}
        <Route path="/people" element={<Navigate to="/employees" replace />} />
        <Route path="/people/employees" element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<ProtectedRoute moduleKey="employees"><EmployeePage /></ProtectedRoute>} />
        <Route path="/employees/create" element={<ProtectedRoute moduleKey="employees"><EmployeePage initialPanel="create" /></ProtectedRoute>} />
        <Route path="/people/employees/:employeeId" element={<ProtectedRoute moduleKey="employees"><PageSuspense><EmployeeProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/employees/:employeeId" element={<ProtectedRoute moduleKey="employees"><PageSuspense><EmployeeProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute moduleKey="employees"><AttendancePage /></ProtectedRoute>} />
        <Route path="/leave" element={<ProtectedRoute moduleKey="employees"><LeavePage /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute moduleKey="employees"><PageSuspense><PerformancePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute moduleKey="documents"><DocumentDashboard /></ProtectedRoute>} />

        {/* Internal Hiring & Legacy Organization */}
        <Route path="/organization" element={<ProtectedRoute moduleKey="management"><OrganizationPage /></ProtectedRoute>} />
        <Route path="/recruitment" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><RecruitmentPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/recruitment" element={<Navigate to="/recruitment" replace />} />
        <Route path="/internal-hiring" element={<ProtectedRoute moduleKey="recruitment"><OfferPage /></ProtectedRoute>} />
        <Route path="/internal-hiring/create" element={<ProtectedRoute moduleKey="recruitment"><OfferForm /></ProtectedRoute>} />
        <Route path="/internal-hiring/edit/:id" element={<ProtectedRoute moduleKey="recruitment"><OfferForm /></ProtectedRoute>} />
        <Route path="/internal-hiring/view/:id" element={<ProtectedRoute moduleKey="recruitment"><OfferForm /></ProtectedRoute>} />

        {/* Workbench */}
        <Route path="/workbench/network/clients" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><ClientsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/network/clients/:id" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><ClientProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/network/associate-partners" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><AssociatePartnersPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/network/associate-partners/:id" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><AssociatePartnerProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><StaffingHubPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub/openings" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><OpeningsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub/openings/:id" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><OpeningDetailsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub/crm" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><StaffingHubPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/workforce" element={<ProtectedRoute moduleKey="employees"><PageSuspense><WorkforcePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/workforce/:id" element={<ProtectedRoute moduleKey="employees"><PageSuspense><WorkforceProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/campaign-hub" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><CampaignHubPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/campaign-hub/:campaignId" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><CampaignProfilePage /></PageSuspense></ProtectedRoute>} />

        {/* Finance Workspaces */}
        <Route path="/finance" element={<Navigate to="/finance/transactions" replace />} />
        <Route path="/payroll" element={<ProtectedRoute moduleKey="finance"><PageSuspense><PayrollPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute moduleKey="management"><PageSuspense><ReportsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute moduleKey="management"><PageSuspense><SettingsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/billing/invoices" element={<ProtectedRoute moduleKey="finance"><PageSuspense><InvoicesPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/billing/invoices/:invoiceId" element={<ProtectedRoute moduleKey="finance"><PageSuspense><InvoiceProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/billing/credit-notes" element={<ProtectedRoute moduleKey="finance"><PageSuspense><CreditNotesPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/transactions" element={<ProtectedRoute moduleKey="finance"><PageSuspense><TransactionsPage /></PageSuspense></ProtectedRoute>} />

        {/* Management & Administration */}
        <Route path="/management" element={<ProtectedRoute moduleKey="management"><PageSuspense><ManagementPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/administration/calendar" element={<ProtectedRoute moduleKey="management"><PageSuspense><CalendarEventsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/administration/announcements" element={<ProtectedRoute moduleKey="management"><PageSuspense><AnnouncementsPage /></PageSuspense></ProtectedRoute>} />

        {/* Default Fallback */}
        <Route path="/" element={<ProtectedRoute moduleKey="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
