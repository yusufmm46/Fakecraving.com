import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { isValidEmail, submitContactForm } from "../lib/contact";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", honeypot: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(form.email)) next.email = "That doesn't look like a valid email.";
    if (!form.message.trim()) next.message = "Tell us something first.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.honeypot) return; // silently drop bot submissions
    if (!validate()) return;

    setStatus("sending");
    try {
      await submitContactForm(form);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (status === "sent") {
    return (
      <div className="pb-10">
        <TopBar title="Contact" showBack />
        <div className="px-4 sm:px-6 pt-16 max-w-lg mx-auto text-center space-y-3">
          <CheckCircle2 size={40} className="mx-auto text-curry" />
          <p className="font-display text-lg font-semibold text-ink dark:text-ivory">
            Message sent. Unlike your food, this one will actually arrive. 📬
          </p>
          <p className="text-sm text-ink/60 dark:text-ivory/60">
            We'll get back to you soon — probably faster than your fake scooter ever would.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <TopBar title="Contact" showBack />

      <div className="px-4 sm:px-6 pt-6 max-w-lg mx-auto space-y-5">
        <div>
          <p className="font-display text-xl font-semibold text-ink dark:text-ivory">
            Get in touch
          </p>
          <p className="text-sm text-ink/60 dark:text-ivory/60 mt-1">
            Questions, feedback, or just want to say the honesty box made you laugh? Send it over.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink dark:text-ivory mb-1">
              Name <span className="text-ink/40 dark:text-ivory/40 font-normal">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={update("name")}
              className="w-full px-3 py-2.5 rounded-lg border border-aubergine/20 dark:border-ivory/20 bg-transparent text-sm outline-none focus:ring-2 focus:ring-marigold/50"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink dark:text-ivory mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              className="w-full px-3 py-2.5 rounded-lg border border-aubergine/20 dark:border-ivory/20 bg-transparent text-sm outline-none focus:ring-2 focus:ring-marigold/50"
            />
            {errors.email && <p className="text-xs text-chili mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-ink dark:text-ivory mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={form.message}
              onChange={update("message")}
              className="w-full px-3 py-2.5 rounded-lg border border-aubergine/20 dark:border-ivory/20 bg-transparent text-sm outline-none focus:ring-2 focus:ring-marigold/50 resize-none"
            />
            {errors.message && <p className="text-xs text-chili mt-1">{errors.message}</p>}
          </div>

          {/* Honeypot: hidden from real users via off-screen positioning (not
              display:none, which some bots detect and skip filling). */}
          <input
            type="text"
            name="website"
            value={form.honeypot}
            onChange={update("honeypot")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] w-px h-px overflow-hidden"
          />

          {status === "error" && (
            <p className="text-sm text-chili bg-chili/10 rounded-xl px-4 py-3">
              Couldn't send that — {errorMessage} Try again in a bit?
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-aubergine text-ivory font-display font-semibold text-sm disabled:opacity-50"
          >
            <Mail size={16} />
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
