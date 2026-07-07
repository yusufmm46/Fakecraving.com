import { useState } from "react";
import { Share2 } from "lucide-react";

const W = 1080;
const H = 1350;

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cursorY);
  return cursorY;
}

async function renderCard(order) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#3E1A45");
  gradient.addColorStop(1, "#241A1D");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#F2A93B";
  ctx.font = "700 56px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("FakeCraving", 70, 140);

  ctx.fillStyle = "#FFF8EC";
  ctx.font = "600 44px 'Segoe UI', Arial, sans-serif";
  wrapText(ctx, `I "ordered" from ${order.restaurant_name || order.restaurant?.name}`, 70, 260, W - 140, 56);

  ctx.font = "400 32px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#FFF8EC";
  let y = 400;
  const items = order.items || [];
  items.slice(0, 6).forEach((item) => {
    ctx.fillText(`${item.qty}× ${item.name}`, 70, y);
    y += 50;
  });

  ctx.fillStyle = "#F2A93B";
  ctx.font = "700 40px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`₹${order.total_amount ?? order.totalAmount ?? 0} · never delivered`, 70, y + 40);

  ctx.strokeStyle = "rgba(193,63,46,0.7)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.strokeRect(60, H - 320, W - 120, 200);
  ctx.setLineDash([]);
  ctx.fillStyle = "#C13F2E";
  ctx.font = "700 34px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Honesty box", 90, H - 260);
  ctx.fillStyle = "#FFF8EC";
  ctx.font = "400 28px 'Segoe UI', Arial, sans-serif";
  wrapText(ctx, "This order will never arrive. That's the whole point.", 90, H - 210, W - 260, 38);

  ctx.fillStyle = "rgba(255,248,236,0.5)";
  ctx.font = "400 26px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Order anything. Pay nothing. Feel everything.", 70, H - 60);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function ShareCard({ order }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await renderCard(order);
      const file = new File([blob], "fakecraving-order.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "FakeCraving",
          text: "I just ordered nothing on FakeCraving 🛵",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fakecraving-order.png";
        a.click();
        URL.revokeObjectURL(url);
      }
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
      <Share2 size={16} />
      {busy ? "Generating share card…" : "Share this fake order"}
    </button>
  );
}
