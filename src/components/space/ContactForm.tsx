"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { profile } from "@/lib/profile";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "The channel could not receive that message.");
      form.reset();
      setStatus("sent");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The channel could not receive that message.");
      setStatus("error");
    }
  }

  return (
    <form className="signal-form" onSubmit={handleSubmit}>
      <div className="signal-form__row">
        <label htmlFor="signal-name">Name</label>
        <input id="signal-name" name="name" autoComplete="name" maxLength={100} placeholder="Your name" required />
      </div>
      <div className="signal-form__row">
        <label htmlFor="signal-email">Email</label>
        <input id="signal-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
      </div>
      <div className="signal-form__row">
        <label htmlFor="signal-message">Message</label>
        <textarea id="signal-message" name="message" rows={4} maxLength={4000} placeholder="What are we building?" required />
      </div>
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Transmitting…" : "Transmit signal"}
        <span aria-hidden="true">↗</span>
      </button>
      {status === "sent" && (
        <p className="signal-form__status" data-tone="success" role="status">
          Signal received. I&apos;ll reply to {profile.responseWindow.toLowerCase()}.
        </p>
      )}
      {status === "error" && (
        <p className="signal-form__status" data-tone="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
