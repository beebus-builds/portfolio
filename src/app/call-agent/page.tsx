"use client";

import { useState, useRef, useEffect } from "react";

type Status = "idle" | "connecting" | "ringing" | "connected" | "error";

export default function CallAgentPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = async () => {
    setStatus("connecting");
    setErrorMsg("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      let wsUrl = "ws://localhost:8001";
      try {
        const tunnelRes = await fetch("http://localhost:3001/api/ngrok-tunnel", { cache: "no-store" });
        if (tunnelRes.ok) {
          const tunnelData = await tunnelRes.json();
          if (tunnelData.wsUrl) {
            wsUrl = tunnelData.wsUrl.replace(/^https/, "wss");
          } else if (tunnelData.tunnels) {
            const tcpTunnel = (tunnelData.tunnels as { proto: string; config?: { addr?: string }; public_url: string }[]).find((t) => t.proto === "https" && /tcp/i.test(t.config?.addr || ""));
            if (tcpTunnel) wsUrl = tcpTunnel.public_url.replace(/^https/, "wss");
          }
        }
      } catch { /* fallback to localhost */ }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
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
              setStatus("ringing");
              break;
            case "offer":
              setStatus("connected");
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
            case "end_call":
            case "peer_disconnected":
              disconnect();
              setStatus("idle");
              break;
          }
        } catch {}
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMsg("Signaling server not running.\nRun .\run.ps1 to start everything.");
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "register", role: "agent" }));
        setStatus("ringing");
      };
    } catch {
      setStatus("error");
      setErrorMsg("Camera/mic access denied.");
    }
  };

  const disconnect = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pcRef.current?.close();
    wsRef.current?.close();
    pcRef.current = null;
    wsRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const endCall = () => {
    wsRef.current?.send(JSON.stringify({ type: "end_call" }));
    disconnect();
    setStatus("idle");
  };

  // Cleanup on unmount
  useEffect(() => disconnect, []);

  return (
    <div className="min-h-screen bg-terminal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg border border-white/10 rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(10,10,30,0.98), rgba(15,15,42,0.98))" }}
      >
        <div className="px-4 py-3 border-b border-white/5 text-center"
          style={{ background: "linear-gradient(90deg, rgba(74,240,255,0.06), transparent, rgba(74,240,255,0.06))" }}
        >
          <span className="text-xs font-mono text-neon-400 tracking-wider">📞 Call Agent — Bibash</span>
        </div>

        <div className="p-6">
          {status === "idle" && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📞</div>
              <p className="text-sm font-mono text-white/70 mb-1">Call Agent</p>
              <p className="text-xs font-mono text-white/30 mb-5">Connect to receive calls from visitors</p>
              <button onClick={connect}
                className="px-6 py-2 text-xs font-mono text-neon-400 border border-neon-400/40 rounded-lg hover:bg-neon-400/10 transition-all">
                Go Online
              </button>
            </div>
          )}

          {status === "connecting" && (
            <div className="text-center py-10">
              <div className="text-4xl mb-4 animate-pulse">📡</div>
              <p className="text-sm font-mono text-white/70">Connecting...</p>
            </div>
          )}

          {status === "ringing" && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 animate-bounce">📞</div>
              <p className="text-sm font-mono text-green-400/80 mb-2">Online — Waiting for calls</p>
              <div className="flex justify-center gap-1 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-2 h-2 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-2 h-2 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
              <p className="text-[10px] font-mono text-white/20">A visitor will be connected when they call</p>
              <button onClick={disconnect}
                className="mt-4 px-4 py-1.5 text-xs font-mono text-white/40 border border-white/10 rounded-lg hover:text-white/60 transition-all">
                Go Offline
              </button>
            </div>
          )}

          {status === "connected" && (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-40 rounded-lg bg-terminal-900 object-cover border border-white/5" />
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-40 rounded-lg bg-terminal-900 object-cover border border-white/5" />
              </div>
              <div className="text-center mb-3">
                <span className="text-[10px] font-mono text-green-500/40 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-ping" />
                  Call in progress
                </span>
              </div>
              <div className="flex justify-center">
                <button onClick={endCall}
                  className="px-5 py-1.5 text-xs font-mono text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-all">
                  End Call
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-xs font-mono text-red-400/80 whitespace-pre-line leading-relaxed mb-4">{errorMsg}</p>
              <button onClick={() => setStatus("idle")}
                className="px-4 py-1.5 text-xs font-mono text-white/50 border border-white/10 rounded-lg hover:bg-white/5 transition-all">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
