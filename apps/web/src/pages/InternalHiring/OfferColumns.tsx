import type { Offer } from "../../types/Offer";

import type { DataTableColumn } from "../../ui/DataTable";

import Badge from "../../ui/Badge";
import Button from "../../ui/Button";

interface OfferColumnsProps {
  onView: (offer: Offer) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
}

function getStatusVariant(status: Offer["status"]) {
  switch (status) {
    case "Accepted":
      return "success";

    case "Joined":
      return "success";

    case "Converted":
      return "success";

    case "Rejected":
      return "danger";

    case "Draft":
      return "secondary";

    case "Generated":
      return "warning";

    case "Sent":
      return "info";

    default:
      return "secondary";
  }
}

export function getOfferColumns({
  onView,
  onEdit,
  onDelete,
}: OfferColumnsProps): DataTableColumn<Offer>[] {
  return [
    {
      key: "offerId",
      title: "Offer No.",
      sortable: true,
    },

    {
      key: "fullName",
      title: "Candidate",
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">
            {row.fullName}
          </div>

          <div className="text-xs text-slate-500">
            {row.personalEmail}
          </div>
        </div>
      ),
    },

    {
      key: "departmentName",
      title: "Department",
      sortable: true,
    },

    {
      key: "designationName",
      title: "Designation",
      sortable: true,
    },

    {
      key: "joiningDate",
      title: "Joining",
      sortable: true,
    },

    {
      key: "monthlyGrossSalary",
      title: "Monthly Gross",
      align: "right",
      sortable: true,
      render: (value) =>
        `₹${Number(value).toLocaleString("en-IN")}`,
    },

    {
      key: "status",
      title: "Status",
      align: "center",
      sortable: true,
      render: (value) => (
        <Badge
          variant={getStatusVariant(
            value as Offer["status"]
          )}
        >
          {String(value)}
        </Badge>
      ),
    },

    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => onView(row)}
          >
            View
          </Button>

          <Button
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => onDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}