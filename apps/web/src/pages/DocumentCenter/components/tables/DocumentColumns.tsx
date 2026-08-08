import type { Document } from "../../../../types/Document";
import type { DataTableColumn } from "../../../../ui/DataTable";
import Badge from "../../../../ui/Badge";
import Button from "../../../../ui/Button";

interface DocumentColumnsProps {
  onView: (document: Document) => void;
  onDownload: (document: Document) => void;
  onArchive: (document: Document) => void;
  onDelete: (document: Document) => void;
  canArchive?: boolean;
  canDelete?: boolean;
}

function getStatusVariant(status: Document["status"]) {
  switch (status) {
    case "Generated":
      return "success";
    case "Uploaded":
      return "info";
    case "Sent":
      return "warning";
    case "Downloaded":
      return "secondary";
    case "Archived":
      return "danger";
    case "Draft":
    default:
      return "secondary";
  }
}

export function getDocumentColumns({
  onView,
  onDownload,
  onArchive,
  onDelete,
  canArchive = true,
  canDelete = false,
}: DocumentColumnsProps): DataTableColumn<Document>[] {
  return [
    {
      key: "documentId",
      title: "Document No.",
      sortable: true,
    },
    {
      key: "title",
      title: "Title",
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.title}</div>
          <div className="text-[11px] text-slate-400 font-mono">Ref: {row.referenceId}</div>
        </div>
      ),
    },
    {
      key: "sharedWith",
      title: "Shared With",
      sortable: true,
      render: (_, row) => {
        const value = row.sharedWith || (row.targetType ? `${row.targetType} → ${row.referenceId}` : `System → ${row.referenceId}`);
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {value}
          </span>
        );
      },
    },
    {
      key: "module",
      title: "Module",
      sortable: true,
    },
    {
      key: "documentType",
      title: "Type",
      sortable: true,
    },
    {
      key: "version",
      title: "Version",
      align: "center",
      sortable: true,
      render: (value) => `v${value}`,
    },
    {
      key: "status",
      title: "Status",
      align: "center",
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusVariant(value as Document["status"])}>
          {String(value)}
        </Badge>
      ),
    },
    {
      key: "createdBy",
      title: "Uploaded By",
      sortable: true,
      render: (_, row) => row.createdBy || row.generatedBy || "System",
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <Button onClick={() => onView(row)} className="px-2.5 py-1 text-xs">
            Preview
          </Button>
          <Button onClick={() => onDownload(row)} className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700">
            Download
          </Button>
          {canArchive && !row.archived && (
            <Button
              className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-700"
              onClick={() => onArchive(row)}
            >
              Archive
            </Button>
          )}
          {canDelete && (
            <Button
              className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700"
              onClick={() => onDelete(row)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];
}