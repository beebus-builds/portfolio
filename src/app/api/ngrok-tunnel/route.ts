import { NextResponse } from "next/server";

interface TunnelConfig {
  addr?: string;
}

interface Tunnel {
  proto: string;
  public_url: string | null;
  config?: TunnelConfig;
}

export async function GET() {
  try {
    const res = await fetch("http://localhost:4040/api/tunnels", {
      cache: "no-store",
    });
    const data: { tunnels?: Tunnel[] } = await res.json();
    const tunnels = data.tunnels || [];

    const httpTunnel = tunnels.find(
      (t) => t.proto === "https" && t.config?.addr?.startsWith("http")
    );
    const tcpTunnel = tunnels.find(
      (t) => t.proto === "https" && t.config?.addr?.startsWith("tcp")
    );

    return NextResponse.json({
      webUrl: httpTunnel?.public_url || null,
      wsUrl: tcpTunnel?.public_url || null,
      tunnels: tunnels.map((t) => ({
        proto: t.proto,
        url: t.public_url,
        addr: t.config?.addr,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "ngrok not running" },
      { status: 503 }
    );
  }
}