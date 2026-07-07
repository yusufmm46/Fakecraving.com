import { useState } from "react";
import { Heart, X } from "lucide-react";
import QRCode from "react-qr-code";

// Replace with the project's real UPI VPA before launch.
const DONATE_VPA = import.meta.env.VITE_DONATE_UPI_ID || "fakecraving@upi";
const PRESET_AMOUNTS = [49, 99, 199];

function upiLink(amount) {
  const params = new URLSearchParams({
    pa: DONATE_VPA,
    pn: "FakeCraving",
    cu: "INR",
    ...(amount ? { am: String(amount) } : {}),
    tn: "Support FakeCraving",
  });
  return `upi://pay?${params}`;
}

export default function DonateButton({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(PRESET_AMOUNTS[1]);
  const link = upiLink(amount);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-chili/10 text-chili text-sm font-semibold hover:bg-chili/15 transition-colors ${className}`}
      >
        <Heart size={16} />
        Donate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full sm:w-96 bg-ivory dark:bg-aubergine rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-aubergine dark:text-ivory">
                Support FakeCraving
              </h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-ink/70 dark:text-ivory/70">
              No pressure — this site runs on vibes and goodwill, not revenue. Scan to donate via
              any UPI app, or tap Pay on mobile.
            </p>

            <div className="flex gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    amount === a
                      ? "bg-marigold border-marigold text-aubergine"
                      : "border-aubergine/20 dark:border-ivory/20 text-aubergine dark:text-ivory"
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex justify-center bg-white p-4 rounded-xl">
              <QRCode value={link} size={180} />
            </div>

            <a
              href={link}
              className="sm:hidden block text-center w-full py-2.5 rounded-lg bg-chili text-ivory font-semibold text-sm"
            >
              Pay ₹{amount} via UPI
            </a>
          </div>
        </div>
      )}
    </>
  );
}
