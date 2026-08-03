"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTerminal } from "@/hooks/useTerminal";

const PAGE_ROUTES: Record<string, string> = {
  about: "/about",
  projects: "/projects",
  skills: "/skills",
  contact: "/contact",
  education: "/education",
  nepal: "/nepal",
  namaste: "/namaste",
  whoami: "/whoami",
};

export default function FloatingTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [booted, setBooted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [callStage, setCallStage] = useState<"idle" | "connecting" | "waiting" | "connected" | "error">("idle");
  const [callError, setCallError] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const t = useTerminal({ pageRoutes: PAGE_ROUTES });

  // ─── Boot ─────────────────────────────────────────────────────

  useEffect(() => {
    t.addOutput([
      { text: "⚡ Floating terminal ready. Type `help` to start.", color: "#4af0ff" },
      { text: "", color: "white" },
    ]);
    setBooted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Open / close ─────────────────────────────────────────────

  const toggleOpen = useCallback(() => {
    if (isMinimized && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      window.setTimeout(() => t.inputRef.current?.focus(), 100);
    } else if (!isMinimized && isOpen) {
      setIsMinimized(true);
    } else {
      setIsOpen(false);
      setIsMinimized(true);
    }
  }, [isMinimized, isOpen, t.inputRef]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (t.mailForm.visible) { t.cancelMail(); return; }
      if (isOpen && !isMinimized) { setIsMinimized(true); return; }
      return;
    }
    t.handleKeyDown(e);
  }, [t, isOpen, isMinimized]);

  // ─── WebRTC Call ─────────────────────────────────────────────

  const startCall = async (type: "audio" | "video") => {
    setCallType(type);
    setCallStage("connecting");
    setCallError("");
    setShowCallModal(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      let wsUrl = "ws://localhost:8001";
      try {
        const tunnelRes = await fetch("http://localhost:3001/api/ngrok-tunnel", { cache: "no-store" });
        if (tunnelRes.ok) {
          const tunnelData = await tunnelRes.json();
          if (tunnelData.wsUrl) {
            wsUrl = tunnelData.wsUrl.replace(/^https/, "wss");
          } else if (tunnelData.tunnels) {
            const tcpTunnel = (tunnelData.tunnels as { proto: string; config?: { addr?: string }; public_url: string }[]).find((tun) => tun.proto === "https" && /tcp/i.test(tun.config?.addr || ""));
            if (tcpTunnel) wsUrl = tcpTunnel.public_url.replace(/^https/, "wss");
          }
        }
      } catch { /* fallback to localhost */ }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStage("connected");
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
        }
      };

      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);
          switch (data.type) {
            case "visitor_ready":
              setCallStage("waiting");
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
              break;
            case "offer":
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: "answer", sdp: pc.localDescription }));
              break;
            case "answer":
              if (data.sdp) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              break;
            case "candidate":
              if (data.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              break;
            case "peer_disconnected":
              cleanupCall();
              setCallStage("error");
              setCallError("Bibash disconnected the call.");
              break;
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        setCallStage("error");
        setCallError("Signaling server not running.\nRun .\\run.ps1 to start everything.");
        cleanupCall();
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "register", role: "visitor" }));
        setCallStage("waiting");
      };
    } catch {
      setCallStage("error");
      setCallError("Camera/mic access denied.");
    }
  };

  const cleanupCall = () => {
    localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    wsRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const endCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_call" }));
    }
    cleanupCall();
    setShowCallModal(false);
    setCallType(null);
    setCallStage("idle");
    setCallError("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-[100] w-12 h-12 rounded-full bg-neon-400/10 border border-neon-400/30 flex items-center justify-center hover:bg-neon-400/20 transition-all shadow-lg shadow-neon-400/10"
        title="Toggle terminal"
      >
        <span className="text-neon-400 text-lg glow-neon">{isMinimized ? ">_" : "×"}</span>
      </button>

      {/* Terminal panel */}
      {isOpen && (
        <div
          className="dark-surface fixed bottom-20 right-4 z-[100] w-[380px] max-w-[calc(100vw-32px)] h-[480px] max-h-[calc(100vh-120px)] flex flex-col rounded-xl overflow-hidden border transition-all duration-300"
          style={{
            borderColor: "rgba(74, 240, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(74,240,255,0.05)",
            background: "linear-gradient(135deg, rgba(10,10,30,0.98), rgba(15,15,42,0.98))",
          }}
        >
          {/* Title bar */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5"
            style={{ background: "linear-gradient(90deg, rgba(74,240,255,0.06), transparent)" }}
          >
            <span className="text-[10px] font-mono text-neon-400/60 tracking-wider">Floating Terminal</span>
            <div className="flex-1" />
            <span className="text-[9px] font-mono text-white/15">Esc minimises</span>
          </div>

          {/* Output */}
          <div
            ref={t.containerRef}
            className="flex-1 overflow-y-auto px-3 py-2 cursor-text"
            onClick={() => { if (!t.mailForm.visible && !t.ask) t.inputRef.current?.focus(); }}
          >
            {t.lines.map((line) => (
              <div key={line.id} className="terminal-line mb-0.5">
                {line.type === "input" ? (
                  <div className="flex items-start gap-1.5">
                    <span className="text-neon-400 shrink-0 text-xs glow-neon">{t.prompt}</span>
                    <span className="text-white/80 text-xs break-all">{line.content}</span>
                  </div>
                ) : (
                  line.results?.map((result, i) => (
                    result.text !== "" && (
                      <div key={i} className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: result.color || "inherit" }}>
                        {result.text}
                      </div>
                    )
                  ))
                )}
              </div>
            ))}

            {t.ask && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-neon-400 shrink-0 text-xs glow-neon">{t.prompt}</span>
                <span className="text-xs font-mono text-white/70 whitespace-pre-wrap">{t.ask.prompt}</span>
                <span className="text-xs font-mono text-white/90">{t.ask.masked ? "•".repeat(t.askInput.length) : t.askInput}</span>
                <span className="caret-blink text-neon-400 text-xs">▊</span>
                <input
                  ref={t.askInputRef}
                  type={t.ask.masked ? "password" : "text"}
                  value={t.askInput}
                  onChange={(e) => t.setAskInput(e.target.value)}
                  onKeyDown={t.handleAskKeyDown}
                  className="w-0 h-0 opacity-0"
                  autoFocus
                />
              </div>
            )}

            {t.mailForm.visible && !t.mailForm.sent && (
              <div className="border border-neon-400/20 rounded p-2 mt-1 mb-1" style={{ background: "rgba(10,10,30,0.95)" }}>
                <div className="text-neon-400 font-mono text-[10px] mb-2">✉ Compose</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1"><span className="text-white/40 font-mono text-[10px] w-12 shrink-0">To:</span><span className="text-white font-mono text-xs">{t.mailForm.to}</span></div>
                  <div className="flex items-center gap-1"><span className="text-white/40 font-mono text-[10px] w-12 shrink-0">Subj:</span><span className="text-white font-mono text-xs">{t.mailForm.subject || "(none)"}</span></div>
                  <textarea value={t.mailForm.message} onChange={(e) => t.setMailForm((p) => ({ ...p, message: e.target.value }))}
                    className="bg-terminal-900 border border-white/10 rounded text-white font-mono text-xs p-1.5 outline-none focus:border-neon-400/40 resize-none h-16"
                    placeholder="Message..." autoFocus />
                  <div className="flex justify-end gap-1.5 mt-1">
                    <button onClick={t.cancelMail}
                      className="px-2 py-0.5 text-[10px] font-mono text-white/40 border border-white/10 rounded">Cancel</button>
                    <button onClick={t.handleMailSend}
                      className="px-2 py-0.5 text-[10px] font-mono text-neon-400 border border-neon-400/40 rounded">Send</button>
                  </div>
                </div>
              </div>
            )}

            {booted && !t.mailForm.visible && !t.ask && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-neon-400 shrink-0 text-xs glow-neon">{t.prompt}</span>
                <div className="relative flex-1 min-w-0">
                  {t.suggestion && !t.input.endsWith(" ") && (
                    <span className="absolute left-0 top-0 text-xs text-white/10 pointer-events-none font-mono">{t.input}{t.suggestion.slice(t.input.trim().length)}</span>
                  )}
                  <input ref={t.inputRef} type="text" value={t.input} onChange={t.handleInputChange} onKeyDown={handleInputKeyDown}
                    className="w-full bg-transparent border-none outline-none text-white/80 text-xs font-mono caret-neon-400" spellCheck={false} autoComplete="off" />
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-t border-white/5">
            <button onClick={() => startCall("audio")}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-white/40 border border-white/10 rounded hover:text-green-400 hover:border-green-400/30 transition-all">
              📞 Call
            </button>
            <button onClick={() => startCall("video")}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-white/40 border border-white/10 rounded hover:text-neon-400 hover:border-neon-400/30 transition-all">
              📹 Video
            </button>
            <div className="flex-1" />
            <span className="text-[9px] font-mono text-white/10">
              {t.isBusy ? "[busy]" : "help → commands"}
            </span>
          </div>
        </div>
      )}

      {/* Call modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="dark-surface relative w-[520px] max-w-[calc(100vw-32px)] border border-white/10 rounded-xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(10,10,30,0.98), rgba(15,15,42,0.98))" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-mono text-neon-400 tracking-wider">
                {callType === "audio" ? "📞 Call Bibash" : "📹 Video Call Bibash"}
              </span>
              <button onClick={endCall} className="text-white/40 hover:text-white text-xs font-mono">×</button>
            </div>

            {callStage === "connecting" && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4 animate-pulse">📡</div>
                <p className="text-sm font-mono text-white/70">Connecting to server...</p>
              </div>
            )}

            {callStage === "waiting" && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">{callType === "audio" ? "📞" : "📹"}</div>
                <p className="text-sm font-mono text-white/70 mb-2">Waiting for Bibash to answer...</p>
                <div className="flex justify-center gap-1 mb-2">
                  <span className="w-2 h-2 rounded-full bg-neon-400/60 animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 rounded-full bg-neon-400/60 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 rounded-full bg-neon-400/60 animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
                <p className="text-[10px] font-mono text-white/20">Make sure Bibash has /call-agent open</p>
                <div className="flex justify-center mt-4">
                  <button onClick={endCall}
                    className="px-4 py-1.5 text-xs font-mono text-white/40 border border-white/10 rounded-lg hover:text-white/60 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {callStage === "connected" && (
              <div className="p-3">
                {callType === "video" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-44 rounded-lg bg-terminal-900 object-cover border border-white/5" />
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-44 rounded-lg bg-terminal-900 object-cover border border-white/5" />
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-5xl mb-3">📞</div>
                    <p className="text-sm font-mono text-green-400/80 mb-1">Connected with Bibash</p>
                    <div className="flex justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500/60 animate-ping" />
                      <span className="text-[10px] font-mono text-green-500/40 ml-1">Live</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-center mt-3">
                  <button onClick={endCall}
                    className="px-5 py-1.5 text-xs font-mono text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-all">
                    End Call
                  </button>
                </div>
              </div>
            )}

            {callStage === "error" && (
              <div className="p-8 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <p className="text-xs font-mono text-red-400/80 leading-relaxed">{callError}</p>
                <div className="flex justify-center gap-3 mt-4">
                  <button onClick={endCall}
                    className="px-4 py-1.5 text-xs font-mono text-white/50 border border-white/10 rounded-lg hover:bg-white/5 transition-all">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
