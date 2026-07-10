import { useMemo, useState } from "react";

import TableEmpty from "./TableEmpty";
import TableHeader from "./TableHeader";
import TableLoading from "./TableLoading";
import TablePagination from "./TablePagination";
import TableToolbar from "./TableToolbar";

import { DEFAULT_PAGE_SIZE } from "./constants";

import type { DataTableProps } from "./types";

export default function DataTable<
  T extends { id?: string }
>({
  data,
  columns,

  loading = false,

  searchable = true,

  toolbar = true,

  searchPlaceholder = "Search...",

  pagination = true,

  pageSize = DEFAULT_PAGE_SIZE,

  onRefresh,
  onExport,
  onFilter,

  toolbarActions,

  emptyTitle = "No Records Found",

  emptyDescription = "There is no data available.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const [sortKey, setSortKey] = useState("");

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const filteredData = useMemo(() => {
    let rows = [...data];

    if (searchable && search.trim()) {
      const keyword = search.toLowerCase();

      rows = rows.filter((row) =>
        Object.values(row).some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword)
        )
      );
    }

    if (sortKey) {
      rows.sort((a, b) => {
        const aValue =
          a[sortKey as keyof T];

        const bValue =
          b[sortKey as keyof T];

        if (aValue == null) return -1;
        if (bValue == null) return 1;

        if (aValue < bValue) {
          return sortDirection === "asc"
            ? -1
            : 1;
        }

        if (aValue > bValue) {
          return sortDirection === "asc"
            ? 1
            : -1;
        }

        return 0;
      });
    }

    return rows;
  }, [
    data,
    searchable,
    search,
    sortKey,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedData = pagination
    ? filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      )
    : filteredData;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {toolbar && (
        <TableToolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder={searchPlaceholder}
          onRefresh={onRefresh}
          onExport={onExport}
          onFilter={onFilter}
        >
          {toolbarActions}
        </TableToolbar>
      )}

      {loading ? (
        <TableLoading
          columns={columns.length}
        />
      ) : filteredData.length === 0 ? (
        <TableEmpty
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <>
          <div className="overflow-x-auto">

            <table className="min-w-full border-collapse">

              <TableHeader
                columns={columns}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />

              <tbody>
                {paginatedData.map((row, index) => (
                  <tr
                    key={
                      row.id ??
                      `row-${index}`
                    }
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    {columns.map((column) => {
                      const value =
                        row[
                          column.key as keyof T
                        ];

                      return (
                        <td
                          key={String(column.key)}
                          className={`
                            px-4
                            py-3
                            text-sm
                            text-slate-700
                            ${
                              column.align ===
                              "center"
                                ? "text-center"
                                : column.align ===
                                  "right"
                                ? "text-right"
                                : "text-left"
                            }
                          `}
                        >
                          {column.render
                            ? column.render(
                                value,
                                row
                              )
                            : String(
                                value ?? ""
                              )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

            </table>

          </div>

          {pagination && (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}