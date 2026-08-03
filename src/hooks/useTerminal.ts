"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { executeCommand, getAutocomplete, getPrompt, isPageCommand } from "@/lib/commands";
import type { CommandResult, CommandContext } from "@/lib/commands";

export interface HistoryLine {
  id: number;
  type: "input" | "output";
  content?: string;
  results?: CommandResult[];
}

export interface MailForm {
  visible: boolean;
  to: string;
  subject: string;
  message: string;
  sent: boolean;
}

export interface AskPrompt {
  prompt: string;
  masked: boolean;
}

interface UseTerminalOptions {
  pageRoutes?: Record<string, string>;
  autoBoot?: boolean;
}

export function useTerminal(options: UseTerminalOptions = {}) {
  const router = useRouter();
  const { pageRoutes = {}, autoBoot = false } = options;

  const [lines, setLines] = useState<HistoryLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [suggestion, setSuggestion] = useState("");
  const [booted, setBooted] = useState(autoBoot);
  const [isBusy, setIsBusy] = useState(false);
  const [ask, setAsk] = useState<AskPrompt | null>(null);
  const [askInput, setAskInput] = useState("");
  const [mailForm, setMailForm] = useState<MailForm>({ visible: false, to: "", subject: "", message: "", sent: false });

  const inputRef = useRef<HTMLInputElement>(null);
  const askInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lineIdRef = useRef(0);
  const busyRef = useRef(false);
  const cancelledRef = useRef(false);
  const activeLineRef = useRef<number | null>(null);
  const askResolverRef = useRef<((v: string) => void) | null>(null);
  const sleepTimersRef = useRef<number[]>([]);

  const prompt = getPrompt();

  const appendToActive = useCallback((result: CommandResult) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === activeLineRef.current ? { ...l, results: [...(l.results || []), result] } : l
      )
    );
  }, []);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [lines, mailForm, ask]);

  useEffect(() => {
    return () => {
      sleepTimersRef.current.forEach((t) => window.clearTimeout(t));
      askResolverRef.current?.("");
    };
  }, []);

  const addOutput = useCallback((results: CommandResult[]) => {
    setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results }]);
  }, []);

  const clearScreen = useCallback(() => {
    setLines([]);
    busyRef.current = false;
    setIsBusy(false);
    cancelledRef.current = true;
    sleepTimersRef.current.forEach((t) => window.clearTimeout(t));
    sleepTimersRef.current = [];
    askResolverRef.current?.("");
    askResolverRef.current = null;
    setAsk(null);
  }, []);

  const runCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    if (busyRef.current) {
      addOutput([{ text: " (shell is busy — press ctrl+c to interrupt)", color: "#ffffff40" }]);
      return;
    }

    const first = trimmed.split(/\s+/)[0].toLowerCase();
    if (isPageCommand(first) && first !== "help") {
      setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "input", content: trimmed }]);
      setHistory((prev) => [...prev, trimmed]);
      setHistoryIdx(-1);
      setInput("");
      setSuggestion("");
      const route = pageRoutes[first] || `/${first}`;
      router.push(route);
      return;
    }

    setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "input", content: trimmed }]);
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);
    setInput("");
    setSuggestion("");

    const outputLineId = ++lineIdRef.current;
    activeLineRef.current = outputLineId;
    setLines((prev) => [...prev, { id: outputLineId, type: "output", results: [] }]);

    busyRef.current = true;
    setIsBusy(true);
    cancelledRef.current = false;

    const ctx: CommandContext = {
      push: (r) => appendToActive(r),
      sleep: (ms) =>
        new Promise<void>((resolve) => {
          const id = window.setTimeout(() => {
            sleepTimersRef.current = sleepTimersRef.current.filter((t) => t !== id);
            resolve();
          }, ms);
          sleepTimersRef.current.push(id);
        }),
      ask: (promptText, opts) =>
        new Promise<string>((resolve) => {
          askResolverRef.current = resolve;
          setAsk({ prompt: promptText, masked: !!opts?.masked });
          setAskInput(opts?.default ?? "");
          window.setTimeout(() => askInputRef.current?.focus(), 0);
        }),
      isCancelled: () => cancelledRef.current,
    };

    try {
      const results = await executeCommand(trimmed, ctx);

      if (results.length === 1 && results[0].text === "__CLEAR__") {
        setLines([]);
        activeLineRef.current = null;
        return;
      }

      const mailResult = results.find((r) => r.text.includes("__MAIL_FORM__:"));
      if (mailResult) {
        const jsonStr = mailResult.text.split("__MAIL_FORM__:")[1];
        try {
          const data = JSON.parse(jsonStr);
          setMailForm({ visible: true, to: data.to, subject: data.subject, message: "", sent: false });
        } catch {
          /* ignore */
        }
        const clean = results.filter((r) => !r.text.includes("__MAIL_FORM__:"));
        if (clean.length > 0) appendToActive(clean[clean.length - 1]);
        return;
      }

      if (results.length > 0) {
        setLines((prev) =>
          prev.map((l) =>
            l.id === outputLineId ? { ...l, results: [...(l.results || []), ...results] } : l
          )
        );
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
      activeLineRef.current = null;
    }
  }, [router, pageRoutes, addOutput, appendToActive]);

  const submitAsk = useCallback(() => {
    const resolver = askResolverRef.current;
    if (!resolver) return;
    const value = askInput;
    askResolverRef.current = null;
    setAsk(null);
    setAskInput("");
    setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [{ text: ask && ask.masked ? " " + "•".repeat(value.length) : ` ${value}`, color: ask && ask.masked ? "#ffffff60" : "white" }] }]);
    resolver(value);
  }, [ask, askInput]);

  const cancelRunning = useCallback(() => {
    if (busyRef.current) {
      cancelledRef.current = true;
      sleepTimersRef.current.forEach((t) => window.clearTimeout(t));
      sleepTimersRef.current = [];
    }
    if (askResolverRef.current) {
      askResolverRef.current("");
      askResolverRef.current = null;
      setAsk(null);
      setAskInput("");
    }
    busyRef.current = false;
    setIsBusy(false);
    activeLineRef.current = null;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      if (busyRef.current || askResolverRef.current) {
        cancelRunning();
        setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [{ text: " ^C", color: "#ff4af0" }] }]);
      } else {
        setInput("");
        setSuggestion("");
      }
      return;
    }
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      clearScreen();
      return;
    }

    if (e.key === "Escape") {
      if (askResolverRef.current) {
        cancelRunning();
        setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [{ text: " ^C", color: "#ff4af0" }] }]);
        return;
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (askResolverRef.current) {
        submitAsk();
      } else {
        runCommand(input);
      }
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestion) {
        setInput(suggestion);
        setSuggestion("");
      } else if (input.trim()) {
        const candidates = getAutocomplete(input);
        if (candidates.length === 1) {
          setInput(candidates[0]);
        } else if (candidates.length > 1) {
          setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [{ text: ` ${candidates.join("   ")}`, color: "#ffffff60" }] }]);
        }
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    }
  }, [input, history, historyIdx, suggestion, runCommand, submitAsk, cancelRunning, clearScreen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.trim()) {
      const candidates = getAutocomplete(val);
      if (candidates.length === 1) {
        setSuggestion(candidates[0].startsWith(val.trim()) ? candidates[0] : "");
      } else {
        setSuggestion("");
      }
    } else setSuggestion("");
  }, []);

  const handleAskKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAsk();
      return;
    }
    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      cancelRunning();
      setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [{ text: " ^C", color: "#ff4af0" }] }]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelRunning();
      setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [{ text: " ^C", color: "#ff4af0" }] }]);
    }
  }, [submitAsk, cancelRunning]);

  const handleMailSend = useCallback(() => {
    setMailForm((prev) => ({ ...prev, sent: true }));
    setLines((prev) => [...prev, { id: ++lineIdRef.current, type: "output", results: [
      { text: "", color: "white" },
      { text: " ┌─ Message Sent ──────────────────────────────", color: "#4af0ff" },
      { text: "", color: "white" },
      { text: `   To:      ${mailForm.to}`, color: "white" },
      { text: `   Subject: ${mailForm.subject}`, color: "white" },
      { text: `   Message: ${mailForm.message.slice(0, 60)}${mailForm.message.length > 60 ? "..." : ""}`, color: "white" },
      { text: "", color: "white" },
      { text: "   ✓ Delivered.", color: "#ffd700" },
      { text: "", color: "white" },
      { text: " └──────────────────────────────────────────", color: "#4af0ff" },
      { text: "", color: "white" },
    ]}]);
    window.setTimeout(() => setMailForm({ visible: false, to: "", subject: "", message: "", sent: false }), 200);
  }, [mailForm]);

  const cancelMail = useCallback(() => {
    setMailForm({ visible: false, to: "", subject: "", message: "", sent: false });
  }, []);

  return {
    lines,
    input,
    setInput,
    history,
    historyIdx,
    suggestion,
    booted,
    setBooted,
    isBusy,
    ask,
    askInput,
    setAskInput,
    mailForm,
    setMailForm,
    prompt,
    inputRef,
    askInputRef,
    containerRef,
    handleKeyDown,
    handleInputChange,
    handleAskKeyDown,
    runCommand,
    addOutput,
    clearScreen,
    cancelRunning,
    submitAsk,
    handleMailSend,
    cancelMail,
  };
}
