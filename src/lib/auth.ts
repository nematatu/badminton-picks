import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const OWNER_COOKIE_NAME = "bp_owner_token";

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateOwnerHash(c: Context): Promise<{ token: string; hash: string }> {
  let token = getCookie(c, OWNER_COOKIE_NAME);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = generateToken();
    const isHttps = c.req.url.startsWith("https://");
    setCookie(c, OWNER_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  const hash = await hashToken(token);
  return { token, hash };
}

export async function getOwnerHash(c: Context): Promise<string | null> {
  const token = getCookie(c, OWNER_COOKIE_NAME);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return await hashToken(token);
}
