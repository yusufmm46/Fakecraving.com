import { useEffect, useRef, useState } from "react";

// Purely decorative fake map: a dashed route between two pins with a
// scooter marker that eases along a curved path as `progress` (0-1) grows.
const PATH = "M 30 170 C 90 40, 180 200, 270 40";

function pointOnPath(pathEl, progress) {
  if (!pathEl) return { x: 30, y: 170 };
  const length = pathEl.getTotalLength();
  return pathEl.getPointAtLength(length * progress);
}

export default function MapMock({ progress, arrived }) {
  const pathRef = useRef(null);
  const [pos, setPos] = useState({ x: 30, y: 170 });

  useEffect(() => {
    setPos(pointOnPath(pathRef.current, progress));
  }, [progress]);

  return (
    <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-gradient-to-br from-marigold/15 via-ivory to-curry/10 dark:from-aubergine/40 dark:via-ink dark:to-aubergine/20 border border-aubergine/10 dark:border-ivory/10">
      <svg viewBox="0 0 300 220" className="absolute inset-0 w-full h-full">
        <path
          ref={pathRef}
          d={PATH}
          fill="none"
          stroke="currentColor"
          className="text-aubergine/25 dark:text-ivory/25"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        <circle cx="30" cy="170" r="7" className="fill-curry" />
        <circle cx="270" cy="40" r="7" className={arrived ? "fill-chili" : "fill-aubergine/40 dark:fill-ivory/30"} />
      </svg>

      <div
        className="absolute text-2xl transition-all duration-500 ease-linear -translate-x-1/2 -translate-y-1/2 drop-shadow"
        style={{ left: `${(pos.x / 300) * 100}%`, top: `${(pos.y / 220) * 100}%` }}
      >
        🛵
      </div>

      <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-ink/40 dark:text-ivory/40 bg-white/50 dark:bg-black/30 px-2 py-0.5 rounded-full">
        Simulated route — not a real map
      </span>
    </div>
  );
}
