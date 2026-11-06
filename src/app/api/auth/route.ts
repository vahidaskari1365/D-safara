import { db } from "@/lib/db";
import { createSession, getSessionUser, revokeSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/auth -> current session user */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  const unreadNotifications = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });
  const unreadMessages = await db.message.count({
    where: { receiverId: user.id, readAt: null },
  });
  return NextResponse.json({ user, unreadNotifications, unreadMessages });
}

/**
 * POST /api/auth
 * actions: request-otp | verify-otp | logout | update-profile
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if ((action === "request-otp" || action === "verify-otp") && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "ورود واقعی هنوز پیکربندی نشده است؛ کد نمایشی در محیط عملیاتی غیرفعال است." }, { status: 503 });
  }

  if (action === "request-otp") {
    const phone: string = typeof body.phone === "string" ? body.phone.replace(/\s/g, "") : "";
    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "شماره موبایل معتبر نیست (مثال: 09123456789)" }, { status: 400 });
    }
    const recent = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (recent && Date.now() - recent.createdAt.getTime() < 30_000) return NextResponse.json({ error: "برای درخواست مجدد کمی صبر کنید." }, { status: 429 });
    await db.otpCode.updateMany({ where: { phone, used: false }, data: { used: true } });
    const code = String(randomInt(100000, 1000000));
    await db.otpCode.create({
      data: { phone, code, expiresAt: new Date(Date.now() + 3 * 60000) },
    });
    // Demo mode: return the code so it can be shown in the UI (no SMS gateway in sandbox)
    return NextResponse.json({ ok: true, devCode: code, message: "کد آزمایشی تولید شد؛ پیامکی ارسال نشده است." });
  }

  if (action === "verify-otp") {
    const phone = typeof body.phone === "string" ? body.phone.replace(/\s/g, "") : "";
    const code = String(body.code || "");
    if (!/^09\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "شماره یا کد معتبر نیست" }, { status: 400 });
    const otp = await db.otpCode.findFirst({ where: { phone, used: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (!otp || (otp.attempts || 0) >= 5) return NextResponse.json({ error: "کد وارد شده اشتباه یا منقضی شده است" }, { status: 400 });
    if (otp.code !== code) {
      await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "کد وارد شده اشتباه یا منقضی شده است" }, { status: 400 });
    }
    await db.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    let user = await db.user.findUnique({ where: { phone } });
    const isNew = !user;
    if (!user) {
      user = await db.user.create({
        data: { phone, name: body.name || `کاربر ${phone.slice(-4)}`, role: "STUDENT" },
      });
      await db.wallet.create({ data: { userId: user.id } });
      await db.notification.create({
        data: { userId: user.id, title: "به دی‌صفارا خوش آمدید 🎉", body: "مسیر یادگیری خود را شروع کنید؛ اولین درس هر دوره رایگان است." },
      });
    }

    const res = NextResponse.json({
      ok: true,
      isNew,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar },
    });
    res.cookies.set(SESSION_COOKIE, createSession(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  if (action === "logout") {
    revokeSession(req.cookies.get(SESSION_COOKIE)?.value);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return res;
  }

  if (action === "update-profile") {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
    const data: { name?: string; email?: string | null; bio?: string; avatar?: string } = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.email === "string") data.email = body.email.trim() || null;
    if (typeof body.bio === "string") data.bio = body.bio;
    if (typeof body.avatar === "string") data.avatar = body.avatar;
    const updated = await db.user.update({ where: { id: me.id }, data });
    return NextResponse.json({ ok: true, user: updated });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
