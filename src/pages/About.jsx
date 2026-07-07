import { useState } from "react";
import { ChevronDown } from "lucide-react";
import TopBar from "../components/layout/TopBar";

function CommonsCredits() {
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState(null);

  const toggle = () => {
    setOpen((v) => !v);
    if (!credits) {
      fetch("/images/cuisines/credits.json")
        .then((res) => res.json())
        .then(setCredits);
    }
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-ivory/50 hover:text-ink dark:hover:text-ivory"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        Wikimedia Commons photo credits
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-[11px] text-ink/50 dark:text-ivory/50 max-h-72 overflow-y-auto pr-2">
          {!credits && <p>Loading credits…</p>}
          {credits &&
            Object.entries(credits)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cuisine, photos]) => (
                <p key={cuisine}>
                  <span className="font-medium text-ink/70 dark:text-ivory/70">{cuisine}:</span>{" "}
                  {photos.map((p, i) => (
                    <span key={p.file}>
                      <a href={p.source} target="_blank" rel="noreferrer" className="hover:underline">
                        {p.artist}
                      </a>{" "}
                      ({p.license})
                      {i < photos.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              ))}
        </div>
      )}
    </div>
  );
}

function PexelsCredits() {
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState(null);

  const toggle = () => {
    setOpen((v) => !v);
    if (!credits) {
      fetch("/data/pexels-credits.json")
        .then((res) => res.json())
        .then(setCredits);
    }
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-ivory/50 hover:text-ink dark:hover:text-ivory"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        Pexels photo credits
      </button>
      {open && (
        <div className="mt-3 text-[11px] text-ink/50 dark:text-ivory/50 max-h-72 overflow-y-auto pr-2 leading-relaxed">
          {!credits && <p>Loading credits…</p>}
          {credits &&
            credits
              .slice()
              .sort((a, b) => a.photographer.localeCompare(b.photographer))
              .map((c, i) => (
                <span key={c.pexels_page_url}>
                  Photo by{" "}
                  <a href={c.pexels_page_url} target="_blank" rel="noreferrer" className="hover:underline">
                    {c.photographer}
                  </a>{" "}
                  on{" "}
                  <a
                    href="https://www.pexels.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Pexels
                  </a>
                  {i < credits.length - 1 ? ", " : ""}
                </span>
              ))}
        </div>
      )}
    </div>
  );
}

export default function About() {
  return (
    <div className="pb-10">
      <TopBar title="Why this exists" showBack />

      <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto space-y-5 text-sm leading-relaxed text-ink/80 dark:text-ivory/80">
        <p className="font-display text-xl font-semibold text-ink dark:text-ivory">
          Nothing here is real. That's on purpose.
        </p>
        <p>
          FakeCraving is a satirical "dopamine site" — a food-delivery app with no food, no
          payments, and no delivery. You can browse fictional restaurants, add fictional dishes
          to a cart, and place a fake order that gets tracked in real time on a fake map, right up
          to the moment it honestly tells you it was never coming.
        </p>
        <p>
          It's inspired by Korea's{" "}
          <span className="font-semibold text-ink dark:text-ivory">FoodNeverComes</span> trend —
          the idea that sometimes the ritual of ordering (browsing, deciding, waiting) is the
          actual craving, and the food itself is almost beside the point.
        </p>
        <p>
          No restaurant names on this site are real. Restaurant identities are procedurally
          generated; menu items and prices are drawn from public restaurant data with fictional
          names layered on top, so nothing here impersonates an actual business. Restaurant cover
          photos and dish photos are real food photography from{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="underline">
            Pexels
          </a>{" "}
          and{" "}
          <a href="https://foodish-api.com" target="_blank" rel="noreferrer" className="underline">
            Foodish
          </a>
          , matched by cuisine/dish type rather than to any specific fictional restaurant.
        </p>
        <p>
          There's no login, no payment, and no tracking beyond an anonymous session ID stored in
          your browser. If you'd like to support the project, there's an optional donate button —
          entirely optional, entirely honest about where the money goes (keeping this silly little
          site online).
        </p>
        <p className="honesty-box px-4 py-3">
          This app, like every order placed on it, will never deliver anything. Enjoy the
          simulation.
        </p>

        <p className="text-xs text-ink/50 dark:text-ivory/50">
          Some dish photos are also sourced from{" "}
          <a href="https://foodish-api.com" target="_blank" rel="noreferrer" className="underline">
            Foodish
          </a>{" "}
          (foodish-api.com), a free food-photo API — individual photographer credits for those
          aren't available via its API.
        </p>

        <PexelsCredits />
        <CommonsCredits />
      </div>
    </div>
  );
}
