import { useCallback, useEffect, useState } from "react";

import type { Designation } from "../../../types/Designation";

import { DEFAULT_DESIGNATION } from "./constants";

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../../../services/designation/designationService";

export function useDesignation() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] =
    useState<Designation | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [designation, setDesignation] =
    useState<Designation>(DEFAULT_DESIGNATION);

  const loadDesignations = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getDesignations();

      setDesignations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesignations();
  }, [loadDesignations]);

  function openCreate() {
    setEditing(null);
    setDesignation(DEFAULT_DESIGNATION);
    setShowForm(true);
  }

  function openEdit(item: Designation) {
    setEditing(item);
    setDesignation(item);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setDesignation(DEFAULT_DESIGNATION);
    setShowForm(false);
  }

  async function save() {
    try {
      if (!designation.name.trim()) {
        throw new Error("Designation Name is required.");
      }

      if (!designation.code.trim()) {
        throw new Error("Designation Code is required.");
      }

      setSaving(true);

      if (editing?.id) {
        await updateDesignation(
          editing.id,
          designation
        );
      } else {
        await createDesignation(designation);
      }

      closeForm();

      await loadDesignations();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteDesignation(id);
      await loadDesignations();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  return {
    designations,

    loading,

    saving,

    editing,

    designation,

    showForm,

    setDesignation,

    openCreate,

    openEdit,

    closeForm,

    save,

    remove,
  };
}