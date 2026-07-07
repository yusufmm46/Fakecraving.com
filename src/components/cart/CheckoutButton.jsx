export default function CheckoutButton({ onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3.5 rounded-full bg-chili text-white font-display font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
    >
      {loading ? "Placing your fake order…" : "Place fake order"}
    </button>
  );
}
