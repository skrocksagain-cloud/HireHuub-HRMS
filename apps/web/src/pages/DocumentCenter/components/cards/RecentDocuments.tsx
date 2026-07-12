import type { Document } from "../../../../types/Document";

import Card from "../../../../ui/Card";
import Button from "../../../../ui/Button";

interface RecentDocumentsProps {
  loading: boolean;

  documents: Document[];

  onRefresh?: () => void;
}

export default function RecentDocuments({
  loading,
  documents,
  onRefresh,
}: RecentDocumentsProps) {
  return (
    <Card>

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold text-slate-800">
            Recent Documents
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recently generated and uploaded documents.
          </p>

        </div>

        <Button onClick={onRefresh}>
          Refresh
        </Button>

      </div>

      {/* Loading */}

      {loading ? (
        <div className="space-y-3">

          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-slate-100"
            />
          ))}

        </div>
      ) : documents.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">

          <div className="text-5xl">
            📄
          </div>

          <h3 className="mt-4 text-lg font-semibold text-slate-700">
            No Documents Found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Generated documents will appear here.
          </p>

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>

              <tr className="border-b border-slate-200">

                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Document
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Reference
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Type
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Status
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Version
                </th>

              </tr>

            </thead>

            <tbody>

              {documents.map((document) => (

                <tr
                  key={document.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >

                  <td className="px-4 py-4">

                    <div className="font-medium text-slate-800">
                      {document.title}
                    </div>

                    <div className="text-xs text-slate-500">
                      {document.documentId}
                    </div>

                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {document.referenceId}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {document.documentType}
                  </td>

                  <td className="px-4 py-4">

                    <StatusBadge
                      status={document.status}
                    />

                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    v{document.version}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </Card>
  );
}

interface StatusBadgeProps {
  status: Document["status"];
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  const styles: Record<Document["status"], string> = {
    Draft:
      "bg-slate-100 text-slate-700",

    Generated:
      "bg-blue-100 text-blue-700",

    Uploaded:
      "bg-purple-100 text-purple-700",

    Sent:
      "bg-indigo-100 text-indigo-700",

    Downloaded:
      "bg-green-100 text-green-700",

    Archived:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}