import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "ds_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  avatar: string | null;
  email: string | null;
  bio: string | null;
};

// This is an isolated prototype, not a replacement for the specified identity
// provider. Sessions are opaque, revocable and live only in this process. A
// durable shared session store and real identity provider are needed to deploy.
type Session = { userId: string; expiresAt: number };
const globalSessions = globalThis as typeof globalThis & { __dsSessions?: Map<string, Session> };
const sessions = globalSessions.__dsSessions ?? (globalSessions.__dsSessions = new Map());
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  for (const [key, session] of sessions) if (session.expiresAt <= now) sessions.delete(key);
  sessions.set(digest(token), { userId, expiresAt: now + SESSION_MAX_AGE * 1000 });
  return token;
}

export function revokeSession(token: string | undefined) {
  if (token) sessions.delete(digest(token));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const key = digest(token);
  const session = sessions.get(key);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) { sessions.delete(key); return null; }
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, phone: true, role: true, avatar: true, email: true, bio: true, isActive: true },
  });
  if (!user || !user.isActive) { sessions.delete(key); return null; }
  return user as SessionUser;
}

export function requireRole(user: SessionUser | null, roles: string[]) {
  if (!user || !roles.includes(user.role)) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  return null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
