import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Employee } from "../../types/Employee";

import {
  getEmployees,
  deleteEmployee,
} from "../../services/employee/employeeService";

import EmployeeTable from "./EmployeeTable";

import Button from "../../ui/Button";
import PageHeader from "../../ui/PageHeader";

export default function EmployeeList() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);

      const data = await getEmployees();

      setEmployees(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) return;

    try {
      await deleteEmployee(id);

      await loadEmployees();

      alert("Employee deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Unable to delete employee.");
    }
  }

  function handleEdit(employee: Employee) {
    navigate(`/employees/edit/${employee.id}`);
  }

  function handleView(employee: Employee) {
    navigate(`/employees/profile/${employee.id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        Loading Employees...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <PageHeader
  title="Employees"
  description="Manage employee records"
/>

        <Button
          onClick={() =>
            navigate("/employees/create")
          }
        >
          + New Employee
        </Button>

      </div>

      <EmployeeTable
        employees={employees}
        search={search}
        setSearch={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

    </div>
  );
}