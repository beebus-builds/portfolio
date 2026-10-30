"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ACCENTS, fleet } from "@/lib/fleetStore";

/**
 * Cheer Park comms: the fleet-wide chat channel. One panel, toggled with X or
 * the HUD button — callsign and ship colour on top, the rolling log in the
 * middle, transmit bar at the bottom. Local notices ("warped in", rate-limit
 * notes) render as centered system lines.
 */

export default function Comms({ open, onClose }: { open: boolean; onClose: () => void }) {
  const messages = useSyncExternalStore(fleet.subscribe, fleet.getMessages);
  const online = useSyncExternalStore(fleet.subscribe, fleet.getOnline);
  const inPark = useSyncExternalStore(fleet.subscribe, fleet.getInPark);
  const callsign = useSyncExternalStore(fleet.subscribe, fleet.getCallsign);
  const accent = useSyncExternalStore(fleet.subscribe, fleet.getAccent);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const result = await fleet.sendChat(text);
    if (result === "limited") fleet.systemNote("Comms cooling down — a few seconds between transmissions.");
    if (result === "error") fleet.systemNote("Transmission lost — try again.");
    setSending(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="comms"
          role="dialog"
          aria-label="Pilot comms channel"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18 } }}
        >
          <header className="comms__head">
            <b>COMMS{inPark ? " · CHEER PARK" : ""}</b>
            <span className="comms__online">{online} ONLINE</span>
            <button type="button" onClick={onClose} aria-label="Close comms">
              ✕
            </button>
          </header>

          <div className="comms__meta">
            <input
              className="comms__callsign"
              value={callsign}
              onChange={(event) => fleet.setCallsign(event.target.value)}
              maxLength={24}
              aria-label="Your callsign"
              placeholder="Callsign"
            />
            <div className="comms__accents" role="group" aria-label="Ship accent colour">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{ background: color }}
                  className={accent === color ? "is-active" : undefined}
                  aria-label={`Ship colour ${color}`}
                  aria-pressed={accent === color}
                  onClick={() => fleet.setAccent(color)}
                />
              ))}
            </div>
          </div>

          <div className="comms__log" ref={logRef}>
            {messages.map((message) => (
              <p
                key={message.id}
                data-mine={message.mine || undefined}
                data-system={message.system || undefined}
              >
                {message.system
                  ? message.body
                  : `${message.mine ? "You" : message.callsign}: ${message.body}`}
              </p>
            ))}
            {messages.length === 0 && (
              <p data-system>Channel quiet. Say hello — every pilot on the deck hears this.</p>
            )}
          </div>

          <form
            className="comms__form"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={280}
              placeholder="Transmit to the fleet…"
              aria-label="Message the fleet"
            />
            <button type="submit" disabled={sending}>
              Send
            </button>
          </form>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
