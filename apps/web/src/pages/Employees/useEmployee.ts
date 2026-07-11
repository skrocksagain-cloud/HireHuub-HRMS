import { useCallback, useEffect, useState } from "react";

import type { Employee } from "../../types/Employee";

import { DEFAULT_EMPLOYEE } from "../../constants/defaultEmployee";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/employee/employeeService";

export function useEmployee() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [editing, setEditing] =
    useState<Employee | null>(null);

  const [employee, setEmployee] =
    useState<Employee>(DEFAULT_EMPLOYEE);

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getEmployees();

      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  function openCreate() {
    setEditing(null);

    setEmployee(DEFAULT_EMPLOYEE);
  }

  function openEdit(item: Employee) {
    setEditing(item);

    setEmployee(item);
  }

  function confirmDelete(item: Employee) {
    setSelectedEmployee(item);

    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false);

    setSelectedEmployee(null);
  }

  async function removeEmployee() {
    if (!selectedEmployee?.id) return;

    try {
      await deleteEmployee(selectedEmployee.id);

      closeDeleteDialog();

      await loadEmployees();
    } catch (error) {
      console.error(error);
    }
  }

  async function saveEmployee() {
    try {
      setSaving(true);

      if (editing?.id) {
        await updateEmployee(
          editing.id,
          employee
        );
      } else {
        await createEmployee(employee);
      }

      setEmployee(DEFAULT_EMPLOYEE);

      setEditing(null);

      await loadEmployees();
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  return {
    employees,

    loading,

    saving,

    search,
    setSearch,

    employee,
    setEmployee,

    editing,

    openCreate,

    openEdit,

    saveEmployee,

    deleteDialogOpen,

    selectedEmployee,

    confirmDelete,

    closeDeleteDialog,

    removeEmployee,

    loadEmployees,
  };
}