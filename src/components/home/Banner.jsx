const TAGLINES = [
  "Order anything. Pay nothing. Feel everything.",
  "The craving was real. The delivery isn't.",
  "100% simulation. 0% calories. 0% delivery.",
];

export default function Banner() {
  const tagline = TAGLINES[new Date().getDate() % TAGLINES.length];

  return (
    <div className="mx-4 sm:mx-6 mt-4 rounded-2xl bg-gradient-to-br from-aubergine to-[#5a2664] px-5 py-6 sm:px-8 sm:py-8 text-ivory relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-marigold/20 blur-2xl" />
      <div className="absolute -right-2 bottom-2 text-6xl opacity-20 select-none">🛵</div>
      <p className="relative font-display text-xl sm:text-2xl font-semibold max-w-xs sm:max-w-sm">
        {tagline}
      </p>
      <p className="relative mt-2 text-sm text-ivory/70 max-w-xs sm:max-w-sm">
        Browse, order, and track a delivery that will never, ever arrive.
      </p>
    </div>
  );
}
