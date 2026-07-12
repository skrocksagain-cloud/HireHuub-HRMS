import type { Offer } from "../../../../types/Offer";

interface TimelineCardProps {
  offer: Offer;
}

interface TimelineItem {
  title: string;
  description?: string;
  by?: string;
  date?: string;
}

export default function TimelineCard({
  offer,
}: TimelineCardProps) {
  const timeline: TimelineItem[] = offer.timeline ?? [];

  return (
    <div>

      <h2 className="text-lg font-semibold text-slate-800 mb-6">
        Activity Timeline
      </h2>

      {timeline.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No activity available.
        </div>

      ) : (

        <div className="relative border-l-2 border-green-600 ml-4">

          {timeline.map((item, index) => (

            <div
              key={index}
              className="relative mb-8 pl-8"
            >

              <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-green-600 border-4 border-white shadow" />

              <h3 className="font-semibold text-slate-800">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">

                {item.by && (
                  <span>
                    By : {item.by}
                  </span>
                )}

                {item.date && (
                  <span>
                    {item.date}
                  </span>
                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}