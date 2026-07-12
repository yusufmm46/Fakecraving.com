const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Submits straight to Web3Forms from the browser -- no backend needed. The
// access key is meant to be public (Web3Forms' own spam/rate-limit
// protection lives server-side, not in keeping this secret), so it's fine
// as a VITE_-prefixed var even though that means it ships in the bundle.
export async function submitContactForm({ name, email, message, honeypot }) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("Contact form isn't configured yet (missing VITE_WEB3FORMS_ACCESS_KEY).");
  }

  const res = await fetch(WEB3FORMS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: "New FakeCraving inquiry",
      from_name: "FakeCraving contact form",
      name: name || "(no name given)",
      email,
      message,
      botcheck: honeypot || "",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to send message.");
  }
  return data;
}
