"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { profile } from "@/lib/profile";
import { sendMessage } from "@/app/contact/action";

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(sendMessage, {
    status: "idle",
    error: null,
  });
  const [messageLength, setMessageLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form and counter after a terminal status so the pilot can send
  // another signal without stale values lingering.
  useEffect(() => {
    if (state.status === "sent" || state.status === "error") {
      formRef.current?.reset();
      setMessageLength(0);
    }
  }, [state.status]);

  const sending = isPending;

  return (
    <form ref={formRef} action={formAction} className="signal-form" aria-busy={sending}>
      <div className="signal-form__row" aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <label htmlFor="signal-company">Company</label>
        <input id="signal-company" name="company" autoComplete="off" tabIndex={-1} placeholder="Company" />
      </div>
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
        <textarea
          id="signal-message"
          name="message"
          rows={4}
          minLength={10}
          maxLength={4000}
          placeholder="What are we building? (10+ characters)"
          required
          aria-describedby="signal-message-count"
          onChange={(event) => {
            setMessageLength(event.currentTarget.value.length);
          }}
        />
        <small id="signal-message-count" className="signal-form__count" aria-live="off">
          {messageLength}/4000
        </small>
      </div>
      <button type="submit" disabled={sending}>
        {sending ? "Transmitting…" : "Transmit signal"}
        <span aria-hidden="true">↗</span>
      </button>
      {state.status === "sent" && (
        <p className="signal-form__status" data-tone="success" role="status">
          Signal received. I&apos;ll reply to {profile.responseWindow.toLowerCase()}.
        </p>
      )}
      {state.status === "error" && (
        <p className="signal-form__status" data-tone="error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
