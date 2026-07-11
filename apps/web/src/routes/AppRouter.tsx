import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import OrganizationPage from "../pages/Organization";

import CreateEmployee from "../pages/Employees/Create";
import EmployeePage from "../pages/Employees/EmployeePage";

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
          element={<CreateEmployee />}
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