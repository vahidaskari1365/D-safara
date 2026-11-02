import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "ds_session";

export type SessionUser = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  avatar: string | null;
  email: string | null;
  bio: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const uid = store.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  const user = await db.user.findUnique({
    where: { id: uid },
    select: { id: true, name: true, phone: true, role: true, avatar: true, email: true, bio: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

export function requireRole(user: SessionUser | null, roles: string[]) {
  if (!user || !roles.includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  return null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
