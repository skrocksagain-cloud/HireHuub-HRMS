import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import GuestGuard from "../components/GuestGuard";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import OrganizationPage from "../pages/Organization";
import EmployeePage from '../pages/Employee/EmployeePage';
import OfferPage from "../pages/InternalHiring/OfferPage";
import OfferForm from "../pages/InternalHiring/OfferForm";
import AttendancePage from '../pages/Attendance';
import LeavePage from '../pages/Leave';

// Lazy Loaded Pages
const EmployeeProfilePage = lazy(() => import("../pages/Employee/pages/EmployeeProfilePage"));
const ProfilePage = lazy(() => import("../pages/Employee/pages/ProfilePage"));
const PerformancePage = lazy(() => import("../pages/People/PerformancePage"));
const StaffingHubPage = lazy(() => import("../pages/Workbench/StaffingHubPage"));
// Legacy imports kept for rollback:
// const WorkforcePage = lazy(() => import("../pages/Workbench/WorkforcePage"));
// const WorkforceProfilePage = lazy(() => import("../pages/Workbench/workforce/pages/WorkforceProfilePage"));
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
const PayoutPage = lazy(() => import("../pages/Finance/payout/pages/PayoutPage"));
const ReportsPage = lazy(() => import("../pages/Reports"));
const SettingsPage = lazy(() => import("../pages/Settings"));
const RecruitmentPage = lazy(() => import("../pages/Recruitment"));

// Guest Portal
const GuestLoginPage = lazy(() => import("../pages/Guest/pages/GuestLoginPage"));
const AssociatePartnerGuestPortalPage = lazy(() => import("../pages/Guest/pages/AssociatePartnerGuestPortalPage"));

const WorkforcePage = lazy(() => import("../pages/Workbench/WorkforcePage"));


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<Login forceTab="change_password" />} />

        {/* Guest Routes */}
        <Route path="/guest/login/:token" element={<PageSuspense><GuestLoginPage /></PageSuspense>} />
        <Route path="/guest/associate-partner/:token" element={<GuestGuard><PageSuspense><AssociatePartnerGuestPortalPage /></PageSuspense></GuestGuard>} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* People */}
        <Route path="/people" element={<Navigate to="/employees" replace />} />
        <Route path="/people/employees" element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<ProtectedRoute moduleKey="employees"><EmployeePage /></ProtectedRoute>} />
        <Route path="/employees/create" element={<ProtectedRoute moduleKey="employees"><EmployeePage initialPanel="create" /></ProtectedRoute>} />
        <Route path="/people/employees/:employeeId" element={<ProtectedRoute moduleKey="employees"><PageSuspense><EmployeeProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/employees/:employeeId" element={<ProtectedRoute moduleKey="employees"><PageSuspense><EmployeeProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute moduleKey="attendance"><AttendancePage /></ProtectedRoute>} />
        <Route path="/leave" element={<ProtectedRoute moduleKey="leave"><LeavePage /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute moduleKey="performance"><PageSuspense><PerformancePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute moduleKey="profile"><PageSuspense><ProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/people/profile" element={<ProtectedRoute moduleKey="profile"><PageSuspense><ProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/documents" element={<Navigate to="/profile" replace />} />

        {/* Internal Hiring & Legacy Organization */}
        <Route path="/organization" element={<ProtectedRoute moduleKey="managementControl"><OrganizationPage /></ProtectedRoute>} />
        <Route path="/recruitment" element={<ProtectedRoute moduleKey="recruitment"><PageSuspense><RecruitmentPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/recruitment" element={<Navigate to="/recruitment" replace />} />
        <Route path="/internal-hiring" element={<ProtectedRoute moduleKey="recruitment"><OfferPage /></ProtectedRoute>} />
        <Route path="/internal-hiring/create" element={<ProtectedRoute moduleKey="recruitment"><OfferForm /></ProtectedRoute>} />
        <Route path="/internal-hiring/edit/:id" element={<ProtectedRoute moduleKey="recruitment"><OfferForm /></ProtectedRoute>} />
        <Route path="/internal-hiring/view/:id" element={<ProtectedRoute moduleKey="recruitment"><OfferForm /></ProtectedRoute>} />

        {/* Workbench */}
        <Route path="/workbench/network/clients" element={<ProtectedRoute moduleKey="client"><PageSuspense><ClientsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/network/clients/:id" element={<ProtectedRoute moduleKey="client"><PageSuspense><ClientProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/network/associate-partners" element={<ProtectedRoute moduleKey="associatePartner"><PageSuspense><AssociatePartnersPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/network/associate-partners/:id" element={<ProtectedRoute moduleKey="associatePartner"><PageSuspense><AssociatePartnerProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub" element={<ProtectedRoute moduleKey="openings"><PageSuspense><StaffingHubPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub/openings" element={<ProtectedRoute moduleKey="openings"><PageSuspense><OpeningsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/staffing-hub/openings/:id" element={<ProtectedRoute moduleKey="openings"><PageSuspense><OpeningDetailsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/crm" element={<ProtectedRoute moduleKey="crm"><PageSuspense><StaffingHubPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/workforce" element={<ProtectedRoute moduleKey="workforce"><PageSuspense><WorkforcePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/campaign-hub" element={<ProtectedRoute moduleKey="campaignHub"><PageSuspense><CampaignHubPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/workbench/campaign-hub/:campaignId" element={<ProtectedRoute moduleKey="campaignHub"><PageSuspense><CampaignProfilePage /></PageSuspense></ProtectedRoute>} />


        {/* Finance Workspaces */}
        <Route path="/finance" element={<Navigate to="/finance/payroll" replace />} />
        <Route path="/finance/payroll" element={<ProtectedRoute moduleKey="internalPayroll"><PageSuspense><PayrollPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/payout" element={<ProtectedRoute moduleKey="payout"><PageSuspense><PayoutPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/payroll" element={<Navigate to="/finance/payroll" replace />} />
        <Route path="/reports" element={<ProtectedRoute moduleKey="managementControl"><PageSuspense><ReportsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute moduleKey="managementControl"><PageSuspense><SettingsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/billing/invoices" element={<ProtectedRoute moduleKey="invoices"><PageSuspense><InvoicesPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/billing/invoices/:invoiceId" element={<ProtectedRoute moduleKey="invoices"><PageSuspense><InvoiceProfilePage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/billing/credit-notes" element={<ProtectedRoute moduleKey="creditNotes"><PageSuspense><CreditNotesPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/finance/transactions" element={<ProtectedRoute moduleKey="transactions"><PageSuspense><TransactionsPage /></PageSuspense></ProtectedRoute>} />

        {/* Management & Administration */}
        <Route path="/management" element={<ProtectedRoute moduleKey="managementControl"><PageSuspense><ManagementPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/administration/calendar" element={<ProtectedRoute moduleKey="calendar"><PageSuspense><CalendarEventsPage /></PageSuspense></ProtectedRoute>} />
        <Route path="/administration/announcements" element={<ProtectedRoute moduleKey="announcements"><PageSuspense><AnnouncementsPage /></PageSuspense></ProtectedRoute>} />

        {/* Default Fallback */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
