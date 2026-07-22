import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

import OrganizationPage from "../pages/Organization";

import EmployeePage from '../pages/Employee/EmployeePage';

import OfferPage from "../pages/InternalHiring/OfferPage";
import OfferForm from "../pages/InternalHiring/OfferForm";
import DocumentDashboard from '../pages/DocumentCenter/DocumentDashboard';
import AttendancePage from '../pages/Attendance';

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

        {/* Default Route */}
        <Route
          path="/"
          element={<Dashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}
