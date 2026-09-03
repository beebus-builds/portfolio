import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE_NAME = "session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set — add it to .env.local and restart the server.");
  }
  return new TextEncoder().encode(secret);
}

export async function login(password: string) {
  const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || "");
  if (!isValid) return false;

  const session = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecret());

  (await cookies()).set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return true;
}

export async function verifySession() {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
