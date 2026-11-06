import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CartItem = { type: "course" | "product"; slug: string };
// Prevent duplicate simulation effects within this single-process prototype.
// Real payments require transactional idempotency in durable storage.
const globalLocks = globalThis as typeof globalThis & { __dsPaymentLocks?: Set<string> };
const paymentLocks = globalLocks.__dsPaymentLocks ?? (globalLocks.__dsPaymentLocks = new Set());

/** POST /api/checkout — create order from cart & simulate payment */
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "برای خرید ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  // No real payment/ledger provider is configured. Never simulate money in production.
  if (process.env.NODE_ENV === "production" && ["create-order", "pay", "deposit"].includes(action)) {
    return NextResponse.json({ error: "پرداخت و شارژ واقعی هنوز پیکربندی نشده است." }, { status: 503 });
  }

  if (action === "create-order") {
    const items: CartItem[] = Array.isArray(body.items) ? body.items : [];
    const couponCode: string | null = typeof body.couponCode === "string" ? body.couponCode : null;
    if (!items.length || items.length > 50) return NextResponse.json({ error: "سبد خرید معتبر نیست" }, { status: 400 });
    if (items.some((item) => !item || !["course", "product"].includes(item.type) || typeof item.slug !== "string") || new Set(items.map((item) => `${item.type}:${item.slug}`)).size !== items.length) return NextResponse.json({ error: "اقلام سبد خرید معتبر نیستند" }, { status: 400 });

    let total = 0;
    const orderItems: { courseId?: string; productId?: string; title: string; price: number }[] = [];

    for (const item of items) {
      if (item.type === "course") {
        const c = await db.course.findUnique({ where: { slug: item.slug } });
        if (!c || !c.isPublished) return NextResponse.json({ error: "دوره در دسترس نیست" }, { status: 400 });
        total += c.price;
        orderItems.push({ courseId: c.id, title: c.title, price: c.price });
      } else {
        const p = await db.product.findUnique({ where: { slug: item.slug } });
        if (!p || !p.isActive) return NextResponse.json({ error: "محصول در دسترس نیست" }, { status: 400 });
        total += p.price;
        orderItems.push({ productId: p.id, title: p.title, price: p.price });
      }
    }
    if (!orderItems.length) return NextResponse.json({ error: "آیتم‌های سبد معتبر نیستند" }, { status: 400 });

    let discount = 0;
    let coupon: { id: string; code: string } | null = null;
    if (couponCode) {
      const c = await db.coupon.findUnique({ where: { code: couponCode } });
      if (c && c.isActive && c.usedCount < c.maxUses) {
        discount = Math.round((total * c.percentOff) / 100);
        coupon = { id: c.id, code: c.code };
      }
    }

    const orderNo = `DS-${Date.now().toString().slice(-6)}`;
    const order = await db.order.create({
      data: {
        orderNo,
        userId: me.id,
        totalAmount: total - discount,
        discount,
        couponCode: coupon?.code || null,
        status: "PENDING",
        items: {
          create: orderItems.map((i) => ({
            courseId: i.courseId || null,
            productId: i.productId || null,
            title: i.title,
            price: i.price,
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ ok: true, order });
  }

  if (action === "pay") {
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId) return NextResponse.json({ error: "سفارش نامعتبر است" }, { status: 400 });
    if (paymentLocks.has(orderId)) return NextResponse.json({ error: "پرداخت در حال پردازش است" }, { status: 409 });
    paymentLocks.add(orderId);
    try {
    const order = await db.order.findFirst({ where: { id: orderId, userId: me.id }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });

    if (order.status === "PAID") return NextResponse.json({ ok: true, refId: order.refId, orderNo: order.orderNo, message: "این سفارش قبلاً در محیط آزمایشی پرداخت شده است.", demo: true });
    // This payment is an isolated development simulation, never a provider confirmation.
    const refId = String(Math.floor(100000 + Math.random() * 900000));
    await db.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date(), refId },
    });

    // enroll in courses + commissions + ledger
    for (const item of order.items) {
      if (item.courseId) {
        await db.enrollment.upsert({
          where: { userId_courseId: { userId: me.id, courseId: item.courseId } },
          update: {},
          create: { userId: me.id, courseId: item.courseId },
        });
        const course = await db.course.findUnique({ where: { id: item.courseId } });
        if (course?.mentorId) {
          const commissionAmount = Math.round((item.price * 30) / 100);
          await db.commission.create({
            data: { mentorId: course.mentorId, orderId: order.id, amount: commissionAmount, percent: 30 },
          });
          await db.financialTransaction.create({
            data: { userId: course.mentorId, type: "COMMISSION", amount: commissionAmount, description: `کمیسیون فروش «${course.title}»`, refId: order.orderNo },
          });
        }
      }
      await db.financialTransaction.create({
        data: { userId: me.id, type: "PURCHASE", amount: -item.price, description: `خرید «${item.title}»`, refId: order.orderNo },
      });
    }
    if (order.couponCode) {
      await db.coupon.updateMany({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
    }

    await db.notification.create({
      data: {
        userId: me.id, title: "پرداخت موفق ✅",
        body: `پرداخت سفارش ${order.orderNo} با مبلغ ${order.totalAmount.toLocaleString("fa-IR")} تومان انجام شد.`,
        type: "PAYMENT",
      },
    });

    return NextResponse.json({ ok: true, refId, orderNo: order.orderNo, message: "پرداخت آزمایشی انجام شد؛ پولی جابه‌جا نشده است.", demo: true });
    } finally {
      paymentLocks.delete(orderId);
    }
  }

  if (action === "validate-coupon") {
    const code = String(body.code || "").trim().toUpperCase();
    const c = await db.coupon.findUnique({ where: { code } });
    if (!c || !c.isActive || c.usedCount >= c.maxUses) {
      return NextResponse.json({ ok: false, error: "کد تخفیف نامعتبر است" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, percentOff: c.percentOff, message: `کد تخفیف ${c.percentOff}٪ اعمال شد` });
  }

  if (action === "deposit") {
    const amount = Number(body.amount);
    if (!amount || amount < 100000) return NextResponse.json({ error: "حداقل مبلغ شارژ ۱۰۰,۰۰۰ تومان است" }, { status: 400 });
    await db.wallet.upsert({
      where: { userId: me.id },
      update: { balance: { increment: amount } },
      create: { userId: me.id, balance: amount },
    });
    await db.financialTransaction.create({
      data: { userId: me.id, type: "DEPOSIT", amount, description: "شارژ کیف پول (درگاه نمایشی)" },
    });
    return NextResponse.json({ ok: true, message: "شارژ آزمایشی ثبت شد؛ پولی جابه‌جا نشده است.", demo: true });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
