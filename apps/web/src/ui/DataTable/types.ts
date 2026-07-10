import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: keyof T | string;

  title: string;

  sortable?: boolean;

  width?: string;

  align?: "left" | "center" | "right";

  render?: (
    value: unknown,
    row: T
  ) => ReactNode;
}

export interface DataTableAction<T> {
  label: string;

  onClick: (row: T) => void;

  variant?:
    | "primary"
    | "danger"
    | "secondary";
}

export interface DataTableProps<T> {
  data: T[];

  columns: DataTableColumn<T>[];

  loading?: boolean;

  emptyTitle?: string;

  emptyDescription?: string;

  searchable?: boolean;

  toolbar?: boolean;

  searchPlaceholder?: string;

  pagination?: boolean;

  pageSize?: number;

  onRefresh?: () => void;

  onExport?: () => void;

  onFilter?: () => void;

  toolbarActions?: React.ReactNode;

  actions?: DataTableAction<T>[];
}
