import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set — add it to .env.local and restart the server.");
  }
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get("session")?.value;
  if (!session) return false;
  try {
    await jwtVerify(session, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await hasValidSession(req))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Protect API mutations (posts, projects, uploads)
  if (
    (pathname.startsWith("/api/posts") && WRITE_METHODS.has(req.method)) ||
    (pathname.startsWith("/api/projects") && WRITE_METHODS.has(req.method)) ||
    (pathname.startsWith("/api/uploads") && req.method === "POST")
  ) {
    if (!(await hasValidSession(req))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  // Inbox reads and media library reads are admin-only (contact POST stays public)
  if (
    (pathname.startsWith("/api/contact") && req.method === "GET") ||
    (pathname.startsWith("/api/media") && req.method === "GET")
  ) {
    if (!(await hasValidSession(req))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/posts/:path*",
    "/api/projects/:path*",
    "/api/uploads/:path*",
    "/api/contact/:path*",
    "/api/media/:path*",
  ],
};
