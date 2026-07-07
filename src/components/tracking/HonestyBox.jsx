const MESSAGES = [
  "This order, like all your others here, will never arrive. That's the whole point.",
  "There is no scooter. There was never a scooter. You knew this.",
  "The craving passed. That was the delivery.",
];

export default function HonestyBox() {
  const message = MESSAGES[new Date().getMinutes() % MESSAGES.length];

  return (
    <div className="honesty-box px-5 py-4 space-y-1">
      <p className="font-display font-semibold text-chili text-sm">Honesty box</p>
      <p className="text-sm text-ink dark:text-ivory">{message}</p>
    </div>
  );
}
