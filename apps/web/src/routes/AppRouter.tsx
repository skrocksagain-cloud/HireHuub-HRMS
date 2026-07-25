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

// Finance – lazy loaded
const FinanceDashboardPage = lazy(() => import("../pages/Finance/FinanceDashboardPage"));
const NewInvoicePage = lazy(() => import("../pages/Finance/billing/NewInvoicePage"));
const InvoiceDetailsPage = lazy(() => import("../pages/Finance/billing/InvoiceDetailsPage"));
const CreditNotesPage = lazy(() => import("../pages/Finance/billing/CreditNotesPage"));
const TransactionsPage = lazy(() => import("../pages/Finance/transactions/TransactionsPage"));
const BankPaymentBatchPage = lazy(() => import("../pages/Finance/transactions/BankPaymentBatchPage"));
const PaymentHistoryPage = lazy(() => import("../pages/Finance/transactions/PaymentHistoryPage"));

function FinanceSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>}>
      {children}
    </Suspense>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Organization */}
        <Route
          path="/organization"
          element={<OrganizationPage />}
        />

        {/* Employees */}
        <Route
          path="/employees"
          element={<EmployeePage />}
        />

        <Route
          path="/employees/create"
          element={<EmployeePage initialPanel="create" />}
        />

        {/* ==========================================
            Internal Hiring
        ========================================== */}

        <Route
          path="/internal-hiring"
          element={<OfferPage />}
        />

        <Route
          path="/internal-hiring/create"
          element={<OfferForm />}
        />

        <Route
          path="/internal-hiring/edit/:id"
          element={<OfferForm />}
        />

        <Route
          path="/internal-hiring/view/:id"
          element={<OfferForm />}
        />

        <Route
          path="/documents"
          element={<DocumentDashboard />}
        />

        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />

        {/* ==========================================
            Finance – lazy loaded
            Visible to: Finance Admin, Super Admin
        ========================================== */}

        <Route
          path="/finance/dashboard"
          element={<FinanceSuspense><FinanceDashboardPage /></FinanceSuspense>}
        />

        {/* Finance / Billing */}
        <Route
          path="/finance/billing/new-invoice"
          element={<FinanceSuspense><NewInvoicePage /></FinanceSuspense>}
        />
        <Route
          path="/finance/billing/invoice-details"
          element={<FinanceSuspense><InvoiceDetailsPage /></FinanceSuspense>}
        />
        <Route
          path="/finance/billing/credit-notes"
          element={<FinanceSuspense><CreditNotesPage /></FinanceSuspense>}
        />

        {/* Finance / Transactions */}
        <Route
          path="/finance/transactions"
          element={<FinanceSuspense><TransactionsPage /></FinanceSuspense>}
        />
        <Route
          path="/finance/transactions/bank-payment-batch"
          element={<FinanceSuspense><BankPaymentBatchPage /></FinanceSuspense>}
        />
        <Route
          path="/finance/transactions/payment-history"
          element={<FinanceSuspense><PaymentHistoryPage /></FinanceSuspense>}
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Dashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}
