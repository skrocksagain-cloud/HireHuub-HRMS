import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

import type { DataTableColumn } from "./types";

interface TableHeaderProps<T> {
  columns: DataTableColumn<T>[];

  sortKey: string;

  sortDirection: "asc" | "desc";

  onSort: (key: string) => void;
}

export default function TableHeader<T>({
  columns,
  sortKey,
  sortDirection,
  onSort,
}: TableHeaderProps<T>) {
  function renderSortIcon(key: string) {
    if (sortKey !== key) {
      return (
        <ArrowUpDown
          size={15}
          className="text-slate-400"
        />
      );
    }

    return sortDirection === "asc" ? (
      <ArrowUp
        size={15}
        className="text-emerald-600"
      />
    ) : (
      <ArrowDown
        size={15}
        className="text-emerald-600"
      />
    );
  }

  return (
    <thead className="sticky top-0 z-10 bg-slate-100">
      <tr>
        {columns.map((column) => (
          <th
            key={String(column.key)}
            style={{ width: column.width }}
            className={`
              border-b
              border-slate-200
              px-4
              py-3
              text-sm
              font-semibold
              text-slate-700

              ${
                column.align === "center"
                  ? "text-center"
                  : column.align === "right"
                  ? "text-right"
                  : "text-left"
              }

              ${
                column.sortable
                  ? "cursor-pointer select-none hover:bg-slate-200"
                  : ""
              }
            `}
            onClick={() => {
              if (column.sortable) {
                onSort(String(column.key));
              }
            }}
          >
            <div
              className={`
                flex items-center gap-2

                ${
                  column.align === "center"
                    ? "justify-center"
                    : column.align === "right"
                    ? "justify-end"
                    : ""
                }
              `}
            >
              {column.title}

              {column.sortable &&
                renderSortIcon(String(column.key))}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}