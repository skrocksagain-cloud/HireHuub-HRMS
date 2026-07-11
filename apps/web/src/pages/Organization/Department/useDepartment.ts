import { useCallback, useEffect, useState } from "react";

import type { Department } from "../../../types/Department";

import { DEFAULT_DEPARTMENT } from "./constants";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../services/department/departmentService";

export function useDepartment() {
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] =
    useState<Department | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [department, setDepartment] =
    useState<Department>(DEFAULT_DEPARTMENT);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getDepartments();

      setDepartments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  function openCreate() {
    setEditing(null);

    setDepartment(DEFAULT_DEPARTMENT);

    setShowForm(true);
  }

  function openEdit(item: Department) {
    setEditing(item);

    setDepartment(item);

    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);

    setDepartment(DEFAULT_DEPARTMENT);

    setShowForm(false);
  }

  async function save() {
    try {
      if (!department.name.trim()) {
        throw new Error("Department Name is required.");
      }

      if (!department.code.trim()) {
        throw new Error("Department Code is required.");
      }

      setSaving(true);

      if (editing?.id) {
        await updateDepartment(
          editing.id,
          department
        );
      } else {
        await createDepartment(department);
      }

      closeForm();

      await loadDepartments();
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteDepartment(id);

      await loadDepartments();
    } catch (error) {
      console.error(error);

      throw error;
    }
  }

  return {
    departments,

    loading,

    saving,

    editing,

    department,

    showForm,

    setDepartment,

    openCreate,

    openEdit,

    closeForm,

    save,

    remove,
  };
}