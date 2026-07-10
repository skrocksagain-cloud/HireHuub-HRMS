import EmptyState from "../EmptyState";

interface TableEmptyProps {
  title?: string;
  description?: string;
}

export default function TableEmpty({
  title = "No Records Found",
  description = "There is no data available.",
}: TableEmptyProps) {
  return (
    <div className="p-8">
      <EmptyState
        title={title}
        description={description}
      />
    </div>
  );
}