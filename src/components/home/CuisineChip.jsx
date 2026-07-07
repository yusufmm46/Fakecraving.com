export default function CuisineChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-chili text-white border-chili"
          : "bg-transparent text-ink/70 dark:text-ivory/70 border-aubergine/15 dark:border-ivory/15 hover:border-chili/50"
      }`}
    >
      {label}
    </button>
  );
}
