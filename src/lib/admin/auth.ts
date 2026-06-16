import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signToken, verifyToken } from "./auth-token";

const COOKIE = "ka_admin";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 vrk

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET puuttuu.");
  return s;
}

export async function setSessionCookie(): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_S * 1000;
  const jar = await cookies();
  jar.set(COOKIE, signToken(expiresAt, secret()), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return Boolean(token && verifyToken(token, secret(), Date.now()));
}

/** Server-puolen portti: redirectaa /kirjaudu jos ei kirjautunut. */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/kirjaudu");
}
