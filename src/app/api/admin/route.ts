import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const userBrief = { select: { id: true, name: true, avatar: true, role: true } };

async function requireAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") return null;
  return me;
}

/** GET /api/admin?view=... */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی فقط برای مدیر سیستم" }, { status: 403 });
  const view = req.nextUrl.searchParams.get("view") || "overview";

  if (view === "overview") {
    const [users, students, mentors, paidOrders, courses, journal, tickets, applications, enrollments] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { role: "STUDENT" } }),
        db.user.count({ where: { role: "MENTOR" } }),
        db.order.findMany({ where: { status: "PAID" }, include: { items: true, user: userBrief }, orderBy: { paidAt: "desc" } }),
        db.course.findMany({ include: { category: true, _count: { select: { enrollments: true } } } }),
        db.tradeJournalEntry.findMany(),
        db.ticket.findMany({ include: { user: userBrief } }),
        db.jobApplication.findMany(),
        db.enrollment.findMany(),
      ]);

    const revenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthRevenue = paidOrders
      .filter((o) => o.paidAt && o.paidAt.toISOString().slice(0, 7) === monthKey)
      .reduce((s, o) => s + o.totalAmount, 0);

    const revenueByMonth: Record<string, number> = {};
    paidOrders.forEach((o) => {
      if (!o.paidAt) return;
      const k = o.paidAt.toISOString().slice(0, 7);
      revenueByMonth[k] = (revenueByMonth[k] || 0) + o.totalAmount;
    });
    const months = Object.keys(revenueByMonth).sort().slice(-6);

    const coursePerf = courses
      .map((c) => ({ id: c.id, title: c.title, students: c._count.enrollments, price: c.price, rating: c.rating, category: c.category?.title }))
      .sort((a, b) => b.students - a.students);

    const commissions = await db.commission.findMany({ include: { mentor: userBrief } });

    return NextResponse.json({
      stats: {
        totalUsers: users, totalStudents: students, totalMentors: mentors,
        revenue, monthRevenue, totalOrders: paidOrders.length,
        openTickets: tickets.filter((t) => t.status !== "CLOSED").length,
        pendingApplications: applications.filter((a) => a.status === "PENDING").length,
        totalEnrollments: enrollments.length,
        totalTrades: journal.length,
      },
      revenueByMonth: months.map((m) => ({ month: m, revenue: revenueByMonth[m] })),
      recentOrders: paidOrders.slice(0, 8),
      coursePerf,
      tickets: tickets.slice(-6).reverse(),
      commissions,
      topTraders: (() => {
        const map: Record<string, number> = {};
        journal.forEach((j) => (map[j.userId] = (map[j.userId] || 0) + j.pnl));
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
      })(),
    });
  }

  if (view === "users") {
    const q = req.nextUrl.searchParams.get("q") || "";
    const users = await db.user.findMany({
      where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {},
      include: { _count: { select: { enrollments: true, orders: true, journalEntries: true } }, wallet: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  }

  if (view === "student") {
    const id = req.nextUrl.searchParams.get("id") || "";
    const user = await db.user.findUnique({
      where: { id },
      include: {
        enrollments: { include: { course: true } },
        orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
        journalEntries: { orderBy: { tradeDate: "desc" }, take: 20 },
        submissions: { include: { assignment: true } },
        examAttempts: { include: { exam: true } },
        sessions: { include: { mentor: userBrief } },
        wallet: true,
        tickets: true,
      },
    });
    if (!user) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    return NextResponse.json({ user });
  }

  if (view === "courses") {
    const courses = await db.course.findMany({
      include: { category: true, mentor: userBrief, _count: { select: { enrollments: true, chapters: true } } },
      orderBy: { createdAt: "desc" },
    });
    const categories = await db.category.findMany();
    const mentors = await db.user.findMany({ where: { role: "MENTOR" }, select: userBrief.select });
    return NextResponse.json({ courses, categories, mentors });
  }

  if (view === "orders") {
    const orders = await db.order.findMany({
      include: { items: true, user: userBrief },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  }

  if (view === "finance") {
    const [transactions, commissions, wallets, orders] = await Promise.all([
      db.financialTransaction.findMany({ include: { user: userBrief }, orderBy: { createdAt: "desc" }, take: 60 }),
      db.commission.findMany({ include: { mentor: userBrief }, orderBy: { createdAt: "desc" } }),
      db.wallet.findMany({ include: { user: userBrief }, orderBy: { balance: "desc" } }),
      db.order.findMany({ where: { status: "PAID" }, select: { totalAmount: true, createdAt: true } }),
    ]);
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    return NextResponse.json({
      transactions, commissions, wallets,
      stats: {
        revenue,
        pendingCommissions: commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amount, 0),
        settledCommissions: commissions.filter((c) => c.status === "SETTLED").reduce((s, c) => s + c.amount, 0),
        walletTotal: wallets.reduce((s, w) => s + w.balance, 0),
      },
    });
  }

  if (view === "mentors") {
    const mentors = await db.user.findMany({
      where: { role: "MENTOR" },
      include: { coursesTaught: true, planMentorEnrollments: { include: { plan: true, user: userBrief } }, wallet: true },
    });
    const commissions = await db.commission.findMany({ include: { mentor: userBrief }, orderBy: { createdAt: "desc" } });
    const plans = await db.mentoringPlan.findMany();
    const planRequests = await db.mentoringPlanEnrollment.findMany({
      include: { plan: true, mentor: userBrief }, orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ mentors, commissions, plans, planRequests });
  }

  if (view === "assignments-review") {
    const submissions = await db.submission.findMany({
      include: { assignment: { include: { course: true } }, user: userBrief },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ submissions });
  }

  if (view === "exercises-review") {
    const exercises = await db.tradingExercise.findMany({
      include: { user: userBrief, reviewComments: { include: { user: userBrief }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ exercises });
  }

  if (view === "support") {
    const tickets = await db.ticket.findMany({
      include: { user: userBrief, messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tickets });
  }

  if (view === "recruitment") {
    const applications = await db.jobApplication.findMany({ orderBy: { createdAt: "desc" } });
    const postings = await db.jobPosting.findMany();
    return NextResponse.json({ applications, postings });
  }

  if (view === "cms") {
    const [posts, testimonials, faqs, resources] = await Promise.all([
      db.blogPost.findMany({ orderBy: { createdAt: "desc" } }),
      db.testimonial.findMany(),
      db.faq.findMany({ orderBy: { order: "asc" } }),
      db.freeResource.findMany(),
    ]);
    return NextResponse.json({ posts, testimonials, faqs, resources });
  }

  if (view === "marketing") {
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    const products = await db.product.findMany();
    return NextResponse.json({ coupons, products });
  }

  if (view === "audit") {
    const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ logs });
  }

  if (view === "sessions") {
    const sessions = await db.mentorSession.findMany({
      include: { mentor: userBrief, student: userBrief },
      orderBy: { startTime: "desc" },
    });
    const mentors = await db.user.findMany({ where: { role: "MENTOR" }, select: userBrief.select });
    const students = await db.user.findMany({ where: { role: "STUDENT" }, select: userBrief.select });
    return NextResponse.json({ sessions, mentors, students });
  }

  return NextResponse.json({ error: "view نامعتبر" }, { status: 400 });
}

/** POST /api/admin — admin mutations */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی فقط برای مدیر سیستم" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const log = (act: string, entity: string, detail?: string) =>
    db.auditLog.create({ data: { actorName: admin.name || "مدیر", action: act, entity, detail: detail || null } }).catch(() => null);

  if (action === "create-course") {
    const slug = `course-${Date.now().toString().slice(-6)}`;
    const course = await db.course.create({
      data: {
        title: body.title, slug, description: body.description || "",
        price: Number(body.price) || 0, level: body.level || "BEGINNER",
        categoryId: body.categoryId || null, mentorId: body.mentorId || null,
        durationHours: Number(body.durationHours) || 10,
        isPublished: !!body.isPublished, isFree: Number(body.price) === 0,
      },
    });
    await log("ایجاد دوره", course.title);
    return NextResponse.json({ ok: true, course, message: "دوره جدید ایجاد شد." });
  }

  if (action === "update-course") {
    const data: Record<string, unknown> = {};
    for (const k of ["title", "description", "level", "isPublished"]) if (k in body) data[k] = body[k];
    if ("price" in body) data.price = Number(body.price);
    if ("categoryId" in body) data.categoryId = body.categoryId || null;
    if ("mentorId" in body) data.mentorId = body.mentorId || null;
    const course = await db.course.update({ where: { id: body.id }, data });
    await log("ویرایش دوره", course.title);
    return NextResponse.json({ ok: true, course });
  }

  if (action === "delete-course") {
    const c = await db.course.delete({ where: { id: body.id } });
    await log("حذف دوره", c.title);
    return NextResponse.json({ ok: true });
  }

  if (action === "update-user") {
    const { id, role, isActive } = body;
    const user = await db.user.update({
      where: { id },
      data: { ...(role ? { role } : {}), ...(typeof isActive === "boolean" ? { isActive } : {}) },
    });
    await log("ویرایش کاربر", user.name || user.phone, `نقش: ${user.role} | فعال: ${user.isActive}`);
    return NextResponse.json({ ok: true, user });
  }

  if (action === "update-order") {
    const { id, status } = body;
    const order = await db.order.update({ where: { id }, data: { status } });
    if (status === "PAID") {
      await db.order.update({ where: { id }, data: { paidAt: new Date(), refId: order.refId || String(Math.floor(100000 + Math.random() * 900000)) } });
    }
    if (status === "REFUNDED") {
      await db.financialTransaction.create({
        data: { userId: order.userId, type: "REFUND", amount: order.totalAmount, description: `بازپرداخت سفارش ${order.orderNo}` },
      });
    }
    await log("تغییر وضعیت سفارش", order.orderNo, `وضعیت جدید: ${status}`);
    return NextResponse.json({ ok: true, order });
  }

  if (action === "grade-submission") {
    const { id, score, feedback, revision } = body;
    const sub = await db.submission.update({
      where: { id },
      data: { score: revision ? null : Number(score), feedback, status: revision ? "REVISION" : "GRADED", gradedAt: new Date() },
      include: { user: true, assignment: true },
    });
    await db.notification.create({
      data: {
        userId: sub.userId, type: "ASSIGNMENT",
        title: revision ? "درخواست بازنگری تمرین" : "تمرین شما بررسی شد",
        body: `تمرین «${sub.assignment.title}» ${revision ? "بازنگری" : `با نمره ${score} از ۱۰۰`} بررسی شد.`,
      },
    });
    await log("ارزیابی تمرین", sub.assignment.title, `دانشجو: ${sub.user.name}`);
    return NextResponse.json({ ok: true, submission: sub });
  }

  if (action === "review-exercise") {
    const { id, mentorScore, mentorFeedback, status } = body;
    const mentor = await db.user.findFirst({ where: { role: "MENTOR" } });
    const ex = await db.tradingExercise.update({
      where: { id },
      data: { mentorScore: mentorScore ? Number(mentorScore) : null, mentorFeedback, status: status || "REVIEWED", reviewedAt: new Date() },
      include: { user: true },
    });
    if (mentor) {
      await db.tradingReviewComment.create({
        data: { exerciseId: id, userId: mentor.id, body: mentorFeedback || "" },
      });
    }
    await db.notification.create({
      data: { userId: ex.userId, type: "SYSTEM", title: "بازخورد منتور روی تمرین شما", body: `تمرین «${ex.taskTitle}» با نمره ${mentorScore ?? "—"} بررسی شد.` },
    });
    await log("بررسی تمرین معاملاتی", ex.taskTitle, `دانشجو: ${ex.user.name}`);
    return NextResponse.json({ ok: true, exercise: ex });
  }

  if (action === "reply-ticket") {
    const { ticketId, message, close } = body;
    await db.ticketMessage.create({ data: { ticketId, body: message, isStaff: true } });
    const t = await db.ticket.update({ where: { id: ticketId }, data: { status: close ? "CLOSED" : "ANSWERED" } });
    await db.notification.create({
      data: { userId: t.userId, type: "SYSTEM", title: "پاسخ پشتیبانی", body: `به تیکت «${t.subject}» پاسخ داده شد.` },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "assign-ticket") {
    await db.ticket.update({ where: { id: body.id }, data: { status: body.status || "ANSWERED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "settle-commission") {
    const c = await db.commission.update({ where: { id: body.id }, data: { status: "SETTLED" } });
    await db.financialTransaction.create({
      data: { userId: c.mentorId, type: "SETTLEMENT", amount: -c.amount, description: "تسویه کمیسیون منتور" },
    });
    await log("تسویه کمیسیون", `منتور ${c.mentorId}`, `مبلغ: ${c.amount}`);
    return NextResponse.json({ ok: true, commission: c });
  }

  if (action === "schedule-session") {
    const s = await db.mentorSession.create({
      data: {
        title: body.title || "جلسه منتورینگ", studentId: body.studentId, mentorId: body.mentorId,
        startTime: new Date(body.startTime), durationMin: Number(body.durationMin) || 60, status: "SCHEDULED",
      },
    });
    await db.notification.createMany({
      data: [
        { userId: body.studentId, title: "جلسه جدید ثبت شد", body: `جلسه «${s.title}» زمان‌بندی شد.`, type: "SESSION" },
        { userId: body.mentorId, title: "جلسه جدید ثبت شد", body: `جلسه «${s.title}» زمان‌بندی شد.`, type: "SESSION" },
      ],
    });
    return NextResponse.json({ ok: true, session: s, message: "جلسه ثبت شد." });
  }

  if (action === "update-application") {
    const app = await db.jobApplication.update({
      where: { id: body.id },
      data: { status: body.status, interviewAt: body.interviewAt ? new Date(body.interviewAt) : null },
    });
    await log("بررسی درخواست همکاری", app.name, `وضعیت: ${app.status}`);
    return NextResponse.json({ ok: true, application: app });
  }

  if (action === "create-coupon") {
    const coupon = await db.coupon.create({
      data: {
        code: String(body.code || "").toUpperCase(), percentOff: Number(body.percentOff) || 10,
        maxUses: Number(body.maxUses) || 100, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    await log("ایجاد کد تخفیف", coupon.code);
    return NextResponse.json({ ok: true, coupon, message: "کد تخفیف ساخته شد." });
  }

  if (action === "toggle-coupon") {
    const c = await db.coupon.update({ where: { id: body.id }, data: { isActive: !!body.isActive } });
    return NextResponse.json({ ok: true, coupon: c });
  }

  if (action === "create-post") {
    const post = await db.blogPost.create({
      data: {
        title: body.title, slug: `post-${Date.now().toString().slice(-6)}`,
        excerpt: body.excerpt || "", content: body.content || "",
        category: body.category || "تحلیل بازار", isPublished: body.isPublished !== false,
      },
    });
    await log("ایجاد مقاله", post.title);
    return NextResponse.json({ ok: true, post, message: "مقاله منتشر شد." });
  }

  if (action === "delete-post") {
    await db.blogPost.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "create-testimonial") {
    const t = await db.testimonial.create({
      data: { name: body.name, role: body.role || "", content: body.content, rating: Number(body.rating) || 5 },
    });
    return NextResponse.json({ ok: true, testimonial: t });
  }

  if (action === "delete-testimonial") {
    await db.testimonial.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "create-faq") {
    const count = await db.faq.count();
    const f = await db.faq.create({ data: { question: body.question, answer: body.answer, category: body.category || "عمومی", order: count } });
    return NextResponse.json({ ok: true, faq: f });
  }

  if (action === "delete-faq") {
    await db.faq.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "update-setting") {
    await db.setting.upsert({
      where: { key: body.key },
      update: { value: body.value },
      create: { key: body.key, value: body.value },
    });
    return NextResponse.json({ ok: true, message: "تنظیمات ذخیره شد." });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
