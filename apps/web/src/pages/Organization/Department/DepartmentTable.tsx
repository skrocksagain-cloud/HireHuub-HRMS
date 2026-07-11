import { useMemo } from "react";

import type { Department } from "../../../types/Department";

import DataTable from "../../../ui/DataTable/DataTable";

import { getDepartmentColumns } from "./DepartmentColumns";

interface DepartmentTableProps {
  departments: Department[];

  loading: boolean;

  onEdit: (department: Department) => void;

  onDelete: (department: Department) => void;
}

export default function DepartmentTable({
  departments,
  loading,
  onEdit,
  onDelete,
}: DepartmentTableProps) {
  const columns = useMemo(
    () =>
      getDepartmentColumns({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  return (
    <DataTable
      data={departments}
      columns={columns}
      loading={loading}
      searchable
      pagination
      searchPlaceholder="Search departments..."
      emptyTitle="No Departments Found"
      emptyDescription="Create your first department to get started."
    />
  );
}