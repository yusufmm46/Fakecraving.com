import { Check } from "lucide-react";

export const STEPS = ["Placed", "Cooking", "Picked up", "Arriving"];

export default function TrackingSteps({ activeIndex }) {
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? "bg-curry text-white"
                    : active
                      ? "bg-marigold text-aubergine animate-pulse"
                      : "bg-aubergine/10 dark:bg-ivory/10 text-ink/40 dark:text-ivory/40"
                }`}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium text-center w-16 ${
                  done || active ? "text-ink dark:text-ivory" : "text-ink/40 dark:text-ivory/40"
                }`}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mt-[-18px] transition-colors ${
                  done ? "bg-curry" : "bg-aubergine/10 dark:bg-ivory/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
