import { useMemo } from "react";

import type { Role } from "../../../types/Role";

import DataTable from "../../../ui/DataTable/DataTable";

import { getRoleColumns } from "./RoleColumns";

interface RoleTableProps {
  roles: Role[];

  loading: boolean;

  onEdit: (role: Role) => void;

  onDelete: (role: Role) => void;
}

export default function RoleTable({
  roles,
  loading,
  onEdit,
  onDelete,
}: RoleTableProps) {
  const columns = useMemo(
    () =>
      getRoleColumns({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  return (
    <DataTable
      data={roles}
      columns={columns}
      loading={loading}
      searchable
      pagination
      searchPlaceholder="Search roles..."
      emptyTitle="No Roles Found"
      emptyDescription="Create your first role to get started."
    />
  );
}