import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
    
    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect API mutations
  if (
    (pathname.startsWith("/api/posts") && (req.method === "POST" || req.method === "DELETE")) ||
    (pathname.startsWith("/api/uploads") && req.method === "POST")
  ) {
    const session = req.cookies.get("session")?.value;
    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    
    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/posts/:path*", "/api/uploads/:path*"],
};
