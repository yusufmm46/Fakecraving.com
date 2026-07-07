import { useState } from "react";
import { Share2, Check } from "lucide-react";

const SAVINGS_LINES = [
  (total, cals) => `₹${total} saved, ~${cals} calories dodged. Financial and dietary discipline, unlocked.`,
  (total, cals) => `Net savings: ₹${total}. Calories avoided: ~${cals}. Somehow still a win.`,
  (total, cals) => `₹${total} richer, ~${cals} calories lighter, 100% still craving it.`,
  (total, cals) => `Spent ₹0 of a possible ₹${total}. Burned 0 of a possible ~${cals} calories. Peak efficiency.`,
];

function buildShareText(order) {
  const restaurant = order.restaurant_name || order.restaurant?.name || "somewhere";
  const total = order.total_amount ?? order.totalAmount ?? 0;
  const calories = Math.max(50, Math.round(total * 2.2));
  const savingsLine = SAVINGS_LINES[new Date().getMinutes() % SAVINGS_LINES.length](total, calories);

  return [
    `🛵 Just "ordered" from ${restaurant} on FakeCraving.`,
    "",
    savingsLine,
    "",
    "This order will never arrive. That's the whole point.",
    "",
    "Try it yourself → fakecraving.com",
  ].join("\n");
}

export default function ShareCard({ order }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const text = buildShareText(order);
      if (navigator.share) {
        await navigator.share({ title: "FakeCraving", text, url: "https://fakecraving.com" });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // AbortError fires when the user just closes the native share sheet — not a real failure.
      if (err.name !== "AbortError") throw err;
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-aubergine dark:border-marigold text-aubergine dark:text-marigold font-semibold text-sm disabled:opacity-50"
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Copied to clipboard!" : busy ? "Sharing…" : "Share this fake order"}
    </button>
  );
}
