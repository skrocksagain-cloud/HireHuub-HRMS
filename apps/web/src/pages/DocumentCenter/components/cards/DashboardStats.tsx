interface DashboardStatsProps {
  loading: boolean;

  totalDocuments: number;

  generatedToday: number;

  storageUsed: string;

  totalTemplates: number;
}

export default function DashboardStats({
  loading,
  totalDocuments,
  generatedToday,
  storageUsed,
  totalTemplates,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">

      <StatCard
        title="Total Documents"
        value={loading ? "..." : totalDocuments.toLocaleString()}
        description="All generated documents"
      />

      <StatCard
        title="Generated Today"
        value={loading ? "..." : generatedToday.toString()}
        description="Created today"
      />

      <StatCard
        title="Storage Used"
        value={loading ? "..." : storageUsed}
        description="Firebase Storage"
      />

      <StatCard
        title="Templates"
        value={loading ? "..." : totalTemplates.toString()}
        description="Available templates"
      />

    </div>
  );
}

interface StatCardProps {
  title: string;

  value: string;

  description: string;
}

function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-bold text-slate-800">
        {value}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
}