import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* People */}
        <Route path="/employees" element={<EmployeePage />} />
        <Route path="/employees/create" element={<EmployeePage initialPanel="create" />} />
        <Route path="/people/employees/:employeeId" element={<PageSuspense><EmployeeProfilePage /></PageSuspense>} />
        <Route path="/employees/:employeeId" element={<PageSuspense><EmployeeProfilePage /></PageSuspense>} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/performance" element={<PageSuspense><PerformancePage /></PageSuspense>} />
        <Route path="/documents" element={<DocumentDashboard />} />

        {/* Internal Hiring & Legacy Organization */}
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/internal-hiring" element={<OfferPage />} />
        <Route path="/internal-hiring/create" element={<OfferForm />} />
        <Route path="/internal-hiring/edit/:id" element={<OfferForm />} />
        <Route path="/internal-hiring/view/:id" element={<OfferForm />} />

        {/* Workbench */}
        <Route path="/workbench/network/clients" element={<PageSuspense><ClientsPage /></PageSuspense>} />
        <Route path="/workbench/network/clients/:id" element={<PageSuspense><ClientProfilePage /></PageSuspense>} />
        <Route path="/workbench/network/associate-partners" element={<PageSuspense><AssociatePartnersPage /></PageSuspense>} />
        <Route path="/workbench/network/associate-partners/:id" element={<PageSuspense><AssociatePartnerProfilePage /></PageSuspense>} />
        <Route path="/workbench/staffing-hub" element={<PageSuspense><StaffingHubPage /></PageSuspense>} />
        <Route path="/workbench/staffing-hub/openings" element={<PageSuspense><OpeningsPage /></PageSuspense>} />
        <Route path="/workbench/staffing-hub/openings/:id" element={<PageSuspense><OpeningDetailsPage /></PageSuspense>} />
        <Route path="/workbench/staffing-hub/crm" element={<PageSuspense><StaffingHubPage /></PageSuspense>} />
        <Route path="/workbench/workforce" element={<PageSuspense><WorkforcePage /></PageSuspense>} />
        <Route path="/workbench/workforce/:id" element={<PageSuspense><WorkforceProfilePage /></PageSuspense>} />
        <Route path="/workbench/campaign-hub" element={<PageSuspense><CampaignHubPage /></PageSuspense>} />
        <Route path="/workbench/campaign-hub/:campaignId" element={<PageSuspense><CampaignProfilePage /></PageSuspense>} />

        {/* Finance Workspaces */}
        <Route path="/finance/billing/invoices" element={<PageSuspense><InvoicesPage /></PageSuspense>} />
        <Route path="/finance/billing/invoices/:invoiceId" element={<PageSuspense><InvoiceProfilePage /></PageSuspense>} />
        <Route path="/finance/billing/credit-notes" element={<PageSuspense><CreditNotesPage /></PageSuspense>} />
        <Route path="/finance/transactions" element={<PageSuspense><TransactionsPage /></PageSuspense>} />

        {/* Management */}
        <Route path="/management" element={<PageSuspense><ManagementPage /></PageSuspense>} />

        {/* Default Fallback */}
        <Route path="/" element={<Dashboard />} />

      </Routes>
    </BrowserRouter>
  );
}
