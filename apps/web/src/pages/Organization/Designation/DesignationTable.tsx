import { useMemo } from "react";

import type { Designation } from "../../../types/Designation";

import DataTable from "../../../ui/DataTable/DataTable";

import { getDesignationColumns } from "./DesignationColumns";

interface DesignationTableProps {
  designations: Designation[];

  loading: boolean;

  onEdit: (designation: Designation) => void;

  onDelete: (designation: Designation) => void;
}

export default function DesignationTable({
  designations,
  loading,
  onEdit,
  onDelete,
}: DesignationTableProps) {
  const columns = useMemo(
    () =>
      getDesignationColumns({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  return (
    <DataTable
      data={designations}
      columns={columns}
      loading={loading}
      searchable
      pagination
      searchPlaceholder="Search designations..."
      emptyTitle="No Designations Found"
      emptyDescription="Create your first designation to get started."
    />
  );
}