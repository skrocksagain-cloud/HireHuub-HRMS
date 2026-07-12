import type { Offer } from "../../../types/Offer";

interface ProgressTrackerProps {
  status: Offer["status"];
}

const STEPS = [
  {
    title: "Interview",
    status: "Draft",
  },
  {
    title: "Offer",
    status: "Generated",
  },
  {
    title: "Sent",
    status: "Sent",
  },
  {
    title: "Accepted",
    status: "Accepted",
  },
  {
    title: "Joined",
    status: "Joined",
  },
  {
    title: "Employee",
    status: "Converted",
  },
] as const;

export default function ProgressTracker({
  status,
}: ProgressTrackerProps) {
  const currentIndex = STEPS.findIndex(
    (step) => step.status === status
  );

  return (
    <div>

      <h2 className="text-lg font-semibold mb-6">
        Hiring Progress
      </h2>

      <div className="flex items-center justify-between overflow-x-auto">

        {STEPS.map((step, index) => {
          const completed = index <= currentIndex;

          return (
            <div
              key={step.title}
              className="flex items-center flex-1"
            >
              <div className="flex flex-col items-center min-w-[90px]">

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    completed
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {completed ? "✓" : index + 1}
                </div>

                <span
                  className={`mt-2 text-sm text-center ${
                    completed
                      ? "font-semibold text-green-700"
                      : "text-slate-500"
                  }`}
                >
                  {step.title}
                </span>

              </div>

              {index < STEPS.length - 1 && (

                <div
                  className={`flex-1 h-1 mx-2 rounded-full ${
                    completed
                      ? "bg-green-600"
                      : "bg-slate-200"
                  }`}
                />

              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}