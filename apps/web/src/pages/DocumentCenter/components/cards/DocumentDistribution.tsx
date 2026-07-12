import Card from "../../../../ui/Card";

interface DistributionItem {
  label: string;

  count: number;
}

interface DocumentDistributionProps {
  loading: boolean;

  data: DistributionItem[];
}

export default function DocumentDistribution({
  loading,
  data,
}: DocumentDistributionProps) {
  const maxValue =
    data.length > 0
      ? Math.max(...data.map((item) => item.count))
      : 1;

  return (
    <Card>

      {/* Header */}

      <div className="mb-6">

        <h2 className="text-xl font-semibold text-slate-800">
          Document Distribution
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Distribution of generated document types.
        </p>

      </div>

      {/* Loading */}

      {loading ? (
        <div className="space-y-5">

          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>

              <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-200" />

              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />

            </div>
          ))}

        </div>
      ) : data.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">

          <div className="text-5xl">
            📊
          </div>

          <h3 className="mt-4 text-lg font-semibold text-slate-700">
            No Distribution Available
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Document statistics will appear here.
          </p>

        </div>

      ) : (

        <div className="space-y-6">

          {data.map((item) => {
            const percentage =
              (item.count / maxValue) * 100;

            return (
              <div key={item.label}>

                <div className="mb-2 flex items-center justify-between">

                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-500">
                    {item.count}
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-green-600 transition-all duration-700"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

        </div>

      )}

    </Card>
  );
}