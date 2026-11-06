import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const includeUser = { select: { id: true, name: true, avatar: true, role: true } };

/** GET /api/student?view=... */
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const view = req.nextUrl.searchParams.get("view") || "dashboard";
  const uid = me.id;

  // Mentor data is scoped to the authenticated mentor, never to arbitrary user IDs.
  if (view === "mentor-dashboard") {
    if (me.role !== "MENTOR") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    const [enrollments, sessions, courses] = await Promise.all([
      db.mentoringPlanEnrollment.findMany({ where: { mentorId: uid, status: "ACCEPTED" }, include: { user: includeUser, plan: true } }),
      db.mentorSession.findMany({ where: { mentorId: uid }, include: { student: includeUser }, orderBy: { startTime: "asc" } }),
      db.course.findMany({ where: { mentorId: uid } }),
    ]);
    return NextResponse.json({ enrollments, sessions, courses });
  }

  if (view === "dashboard") {
    const [enrollments, journal, exercises, submissions, attempts, sessions, notifications, mentorEnrollment, wallet, certificates] =
      await Promise.all([
        db.enrollment.findMany({
          where: { userId: uid },
          include: { course: { include: { mentor: includeUser, category: true, chapters: { include: { lessons: true } } } } },
        }),
        db.tradeJournalEntry.findMany({ where: { userId: uid }, orderBy: { tradeDate: "desc" } }),
        db.tradingExercise.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
        db.submission.findMany({ where: { userId: uid }, include: { assignment: { include: { course: true } } }, orderBy: { createdAt: "desc" } }),
        db.examAttempt.findMany({ where: { userId: uid }, include: { exam: { include: { course: true } } }, orderBy: { createdAt: "desc" } }),
        db.mentorSession.findMany({ where: { studentId: uid }, include: { mentor: includeUser }, orderBy: { startTime: "asc" } }),
        db.notification.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 12 }),
        db.mentoringPlanEnrollment.findFirst({
          where: { userId: uid, status: "ACCEPTED" },
          include: { plan: true, mentor: includeUser },
        }),
        db.wallet.findUnique({ where: { userId: uid } }),
        db.certificate.findMany({ where: { userId: uid }, orderBy: { issuedAt: "desc" } }),
      ]);

    const report = await db.weeklyReport.findFirst({
      where: { studentId: uid }, orderBy: { createdAt: "desc" },
    });

    const wins = journal.filter((j) => j.status === "WIN").length;
    const totalPnl = journal.reduce((s, j) => s + j.pnl, 0);
    const stats = {
      winRate: journal.length ? Math.round((wins / journal.length) * 100) : 0,
      totalTrades: journal.length,
      totalPnl,
      bestTrade: journal.reduce((m, j) => (j.pnl > (m?.pnl ?? -Infinity) ? j : m), journal[0]),
      worstTrade: journal.reduce((m, j) => (j.pnl < (m?.pnl ?? Infinity) ? j : m), journal[0]),
    };

    const pendingAssignments = await db.assignment.findMany({
      where: { course: { enrollments: { some: { userId: uid } } }, submissions: { none: { userId: uid } } },
      include: { course: true },
    });

    const weeklyActivity: { date: string; trades: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const now = new Date();
      const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const next = new Date(day.getTime() + 86400000);
      const trades = journal.filter((j) => j.tradeDate >= day && j.tradeDate < next).length;
      weeklyActivity.push({ date: day.toISOString().slice(0, 10), trades });
    }

    return NextResponse.json({
      enrollments, journal: journal.slice(0, 8), stats, exercises, submissions, attempts,
      sessions, notifications, mentorEnrollment, report, wallet, certificates,
      pendingAssignments, weeklyActivity,
    });
  }

  if (view === "course") {
    const slug = req.nextUrl.searchParams.get("slug") || "";
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        mentor: includeUser,
        category: true,
        chapters: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      },
    });
    if (!course) return NextResponse.json({ error: "دوره یافت نشد" }, { status: 404 });
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: uid, courseId: course.id } },
    });
    const progressRecords = await db.lessonProgress.findMany({ where: { userId: uid, lessonId: { in: course.chapters.flatMap((c) => c.lessons.map((l) => l.id)) } } });
    return NextResponse.json({ course, enrollment, progressRecords });
  }

  if (view === "journal") {
    const journal = await db.tradeJournalEntry.findMany({ where: { userId: uid }, orderBy: { tradeDate: "desc" } });
    const wins = journal.filter((j) => j.status === "WIN");
    const losses = journal.filter((j) => j.status === "LOSS");
    const grossProfit = wins.reduce((s, j) => s + j.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, j) => s + j.pnl, 0));
    const bySymbol: Record<string, { count: number; pnl: number }> = {};
    journal.forEach((j) => {
      bySymbol[j.symbol] = bySymbol[j.symbol] || { count: 0, pnl: 0 };
      bySymbol[j.symbol].count++;
      bySymbol[j.symbol].pnl += j.pnl;
    });
    const monthly: Record<string, number> = {};
    journal.forEach((j) => {
      const key = j.tradeDate.toISOString().slice(0, 7);
      monthly[key] = (monthly[key] || 0) + j.pnl;
    });
    return NextResponse.json({
      journal,
      analytics: {
        winRate: journal.length ? Math.round((wins.length / journal.length) * 100) : 0,
        totalTrades: journal.length,
        totalPnl: journal.reduce((s, j) => s + j.pnl, 0),
        profitFactor: grossLoss ? +(grossProfit / grossLoss).toFixed(2) : grossProfit ? 99 : 0,
        avgWin: wins.length ? Math.round(grossProfit / wins.length) : 0,
        avgLoss: losses.length ? Math.round(grossLoss / losses.length) : 0,
        bySymbol, monthly,
      },
    });
  }

  if (view === "exercises") {
    const exercises = await db.tradingExercise.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: { reviewComments: { include: { user: includeUser }, orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ exercises });
  }

  if (view === "assignments") {
    const assignments = await db.assignment.findMany({
      where: { course: { enrollments: { some: { userId: uid } } } },
      include: { course: true, submissions: { where: { userId: uid } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ assignments });
  }

  if (view === "exams") {
    const exams = await db.exam.findMany({
      where: { isPublished: true, course: { enrollments: { some: { userId: uid } } } },
      include: { course: true, questions: true, attempts: { where: { userId: uid }, orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json({ exams });
  }

  if (view === "exam") {
    const id = req.nextUrl.searchParams.get("id") || "";
    const exam = await db.exam.findUnique({ where: { id }, include: { questions: true, course: true } });
    if (!exam) return NextResponse.json({ error: "آزمون یافت نشد" }, { status: 404 });
    return NextResponse.json({ exam });
  }

  if (view === "sessions") {
    const sessions = await db.mentorSession.findMany({
      where: { studentId: uid },
      include: { mentor: includeUser },
      orderBy: { startTime: "desc" },
    });
    const mentors = await db.user.findMany({ where: { role: "MENTOR" }, select: includeUser.select });
    return NextResponse.json({ sessions, mentors });
  }

  if (view === "calendar") {
    const sessions = await db.mentorSession.findMany({
      where: { studentId: uid }, include: { mentor: includeUser }, orderBy: { startTime: "asc" },
    });
    const assignments = await db.assignment.findMany({
      where: { course: { enrollments: { some: { userId: uid } } }, dueDate: { not: null } },
      include: { course: true },
    });
    const exams = await db.exam.findMany({
      where: { course: { enrollments: { some: { userId: uid } } } }, include: { course: true },
    });
    return NextResponse.json({ sessions, assignments, exams });
  }

  if (view === "messages") {
    const msgs = await db.message.findMany({
      where: { OR: [{ senderId: uid }, { receiverId: uid }] },
      orderBy: { createdAt: "asc" },
      include: { sender: includeUser },
    });
    const convMap: Record<string, { partnerId: string; partnerName: string; messages: typeof msgs }> = {};
    for (const m of msgs) {
      const partnerId = m.senderId === uid ? m.receiverId : m.senderId;
      const partner = m.senderId === uid ? null : m.sender;
      const key = m.conversationId;
      if (!convMap[key]) {
        let partnerName = partner?.name || "";
        if (!partnerName) {
          const u = await db.user.findUnique({ where: { id: partnerId }, select: { name: true } });
          partnerName = u?.name || "کاربر";
        }
        convMap[key] = { partnerId, partnerName, messages: [] };
      }
      convMap[key].messages.push(m);
    }
    const mentors = await db.user.findMany({ where: { role: "MENTOR" }, select: includeUser.select });
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: includeUser.select });
    return NextResponse.json({ conversations: Object.values(convMap), contacts: [...mentors, ...admins] });
  }

  if (view === "tickets") {
    const tickets = await db.ticket.findMany({
      where: { userId: uid },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tickets });
  }

  if (view === "notifications") {
    const notifications = await db.notification.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ notifications });
  }

  if (view === "orders") {
    const orders = await db.order.findMany({
      where: { userId: uid },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    const wallet = await db.wallet.findUnique({ where: { userId: uid } });
    const transactions = await db.financialTransaction.findMany({
      where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 30,
    });
    return NextResponse.json({ orders, wallet, transactions });
  }

  if (view === "certificates") {
    const certificates = await db.certificate.findMany({
      where: { userId: uid }, orderBy: { issuedAt: "desc" },
    });
    return NextResponse.json({ certificates });
  }

  if (view === "mentor") {
    const planEnrollment = await db.mentoringPlanEnrollment.findFirst({
      where: { userId: uid, status: "ACCEPTED" },
      include: { plan: true, mentor: includeUser },
    });
    const sessions = await db.mentorSession.findMany({
      where: { studentId: uid }, orderBy: { startTime: "desc" }, include: { mentor: includeUser },
    });
    const reports = await db.weeklyReport.findMany({
      where: { studentId: uid }, orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ planEnrollment, sessions, reports });
  }

  if (view === "paths") {
    const enrollments = await db.enrollment.findMany({
      where: { userId: uid },
      include: { course: true },
    });
    const paths = await db.learningPath.findMany({
      include: { courses: { orderBy: { order: "asc" }, include: { course: true } } },
    });
    return NextResponse.json({ enrollments, paths });
  }

  return NextResponse.json({ error: "view نامعتبر" }, { status: 400 });
}

/** POST /api/student — student mutations */
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const uid = me.id;

  if (action === "complete-lesson") {
    const lessonId = body.lessonId as string;
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: uid, lessonId } },
      update: { completed: true, watchedAt: new Date() },
      create: { userId: uid, lessonId, completed: true },
    });
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: { include: { chapters: { include: { lessons: true } } } } } } },
    });
    if (lesson) {
      const allLessons = lesson.chapter.course.chapters.flatMap((c) => c.lessons);
      const done = await db.lessonProgress.count({ where: { userId: uid, lessonId: { in: allLessons.map((l) => l.id) }, completed: true } });
      const progress = Math.round((done / Math.max(allLessons.length, 1)) * 100);
      await db.enrollment.updateMany({ where: { userId: uid, courseId: lesson.chapter.courseId }, data: { progress, lastLessonId: lessonId } });
      if (progress === 100) {
        await db.notification.create({
          data: { userId: uid, title: "🎉 دوره را کامل کردید!", body: `دوره «${lesson.chapter.course.title}» با موفقیت به پایان رسید. گواهینامه شما صادر شد.` },
        });
        const cert = await db.certificate.create({
          data: { serial: `DS-CERT-${Date.now().toString().slice(-8)}`, userId: uid, courseId: lesson.chapter.courseId, title: `گواهینامه ${lesson.chapter.course.title}` },
        });
        return NextResponse.json({ ok: true, progress, certificate: cert });
      }
      return NextResponse.json({ ok: true, progress });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "add-journal") {
    const { symbol, direction, entryPrice, exitPrice, lotSize, stopLoss, takeProfit, setup, notes, emotion } = body;
    const pnl = (Number(exitPrice) - Number(entryPrice)) * (direction === "LONG" ? 1 : -1) * Number(lotSize) * 100;
    const entry = await db.tradeJournalEntry.create({
      data: {
        userId: uid, symbol, direction, entryPrice: Number(entryPrice), exitPrice: Number(exitPrice),
        lotSize: Number(lotSize), stopLoss: stopLoss ? Number(stopLoss) : null,
        takeProfit: takeProfit ? Number(takeProfit) : null,
        pnl: +pnl.toFixed(2), pnlPercent: +(pnl / 10).toFixed(2),
        status: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN",
        setup: setup || null, notes: notes || null, emotion: emotion || null,
      },
    });
    return NextResponse.json({ ok: true, entry });
  }

  if (action === "delete-journal") {
    await db.tradeJournalEntry.deleteMany({ where: { id: body.id, userId: uid } });
    return NextResponse.json({ ok: true });
  }

  if (action === "add-exercise") {
    const entry = await db.tradingExercise.create({
      data: {
        userId: uid, symbol: body.symbol, timeframe: body.timeframe || "1H",
        taskTitle: body.taskTitle, description: body.description || null,
        analysis: body.analysis || null,
        checklist: body.checklist ? JSON.stringify(body.checklist) : null,
        snapshot: body.snapshot ? JSON.stringify(body.snapshot) : null,
      },
    });
    return NextResponse.json({ ok: true, entry });
  }

  if (action === "submit-assignment") {
    const { assignmentId, content } = body;
    if (!content || String(content).trim().length < 10)
      return NextResponse.json({ error: "متن پاسخ باید حداقل ۱۰ کاراکتر باشد" }, { status: 400 });
    const existing = await db.submission.findFirst({ where: { assignmentId, userId: uid } });
    if (existing) {
      await db.submission.update({
        where: { id: existing.id },
        data: { content, status: "SUBMITTED", score: null, feedback: null, createdAt: new Date() },
      });
    } else {
      await db.submission.create({ data: { assignmentId, userId: uid, content } });
    }
    const asg = await db.assignment.findUnique({ where: { id: assignmentId }, include: { course: true } });
    const admins = await db.user.findMany({ where: { role: { in: ["ADMIN", "MENTOR"] } } });
    for (const a of admins) {
      await db.notification.create({
        data: { userId: a.id, title: "پاسخ جدید برای تمرین", body: `${me.name} تمرین «${asg?.title}» را ارسال کرد.`, type: "ASSIGNMENT" },
      });
    }
    return NextResponse.json({ ok: true, message: "پاسخ شما ارسال شد؛ نتیجه بررسی را در همین صفحه می‌بینید." });
  }

  if (action === "submit-exam") {
    const { examId, answers } = body as { examId: string; answers: Record<string, number> };
    const exam = await db.exam.findUnique({ where: { id: examId }, include: { questions: true } });
    if (!exam) return NextResponse.json({ error: "آزمون یافت نشد" }, { status: 404 });
    let score = 0;
    const detail: Record<string, boolean> = {};
    for (const q of exam.questions) {
      const correct = answers[q.id] === q.answer;
      detail[q.id] = correct;
      if (correct) score += q.score;
    }
    const attempt = await db.examAttempt.create({
      data: { examId, userId: uid, score, maxScore: exam.questions.reduce((s, q) => s + q.score, 0), answers: JSON.stringify({ detail, answers }) },
    });
    if (exam.questions.length && score >= exam.questions.reduce((s, q) => s + q.score, 0) * 0.7) {
      const exists = await db.certificate.findFirst({ where: { userId: uid, courseId: exam.courseId } });
      if (!exists) {
        await db.certificate.create({
          data: { serial: `DS-CERT-${Date.now().toString().slice(-8)}`, userId: uid, courseId: exam.courseId, title: `گواهینامه ${exam.title}` },
        });
      }
    }
    return NextResponse.json({ ok: true, attempt, detail });
  }

  if (action === "book-session") {
    const { mentorId, title, startTime } = body;
    const session = await db.mentorSession.create({
      data: { title: title || "جلسه منتورینگ", studentId: uid, mentorId, startTime: new Date(startTime), status: "SCHEDULED" },
    });
    await db.notification.create({
      data: { userId: mentorId, title: "درخواست جلسه جدید", body: `${me.name} جلسه «${session.title}» را رزرو کرد.`, type: "SESSION" },
    });
    return NextResponse.json({ ok: true, session, message: "جلسه با موفقیت رزرو شد." });
  }

  if (action === "cancel-session") {
    await db.mentorSession.updateMany({ where: { id: body.id, studentId: uid }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "create-ticket") {
    const { subject, category, priority, message } = body;
    if (!subject || !message) return NextResponse.json({ error: "موضوع و متن پیام الزامی است" }, { status: 400 });
    const ticket = await db.ticket.create({
      data: { subject, category: category || "GENERAL", priority: priority || "MEDIUM", userId: uid },
    });
    await db.ticketMessage.create({ data: { ticketId: ticket.id, body: message } });
    return NextResponse.json({ ok: true, ticket, message: "تیکت شما ثبت شد؛ کارشناسان ما به‌زودی پاسخ می‌دهند." });
  }

  if (action === "reply-ticket") {
    const { ticketId, message } = body;
    const ticket = await db.ticket.findFirst({ where: { id: ticketId, userId: uid } });
    if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    await db.ticketMessage.create({ data: { ticketId, body: message } });
    await db.ticket.update({ where: { id: ticketId }, data: { status: "OPEN" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "send-message") {
    const { receiverId, body: text, conversationId } = body;
    if (!text?.trim()) return NextResponse.json({ error: "پیام خالی است" }, { status: 400 });
    const conv = conversationId || [uid, receiverId].sort().join(":");
    const msg = await db.message.create({
      data: { senderId: uid, receiverId, conversationId: conv, body: text },
      include: { sender: includeUser },
    });
    return NextResponse.json({ ok: true, message: msg });
  }

  if (action === "read-notifications") {
    await db.notification.updateMany({ where: { userId: uid }, data: { isRead: true } });
    return NextResponse.json({ ok: true });
  }

  if (action === "update-settings") {
    const data: { name?: string; email?: string | null; bio?: string } = {};
    if (body.name) data.name = body.name;
    if (typeof body.email === "string") data.email = body.email || null;
    if (typeof body.bio === "string") data.bio = body.bio;
    await db.user.update({ where: { id: uid }, data });
    return NextResponse.json({ ok: true, message: "تنظیمات ذخیره شد." });
  }

  if (action === "enroll-free") {
    const course = await db.course.findUnique({ where: { slug: body.slug } });
    if (!course) return NextResponse.json({ error: "دوره یافت نشد" }, { status: 404 });
    if (course.price > 0)
      return NextResponse.json({ error: "این دوره پرداختی است؛ از دکمه ثبت‌نام و پرداخت استفاده کنید." }, { status: 400 });
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: uid, courseId: course.id } },
      update: {},
      create: { userId: uid, courseId: course.id },
    });
    return NextResponse.json({ ok: true, message: `ثبت‌نام در «${course.title}» انجام شد!` });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
