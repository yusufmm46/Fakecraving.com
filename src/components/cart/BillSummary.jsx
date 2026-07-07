export default function BillSummary({ subtotal }) {
  return (
    <div className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-aubergine/10 dark:border-ivory/10 space-y-2">
      <h3 className="font-display font-semibold text-sm text-ink dark:text-ivory mb-1">
        Bill summary
      </h3>
      <Row label="Item total" value={`₹${subtotal}`} />
      <Row label="Delivery fee" value="₹0" hint="never happening anyway" />
      <Row label="Platform fee" value="₹0" />
      <div className="border-t border-aubergine/10 dark:border-ivory/10 pt-2 mt-2">
        <Row label="To pay" value="₹0" bold />
      </div>
      <p className="text-[11px] text-ink/40 dark:text-ivory/40 pt-1">
        Item total shown for the bit — no payment is ever collected.
      </p>
    </div>
  );
}

function Row({ label, value, hint, bold }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold text-ink dark:text-ivory" : "text-ink/60 dark:text-ivory/60"}>
        {label}
        {hint && <span className="text-ink/40 dark:text-ivory/40"> ({hint})</span>}
      </span>
      <span className={bold ? "font-semibold text-ink dark:text-ivory" : "text-ink dark:text-ivory"}>
        {value}
      </span>
    </div>
  );
}
