import Card from "../../../../ui/Card";

interface ActivityItem {
  id: string;

  title: string;

  description: string;

  time: string;
}

interface DocumentActivityProps {
  loading: boolean;

  activities: ActivityItem[];
}

export default function DocumentActivity({
  loading,
  activities,
}: DocumentActivityProps) {
  return (
    <Card>

      <div className="mb-6">

        <h2 className="text-xl font-semibold text-slate-800">
          Recent Activity
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest document activities across the ERP.
        </p>

      </div>

      {loading ? (
        <div className="space-y-4">

          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))}

        </div>
      ) : activities.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">

          <div className="text-4xl">
            📭
          </div>

          <h3 className="mt-4 text-lg font-semibold text-slate-700">
            No Recent Activity
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Document activities will appear here.
          </p>

        </div>

      ) : (

        <div className="space-y-5">

          {activities.map((activity) => (

            <div
              key={activity.id}
              className="flex gap-4"
            >

              {/* Timeline */}

              <div className="flex flex-col items-center">

                <div className="h-3 w-3 rounded-full bg-green-600" />

                <div className="mt-2 h-full w-px bg-slate-200" />

              </div>

              {/* Content */}

              <div className="flex-1 pb-5">

                <h3 className="font-semibold text-slate-800">
                  {activity.title}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {activity.description}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {activity.time}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </Card>
  );
}