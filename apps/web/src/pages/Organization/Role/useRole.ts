import { useCallback, useEffect, useState } from "react";

import type { Role } from "../../../types/Role";

import { DEFAULT_ROLE } from "./constants";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../../services/role/roleService";

export function useRole() {
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] =
    useState<Role | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [role, setRole] =
    useState<Role>(DEFAULT_ROLE);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getRoles();

      setRoles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  function openCreate() {
    setEditing(null);

    setRole(DEFAULT_ROLE);

    setShowForm(true);
  }

  function openEdit(item: Role) {
    setEditing(item);

    setRole(item);

    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);

    setRole(DEFAULT_ROLE);

    setShowForm(false);
  }

  async function save() {
    try {
      if (!role.name.trim()) {
        throw new Error("Role Name is required.");
      }

      if (!role.code.trim()) {
        throw new Error("Role Code is required.");
      }

      setSaving(true);

      if (editing?.id) {
        await updateRole(
          editing.id,
          role
        );
      } else {
        await createRole(role);
      }

      closeForm();

      await loadRoles();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteRole(id);

      await loadRoles();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  return {
    roles,

    loading,

    saving,

    editing,

    role,

    showForm,

    setRole,

    openCreate,

    openEdit,

    closeForm,

    save,

    remove,
  };
}