import { DataTable } from "../../ui/DataTable";
import Card from "../../ui/Card";

import useDocumentTable from "./useDocumentTable";

import { getDocumentColumns } from "./components/tables/DocumentColumns";

import {
  DOCUMENT_MODULES,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
} from "./constants";

export default function DocumentTable() {
  const {
    loading,
    filteredDocuments,

    search,
    setSearch,

    selectedModule,
    setSelectedModule,

    selectedType,
    setSelectedType,

    selectedStatus,
    setSelectedStatus,

    refresh,

    view,
    download,
    archive,
    remove,
  } = useDocumentTable();

  const columns = getDocumentColumns({
    onView: view,
    onDownload: download,
    onArchive: archive,
    onDelete: remove,
  });

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Documents
        </h1>

        <p className="mt-2 text-slate-500">
          Manage all ERP documents from one place.
        </p>
      </div>

      {/* Filters */}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />

          {/* Module */}

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">All Modules</option>

            {DOCUMENT_MODULES.map((module) => (
              <option
                key={module}
                value={module}
              >
                {module}
              </option>
            ))}
          </select>

          {/* Type */}

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">All Types</option>

            {DOCUMENT_TYPES.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>

          {/* Status */}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">All Status</option>

            {DOCUMENT_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}

      <DataTable
        data={filteredDocuments}
        columns={columns}
        loading={loading}
        searchable={false}
        onRefresh={refresh}
        emptyTitle="No Documents Found"
        emptyDescription="No documents match the selected filters."
      />
    </div>
  );
}