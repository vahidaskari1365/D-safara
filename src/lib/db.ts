/**
 * D.SAFARA — Prisma-compatible IN-MEMORY data layer (database-free build)
 * ---------------------------------------------------------------------
 * This module mimics the subset of the Prisma Client API used by the app
 * (findMany / findUnique / findFirst / create / createMany / update /
 * updateMany / upsert / delete / deleteMany / count) with relations,
 * filtering (OR, in, not, gt, contains, some/none …), _count and nested
 * creates — backed by plain seeded JavaScript objects.
 *
 * Why: so the platform runs on Vercel (serverless) without any database.
 * Data lives for the lifetime of the server instance; a fresh instance
 * boots with the same rich demo dataset.
 */

type Row = Record<string, any>;

const now = () => new Date();
const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000);
const ahead = (days: number, hours = 0) => new Date(Date.now() + days * 86400000 + hours * 3600000);

let idSeq = 0;
const nid = (p: string) => `${p}_${(++idSeq).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Relation metadata:  fk  = FK stored on this row → related.id
//                     inv = unique FK on related row pointing to this row
//                     many = list of related rows whose fk === this.id
// ---------------------------------------------------------------------------
type Rel = { kind: "fk" | "inv" | "many"; model: string; fk?: string };

const R: Record<string, Record<string, Rel>> = {
  user: {
    enrollments: { kind: "many", model: "enrollment", fk: "userId" },
    submissions: { kind: "many", model: "submission", fk: "userId" },
    examAttempts: { kind: "many", model: "examAttempt", fk: "userId" },
    journalEntries: { kind: "many", model: "tradeJournalEntry", fk: "userId" },
    exercises: { kind: "many", model: "tradingExercise", fk: "userId" },
    orders: { kind: "many", model: "order", fk: "userId" },
    tickets: { kind: "many", model: "ticket", fk: "userId" },
    sentMessages: { kind: "many", model: "message", fk: "senderId" },
    notifications: { kind: "many", model: "notification", fk: "userId" },
    sessions: { kind: "many", model: "mentorSession", fk: "studentId" },
    mentorSessions: { kind: "many", model: "mentorSession", fk: "mentorId" },
    planMentorEnrollments: { kind: "many", model: "mentoringPlanEnrollment", fk: "mentorId" },
    planStudentEnrollments: { kind: "many", model: "mentoringPlanEnrollment", fk: "userId" },
    coursesTaught: { kind: "many", model: "course", fk: "mentorId" },
    certificates: { kind: "many", model: "certificate", fk: "userId" },
    mentorCommissions: { kind: "many", model: "commission", fk: "mentorId" },
    transactions: { kind: "many", model: "financialTransaction", fk: "userId" },
    reviewComments: { kind: "many", model: "tradingReviewComment", fk: "userId" },
    applications: { kind: "many", model: "jobApplication", fk: "userId" },
    wallet: { kind: "inv", model: "wallet", fk: "userId" },
  },
  category: { courses: { kind: "many", model: "course", fk: "categoryId" } },
  course: {
    category: { kind: "fk", model: "category", fk: "categoryId" },
    mentor: { kind: "fk", model: "user", fk: "mentorId" },
    chapters: { kind: "many", model: "chapter", fk: "courseId" },
    enrollments: { kind: "many", model: "enrollment", fk: "courseId" },
    orderItems: { kind: "many", model: "orderItem", fk: "courseId" },
    pathCourses: { kind: "many", model: "pathCourse", fk: "courseId" },
    assignments: { kind: "many", model: "assignment", fk: "courseId" },
    exams: { kind: "many", model: "exam", fk: "courseId" },
  },
  chapter: {
    course: { kind: "fk", model: "course", fk: "courseId" },
    lessons: { kind: "many", model: "lesson", fk: "chapterId" },
  },
  lesson: { chapter: { kind: "fk", model: "chapter", fk: "chapterId" } },
  learningPath: { courses: { kind: "many", model: "pathCourse", fk: "pathId" } },
  pathCourse: {
    path: { kind: "fk", model: "learningPath", fk: "pathId" },
    course: { kind: "fk", model: "course", fk: "courseId" },
  },
  enrollment: {
    user: { kind: "fk", model: "user", fk: "userId" },
    course: { kind: "fk", model: "course", fk: "courseId" },
  },
  lessonProgress: {},
  assignment: {
    course: { kind: "fk", model: "course", fk: "courseId" },
    submissions: { kind: "many", model: "submission", fk: "assignmentId" },
  },
  submission: {
    assignment: { kind: "fk", model: "assignment", fk: "assignmentId" },
    user: { kind: "fk", model: "user", fk: "userId" },
  },
  exam: {
    course: { kind: "fk", model: "course", fk: "courseId" },
    questions: { kind: "many", model: "question", fk: "examId" },
    attempts: { kind: "many", model: "examAttempt", fk: "examId" },
  },
  question: { exam: { kind: "fk", model: "exam", fk: "examId" } },
  examAttempt: {
    exam: { kind: "fk", model: "exam", fk: "examId" },
    user: { kind: "fk", model: "user", fk: "userId" },
  },
  tradeJournalEntry: { user: { kind: "fk", model: "user", fk: "userId" } },
  tradingExercise: {
    user: { kind: "fk", model: "user", fk: "userId" },
    reviewComments: { kind: "many", model: "tradingReviewComment", fk: "exerciseId" },
  },
  tradingReviewComment: {
    exercise: { kind: "fk", model: "tradingExercise", fk: "exerciseId" },
    user: { kind: "fk", model: "user", fk: "userId" },
  },
  mentoringPlan: { enrollments: { kind: "many", model: "mentoringPlanEnrollment", fk: "planId" } },
  mentoringPlanEnrollment: {
    plan: { kind: "fk", model: "mentoringPlan", fk: "planId" },
    mentor: { kind: "fk", model: "user", fk: "mentorId" },
    user: { kind: "fk", model: "user", fk: "userId" },
  },
  mentorSession: {
    student: { kind: "fk", model: "user", fk: "studentId" },
    mentor: { kind: "fk", model: "user", fk: "mentorId" },
  },
  weeklyReport: {},
  product: { orderItems: { kind: "many", model: "orderItem", fk: "productId" } },
  order: {
    user: { kind: "fk", model: "user", fk: "userId" },
    items: { kind: "many", model: "orderItem", fk: "orderId" },
  },
  orderItem: {
    order: { kind: "fk", model: "order", fk: "orderId" },
    course: { kind: "fk", model: "course", fk: "courseId" },
    product: { kind: "fk", model: "product", fk: "productId" },
  },
  wallet: { user: { kind: "fk", model: "user", fk: "userId" } },
  financialTransaction: { user: { kind: "fk", model: "user", fk: "userId" } },
  coupon: {},
  commission: { mentor: { kind: "fk", model: "user", fk: "mentorId" } },
  ticket: {
    user: { kind: "fk", model: "user", fk: "userId" },
    messages: { kind: "many", model: "ticketMessage", fk: "ticketId" },
  },
  ticketMessage: { ticket: { kind: "fk", model: "ticket", fk: "ticketId" } },
  message: { sender: { kind: "fk", model: "user", fk: "senderId" } },
  notification: { user: { kind: "fk", model: "user", fk: "userId" } },
  blogPost: {},
  testimonial: {},
  faq: {},
  freeResource: {},
  jobPosting: {},
  jobApplication: { user: { kind: "fk", model: "user", fk: "userId" } },
  certificate: { user: { kind: "fk", model: "user", fk: "userId" } },
  auditLog: {},
  setting: {},
  otpCode: {},
};

// FKs that should be nulled instead of cascade-deleted (optional relations)
const SET_NULL = new Set(["orderItem.courseId", "orderItem.productId"]);

const DEFAULTS: Record<string, () => Row> = {
  user: () => ({ role: "STUDENT", isActive: true, createdAt: now(), updatedAt: now() }),
  otpCode: () => ({ used: false, createdAt: now() }),
  category: () => ({ createdAt: now() }),
  course: () => ({ level: "BEGINNER", price: 0, durationHours: 0, isPublished: true, isFree: false, rating: 4.8, studentsCount: 0, createdAt: now(), updatedAt: now() }),
  chapter: () => ({ order: 0 }),
  lesson: () => ({ durationMin: 10, isFree: false, order: 0 }),
  learningPath: () => ({ level: "BEGINNER" }),
  pathCourse: () => ({ order: 0 }),
  enrollment: () => ({ progress: 0, createdAt: now() }),
  lessonProgress: () => ({ completed: false, watchedAt: now() }),
  assignment: () => ({ maxScore: 100, createdAt: now() }),
  submission: () => ({ status: "SUBMITTED", createdAt: now() }),
  exam: () => ({ durationMin: 20, isPublished: true, createdAt: now() }),
  question: () => ({ score: 10 }),
  examAttempt: () => ({ score: 0, maxScore: 0, createdAt: now() }),
  tradeJournalEntry: () => ({ lotSize: 0.1, pnlPercent: 0, status: "WIN", tradeDate: now(), createdAt: now() }),
  tradingExercise: () => ({ timeframe: "1H", status: "PENDING", createdAt: now() }),
  tradingReviewComment: () => ({ createdAt: now() }),
  mentoringPlan: () => ({ price: 0, durationDays: 30, sessionsPerWeek: 2, isActive: true }),
  mentoringPlanEnrollment: () => ({ status: "PENDING", createdAt: now() }),
  mentorSession: () => ({ durationMin: 60, status: "SCHEDULED", createdAt: now() }),
  weeklyReport: () => ({ progress: 0, createdAt: now() }),
  product: () => ({ price: 0, type: "DIGITAL", isActive: true }),
  order: () => ({ totalAmount: 0, discount: 0, status: "PENDING", paymentMethod: "ZARINPAL", createdAt: now() }),
  orderItem: () => ({ quantity: 1 }),
  wallet: () => ({ balance: 0 }),
  financialTransaction: () => ({ status: "COMPLETED", createdAt: now() }),
  coupon: () => ({ percentOff: 10, maxUses: 100, usedCount: 0, isActive: true, createdAt: now() }),
  commission: () => ({ percent: 30, status: "PENDING", createdAt: now() }),
  ticket: () => ({ category: "GENERAL", priority: "MEDIUM", status: "OPEN", createdAt: now() }),
  ticketMessage: () => ({ isStaff: false, createdAt: now() }),
  message: () => ({ createdAt: now() }),
  notification: () => ({ type: "SYSTEM", isRead: false, createdAt: now() }),
  blogPost: () => ({ category: "تحلیل بازار", authorName: "تیم دی‌صفارا", readTimeMin: 5, isPublished: true, views: 0, createdAt: now() }),
  testimonial: () => ({ rating: 5, isActive: true }),
  faq: () => ({ category: "عمومی", order: 0 }),
  freeResource: () => ({ type: "PDF", downloads: 0 }),
  jobPosting: () => ({ type: "FULL_TIME", isActive: true, createdAt: now() }),
  jobApplication: () => ({ status: "PENDING", createdAt: now() }),
  certificate: () => ({ issuedAt: now() }),
  auditLog: () => ({ createdAt: now() }),
  setting: () => ({}),
};

// ---------------------------------------------------------------------------
// Query engine
// ---------------------------------------------------------------------------
type Store = Record<string, Row[]>;

const OPS = ["not", "in", "gt", "gte", "lt", "lte", "contains", "startsWith"] as const;
const isOpObj = (c: any) => c !== null && typeof c === "object" && !(c instanceof Date) && OPS.some((k) => k in c);

function norm(v: any) {
  return v === undefined ? null : v;
}
function fieldEq(a: any, b: any): boolean {
  a = norm(a);
  b = norm(b);
  if (a instanceof Date || b instanceof Date) {
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    return false;
  }
  return a === b;
}
function cmp(a: any, b: any): number {
  const av = a instanceof Date ? a.getTime() : norm(a);
  const bv = b instanceof Date ? b.getTime() : norm(b);
  if (av === bv) return 0;
  if (av === null) return -1;
  if (bv === null) return 1;
  return av < bv ? -1 : 1;
}

function matchesWhere(row: Row | null | undefined, where: any, model: string): boolean {
  if (where === undefined || where === null) return true;
  if (!row) return false;
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;

    if (key === "OR") {
      if (!(cond as any[]).some((w) => matchesWhere(row, w, model))) return false;
      continue;
    }
    if (key === "AND") {
      if (!(cond as any[]).every((w) => matchesWhere(row, w, model))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matchesWhere(row, cond, model)) return false;
      continue;
    }

    const rel = R[model]?.[key];
    if (rel) {
      const list = resolveRel(row, rel);
      if (rel.kind === "many") {
        const c = cond || {};
        if (c.some !== undefined && !list.some((r) => matchesWhere(r, c.some, rel.model))) return false;
        if (c.none !== undefined && list.some((r) => matchesWhere(r, c.none, rel.model))) return false;
        if (c.all !== undefined && !list.every((r) => matchesWhere(r, c.all, rel.model))) return false;
        if (c.some === undefined && c.none === undefined && c.all === undefined) {
          if (!list.some((r) => matchesWhere(r, c, rel.model))) return false;
        }
      } else {
        const target = list[0] ?? null;
        if (cond === null) {
          if (target !== null) return false;
        } else if (!matchesWhere(target, cond, rel.model)) return false;
      }
      continue;
    }

    const val = row[key];
    if (isOpObj(cond)) {
      const c = cond as any;
      if ("not" in c) {
        if (c.not === null) {
          if (norm(val) === null) return false;
        } else if (isOpObj(c.not)) {
          /* nested operator on not — not used */
        } else if (!fieldEq(val, c.not)) return false;
      }
      if ("in" in c && !(c.in as any[]).some((x) => fieldEq(val, x))) return false;
      if ("gt" in c && !(cmp(val, c.gt) > 0)) return false;
      if ("gte" in c && !(cmp(val, c.gte) >= 0)) return false;
      if ("lt" in c && !(cmp(val, c.lt) < 0)) return false;
      if ("lte" in c && !(cmp(val, c.lte) <= 0)) return false;
      if ("contains" in c && !String(val ?? "").includes(String(c.contains))) return false;
      if ("startsWith" in c && !String(val ?? "").startsWith(String(c.startsWith))) return false;
    } else if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      // compound-unique style object  e.g. { userId_courseId: { userId, courseId } }
      for (const [sk, sv] of Object.entries(cond as Row)) {
        if (!fieldEq(row[sk], sv)) return false;
      }
    } else if (!fieldEq(val, cond)) {
      return false;
    }
  }
  return true;
}

function resolveRel(row: Row, rel: Rel): Row[] {
  if (rel.kind === "fk") {
    const fk = row[rel.fk!];
    if (fk === null || fk === undefined) return [];
    const t = store[rel.model].find((r) => r.id === fk);
    return t ? [t] : [];
  }
  // many & inv both: related rows whose fk points to this row
  return store[rel.model].filter((r) => r[rel.fk!] === row.id);
}

function orderByRows(rows: Row[], ob: any): Row[] {
  if (!ob) return rows;
  const arr = Array.isArray(ob) ? ob : [ob];
  rows.sort((a, b) => {
    for (const o of arr) {
      for (const [k, dir] of Object.entries(o as Row)) {
        const c = cmp(a[k], b[k]);
        if (c !== 0) return dir === "desc" ? -c : c;
      }
    }
    return 0;
  });
  return rows;
}

function counts(row: Row, model: string, select: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(select)) {
    if (!v) continue;
    const rel = R[model]?.[k];
    out[k] = rel ? resolveRel(row, rel).length : 0;
  }
  return out;
}

function relOut(row: Row, rel: Rel, opts: any): any {
  let list = resolveRel(row, rel);
  if (opts?.where) list = list.filter((r) => matchesWhere(r, opts.where, rel.model));
  if (opts?.orderBy) orderByRows(list, opts.orderBy);
  if (opts?.take) list = list.slice(0, opts.take);
  list = list.map((r) => projRow(r, rel.model, opts?.select, opts?.include, opts?._count));
  return rel.kind === "many" ? list : list[0] ?? null;
}

function projRow(row: Row, model: string, sel: any, inc: any, cnt?: any): Row {
  let out: Row = { ...row };
  if (inc) {
    for (const [k, v] of Object.entries(inc)) {
      if (k === "_count") continue;
      if (!v) continue;
      const rel = R[model]?.[k];
      if (rel) out[k] = relOut(row, rel, v === true ? {} : v);
    }
    if (inc._count?.select) out._count = counts(row, model, inc._count.select);
  }
  if (sel) {
    out = {};
    for (const [k, v] of Object.entries(sel)) {
      if (!v) continue;
      const rel = R[model]?.[k];
      if (rel) out[k] = relOut(row, rel, v === true ? {} : v);
      else if (v === true) out[k] = row[k];
    }
    if (cnt?.select) out._count = counts(row, model, cnt.select);
  }
  return out;
}

function applyData(row: Row, data: Row) {
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && typeof v === "object" && !(v instanceof Date)) {
      if ("increment" in v) row[k] = (row[k] ?? 0) + v.increment;
      else if ("decrement" in v) row[k] = (row[k] ?? 0) - v.decrement;
      else if ("set" in v) row[k] = v.set;
      else row[k] = v;
    } else {
      row[k] = v;
    }
  }
  if ("updatedAt" in row) row.updatedAt = now();
}

// ---------------------------------------------------------------------------
// Store (kept on globalThis so Next.js hot reloads keep the same data)
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __dsStore?: Store };

function emptyStore(): Store {
  const s: Store = {};
  for (const t of Object.keys(DEFAULTS)) s[t] = [];
  return s;
}

export const store: Store = g.__dsStore ?? (g.__dsStore = emptyStore());

function referrersOf(M: string): { referrer: string; fk: string }[] {
  const out: { referrer: string; fk: string }[] = [];
  for (const m2 of Object.keys(R)) {
    for (const rel of Object.values(R[m2])) {
      if (rel.kind === "fk" && rel.model === M && rel.fk) out.push({ referrer: m2, fk: rel.fk });
      if ((rel.kind === "many" || rel.kind === "inv") && m2 === M && rel.fk) out.push({ referrer: rel.model, fk: rel.fk });
    }
  }
  return out;
}

function cascadeDelete(model: string, id: string) {
  for (const { referrer, fk } of referrersOf(model)) {
    if (SET_NULL.has(`${referrer}.${fk}`)) {
      for (const r of store[referrer]) if (r[fk] === id) r[fk] = null;
      continue;
    }
    const kids = store[referrer].filter((r) => r[fk] === id);
    for (const kid of kids) cascadeDelete(referrer, kid.id);
  }
  const t = store[model];
  const i = t.findIndex((r) => r.id === id);
  if (i >= 0) t.splice(i, 1);
}

function create(model: string, args: { data: Row; include?: any; select?: any }): Row {
  const data: Row = { ...args.data };
  const nested: [Rel, any][] = [];
  for (const [k, v] of Object.entries(data)) {
    const rel = R[model]?.[k];
    if (rel && v && typeof v === "object" && "create" in (v as Row)) {
      nested.push([rel, (v as Row).create]);
      delete data[k];
    }
  }
  const row: Row = { ...(DEFAULTS[model]?.() ?? {}), ...data, id: data.id || nid(model) };
  store[model].push(row);
  for (const [rel, createArg] of nested) {
    const items = Array.isArray(createArg) ? createArg : [createArg];
    for (const c of items) create(rel.model, { data: { ...c, [rel.fk!]: row.id } });
  }
  return projRow(row, model, args.select, args.include);
}

function modelApi(model: string) {
  return {
    findMany(args: any = {}) {
      let rows = store[model].filter((r) => matchesWhere(r, args.where, model));
      if (args.orderBy) orderByRows(rows, args.orderBy);
      if (args.take) rows = rows.slice(0, args.take);
      if (args.skip) rows = rows.slice(args.skip);
      return rows.map((r) => projRow(r, model, args.select, args.include, args._count));
    },
    findUnique(args: any = {}) {
      const row = store[model].find((r) => matchesWhere(r, args.where, model));
      return row ? projRow(row, model, args.select, args.include) : null;
    },
    findFirst(args: any = {}) {
      let rows = store[model].filter((r) => matchesWhere(r, args.where, model));
      if (args.orderBy) orderByRows(rows, args.orderBy);
      const row = rows[0];
      return row ? projRow(row, model, args.select, args.include) : null;
    },
    create(args: any) {
      return create(model, args);
    },
    createMany(args: any) {
      const data = Array.isArray(args.data) ? args.data : [args.data];
      for (const d of data) create(model, { data: d });
      return { count: data.length };
    },
    update(args: any) {
      const row = store[model].find((r) => matchesWhere(r, args.where, model));
      if (!row) throw new Error(`${model}: record to update not found`);
      applyData(row, args.data || {});
      return projRow(row, model, args.select, args.include);
    },
    updateMany(args: any) {
      let n = 0;
      for (const row of store[model]) {
        if (matchesWhere(row, args.where, model)) {
          applyData(row, args.data || {});
          n++;
        }
      }
      return { count: n };
    },
    upsert(args: any) {
      const row = store[model].find((r) => matchesWhere(r, args.where, model));
      if (row) {
        applyData(row, args.update || {});
        return projRow(row, model, args.select, args.include);
      }
      return create(model, { data: args.create, include: args.include, select: args.select });
    },
    delete(args: any) {
      const row = store[model].find((r) => matchesWhere(r, args.where, model));
      if (!row) throw new Error(`${model}: record to delete not found`);
      cascadeDelete(model, row.id);
      return row;
    },
    deleteMany(args: any = {}) {
      const rows = store[model].filter((r) => matchesWhere(r, args.where, model));
      for (const r of rows) cascadeDelete(model, r.id);
      return { count: rows.length };
    },
    count(args: any = {}) {
      return store[model].filter((r) => matchesWhere(r, args.where, model)).length;
    },
  };
}

type Db = Record<string, ReturnType<typeof modelApi>>;

export const db: Db = Object.fromEntries(Object.keys(DEFAULTS).map((m) => [m, modelApi(m)])) as Db;

// ---------------------------------------------------------------------------
// Seed — rich Persian demo data (ported from prisma/seed.ts)
// ---------------------------------------------------------------------------
function seed() {
  // ---- users ----
  const admin = db.user.create({
    data: {
      id: "u_admin", phone: "09120000000", name: "مدیر دی‌صفارا", email: "admin@dsafara.com",
      role: "ADMIN", bio: "بنیان‌گذار و مدیر پلتفرم دی‌صفارا",
      avatar: "https://i.pravatar.cc/150?u=admin",
      wallet: { create: { id: "w_admin", balance: 0 } },
    },
  });
  const mentorUser = db.user.create({
    data: {
      id: "u_mentor1", phone: "09121111111", name: "امیرحسین رضایی", email: "mentor@dsafara.com",
      role: "MENTOR", bio: "تحلیلگر ارشد بازارهای مالی با ۱۲ سال سابقه معامله‌گری در فارکس و کریپتو. متخصص پرایس اکشن و اسمارت مانی کانسپت.",
      avatar: "https://i.pravatar.cc/150?u=mentor1",
      wallet: { create: { id: "w_mentor1", balance: 184500000 } },
    },
  });
  const mentor2 = db.user.create({
    data: {
      id: "u_mentor2", phone: "09122222222", name: "سارا محمدی", email: "sara@dsafara.com",
      role: "MENTOR", bio: "معامله‌گر حرفه‌ای طلا و شاخص‌ها، متخصص تحلیل چند زمانی و روانشناسی معامله‌گری.",
      avatar: "https://i.pravatar.cc/150?u=mentor2",
      wallet: { create: { id: "w_mentor2", balance: 96200000 } },
    },
  });
  const student = db.user.create({
    data: {
      id: "u_student", phone: "09123333333", name: "علی کریمی", email: "student@dsafara.com",
      role: "STUDENT", bio: "دانشجوی مسیر حرفه‌ای ترید",
      avatar: "https://i.pravatar.cc/150?u=student1",
      wallet: { create: { id: "w_student", balance: 2500000 } },
    },
  });

  const studentsData = [
    ["09124444444", "محمد حسینی"], ["09125555555", "رضا احمدی"], ["09126666666", "نگار صادقی"],
    ["09127777777", "فاطمه موسوی"], ["09128888888", "حسین قاسمی"], ["09129999999", "مریم رضوانی"],
    ["09121010101", "کیان مرادی"], ["09121212122", "الهام نوری"], ["09121414141", "پارسا کاظمی"],
    ["09121616162", "زهرا ابراهیمی"], ["09121818183", "سینا جعفری"], ["09122020204", "شیما توکلی"],
  ];
  const extraStudents: Row[] = [];
  for (let i = 0; i < studentsData.length; i++) {
    const [phone, name] = studentsData[i];
    extraStudents.push(
      db.user.create({
        data: {
          id: `u_st${i + 1}`, phone, name, role: "STUDENT",
          avatar: `https://i.pravatar.cc/150?u=st${i}`,
          createdAt: ago(30 - i * 2),
          wallet: { create: { id: `w_st${i + 1}`, balance: ((i * 7) % 3) * 500000 } },
        },
      })
    );
  }

  // ---- categories ----
  const catData = [
    ["تحلیل تکنیکال", "technical", "آموزش جامع تحلیل تکنیکال، پرایس اکشن و اندیکاتورها", "CandlestickChart"],
    ["مدیریت سرمایه", "risk-management", "اصل اسپرد ریسک، سایز پوزیشن و مدیریت سرمایه حرفه‌ای", "ShieldCheck"],
    ["روانشناسی ترید", "psychology", "تسلط بر ذهن، مدیریت احساسات و دیسیپلین معامله‌گری", "Brain"],
    ["بازار فارکس", "forex", "آموزش تخصصی بازار فارکس، جفت‌ارزها و سشن‌های معاملاتی", "Globe"],
    ["کریپتوکارنسی", "crypto", "بیت‌کوین، آلت‌کوین‌ها، دیفای و تحلیل آنچین", "Bitcoin"],
    ["بورس ایران", "bourse", "تحلیل بنیادی و تکنیکال بورس تهران و کدهای حقوقی", "Landmark"],
  ];
  const cats: Record<string, string> = {};
  for (const [title, slug, description, icon] of catData) {
    const c = db.category.create({ data: { id: `cat_${slug}`, title, slug, description, icon } });
    cats[slug] = c.id;
  }

  // ---- courses ----
  const courseData: Row[] = [
    {
      title: "دوره جامع پرایس اکشن صفر تا صد", slug: "price-action-full",
      description: "یادگیری کامل پرایس اکشن از مبانی تا ستاپ‌های پیشرفته، بدون نیاز به اندیکاتور",
      longDescription: "در این دوره شما با زبان خام بازار آشنا می‌شوید؛ از ساختار بازار و نواحی عرضه و تقاضا تا ستاپ‌های ورود پرایس اکشن با حد ضرر دقیق. این دوره برای کسانی طراحی شده که می‌خواهند بدون پیچیدگی اندیکاتورها، مستقیماً از حرکت قیمت معامله کنند.",
      cat: "technical", mentor: mentorUser.id, price: 4800000, oldPrice: 6900000,
      level: "INTERMEDIATE", durationHours: 32, rating: 4.9, studentsCount: 1240,
      image: "/images/course-price-action.png",
    },
    {
      title: "مدیریت سرمایه و ریسک حرفه‌ای", slug: "risk-management-pro",
      description: "فرمول‌های سایز پوزیشن، R:R و قوانین حفظ سرمایه برای معامله‌گران جدی",
      longDescription: "بزرگ‌ترین دلیل نابودی حساب‌ها، ندانستن مدیریت سرمایه است. در این دوره ریاضیات ریسک، مدل‌های سایز پوزیشن و ساخت پلن معاملاتی شخصی را به‌صورت عملی یاد می‌گیرید.",
      cat: "risk-management", mentor: mentor2.id, price: 2900000, oldPrice: 3900000,
      level: "BEGINNER", durationHours: 18, rating: 4.8, studentsCount: 980,
      image: "/images/course-risk.png",
    },
    {
      title: "اسمارت مانی کانسپت (SMC) پیشرفته", slug: "smc-advanced",
      description: "تحلیل نهادهای بزرگ، اردربلاک‌ها، FVG و لیکوییدیتی به سبک حرفه‌ای",
      longDescription: "اسمارت مانی کانسپت پرطرفدارترین متد تحلیل مدرن است. در این دوره اردربلاک، بریکر بلاک، FVG، لیکوییدیتی سوپ و پروب و مدل‌های ورود ICT را مرحله به مرحله تمرین می‌کنید.",
      cat: "technical", mentor: mentorUser.id, price: 6500000, oldPrice: 8900000,
      level: "ADVANCED", durationHours: 45, rating: 4.9, studentsCount: 760,
      image: "/images/course-smc.png",
    },
    {
      title: "روانشناسی معامله‌گری و ذهن میلیاردر", slug: "trading-psychology",
      description: "تسلط بر ترس و طمع، ساختن دیسیپلین و عادت‌های معامله‌گری برنده",
      longDescription: "بهترین استراتژی دنیا هم بدون ذهن آماده شکست می‌خورد. این دوره ترکیبی از علم روانشناسی، عادت‌سازی و تمرین‌های عملی برای ساختن ذهنیت معامله‌گر حرفه‌ای است.",
      cat: "psychology", mentor: mentor2.id, price: 1900000, oldPrice: null,
      level: "BEGINNER", durationHours: 12, rating: 4.7, studentsCount: 1520,
      image: "/images/course-psychology.png",
    },
    {
      title: "فارکس از صفر؛ شروع مسیر حرفه‌ای", slug: "forex-zero-to-hero",
      description: "آشنایی کامل با بازار فارکس، بروکرها، پلتفرم و اولین معامله",
      longDescription: "اگر تازه می‌خواهید وارد فارکس شوید، این دوره نقطه شروع شماست؛ از باز کردن حساب دمو و آشنایی با متاتریدر تا اجرای اولین معامله با ریسک کنترل‌شده.",
      cat: "forex", mentor: mentorUser.id, price: 0, oldPrice: null,
      level: "BEGINNER", durationHours: 9, rating: 4.8, studentsCount: 3260,
      image: "/images/course-forex.png", isFree: true,
    },
    {
      title: "تحلیل آنچین بیت‌کوین و آلت‌کوین‌ها", slug: "onchain-analysis",
      description: "خواندن داده‌های آنچین، شاخص‌های سیکل و شناسایی کف و سقف بازار کریپتو",
      longDescription: "داده‌های آنچین پنجره‌ای شفاف به رفتار نهنگ‌هاست. در این دوره شاخص‌های MVRV، SOPR، جریان صرافی‌ها و مدل‌های سیکلی بیت‌کوین را یاد می‌گیرید.",
      cat: "crypto", mentor: mentor2.id, price: 5200000, oldPrice: 7200000,
      level: "ADVANCED", durationHours: 28, rating: 4.8, studentsCount: 540,
      image: "/images/course-onchain.png",
    },
    {
      title: "تحلیل تکنیکال کلاسیک مدرن", slug: "classic-technical",
      description: "حم و مقاومت، خطوط روند، الگوهای قیمتی و اندیکاتورهای کلیدی",
      longDescription: "پایه هر تحلیل‌گری، تکنیکال کلاسیک است. الگوهای هارمونیک، کلاسیک، اندیکاتورهای مومنتوم و ترکیب چند زمانی را با صدها مثال واقعی یاد می‌گیرید.",
      cat: "technical", mentor: mentorUser.id, price: 3500000, oldPrice: 4500000,
      level: "BEGINNER", durationHours: 24, rating: 4.7, studentsCount: 2130,
      image: "/images/course-classic.png",
    },
    {
      title: "استراتژی طلا (XAUUSD) و شاخص‌ها", slug: "gold-strategy",
      description: "ستاپ‌های اختصاصی معامله طلا با در نظر گرفتن خبرهای ماکرو",
      longDescription: "طلا پرمتحرک‌ترین بازار برای معامله‌گران روزانه است. در این دوره سشن لندن و نیویورک، تاثیر داده‌های اقتصادی آمریکا و ستاپ‌های اختصاصی XAUUSD را می‌آموزید.",
      cat: "forex", mentor: mentor2.id, price: 4200000, oldPrice: 5600000,
      level: "INTERMEDIATE", durationHours: 21, rating: 4.9, studentsCount: 870,
      image: "/images/course-gold.png",
    },
  ];

  const courses: Record<string, string> = {};
  for (const c of courseData) {
    const created = db.course.create({
      data: {
        id: `c_${c.slug}`, title: c.title, slug: c.slug, description: c.description,
        longDescription: c.longDescription, image: c.image,
        level: c.level, price: c.price, oldPrice: c.oldPrice ?? null,
        durationHours: c.durationHours, rating: c.rating, studentsCount: c.studentsCount,
        isFree: !!c.isFree, categoryId: cats[c.cat], mentorId: c.mentor,
        createdAt: ago(60),
      },
    });
    courses[c.slug] = created.id;
  }

  // ---- chapters + lessons ----
  const chapterPlan: Record<string, string[][]> = {
    "price-action-full": [
      ["مبانی ساختار بازار", ["زبان خام بازار چیست؟", "شناسایی روند و ساختار سوینگ", "حم و مقاومت داینامیک", "تمرین: رسم ساختار روی ۱۰ چارت"]],
      ["نواحی عرضه و تقاضا", ["منطق پیدایش نواحی", "شناسایی نواحی تازه (Fresh)", "اصلاحیه یا بازگشت؟", "تمرین: مارک‌آپ نواحی"]],
      ["ستاپ‌های ورود", ["ستاپ پین‌بار در نواحی", "ستاپ انگالفینگ", "مدل ورود چند زمانی", "تمرین: بک‌تست ۵۰ معامله"]],
      ["مدیریت معامله", ["حد ضرر علمی", "پارشیال و تریلینگ", "ژورنال‌نویسی حرفه‌ای"]],
    ],
    "forex-zero-to-hero": [
      ["شروع مسیر", ["فارکس چیست و چه کسانی معامله می‌کنند؟", "بروکر معتبر را چطور انتخاب کنیم؟", "نصب و راه‌اندازی متاتریدر ۵"]],
      ["اولین قدم‌ها", ["مفاهیم پیپ، لات و اسپرد", "باز کردن حساب دمو", "اجرای اولین معامله واقعی روی دمو"]],
    ],
  };
  for (const [slug, chapters] of Object.entries(chapterPlan)) {
    for (let ci = 0; ci < chapters.length; ci++) {
      const [chTitle, lessons] = chapters[ci];
      const ch = db.chapter.create({ data: { id: `ch_${slug}_${ci}`, title: chTitle, order: ci, courseId: courses[slug] } });
      for (let li = 0; li < lessons.length; li++) {
        db.lesson.create({
          data: {
            id: `l_${slug}_${ci}_${li}`, title: lessons[li], order: li, chapterId: ch.id,
            durationMin: 8 + ((ci * 7 + li * 5) % 25),
            isFree: slug === "forex-zero-to-hero" && ci === 0 && li < 2,
            description: "در این درس به‌صورت گام‌به‌گام همراه با مثال‌های واقعی چارت مفهوم را یاد می‌گیرید.",
          },
        });
      }
    }
  }

  // ---- learning paths ----
  const pathData = [
    {
      title: "مسیر صفر تا معامله‌گر حرفه‌ای", slug: "zero-to-pro",
      description: "مسیر کامل برای کسانی که از صفر شروع می‌کنند و می‌خواهند به معامله‌گری منظم و سودده برسند؛ از مبانی تکنیکال تا روانشناسی و مدیریت سرمایه.",
      icon: "Rocket", level: "BEGINNER", color: "#19b887",
      audience: "افرادی که تازه وارد بازارهای مالی شده‌اند",
      objective: "توانایی تحلیل مستقل چارت و اجرای معاملات با ریسک کنترل‌شده",
      courseSlugs: ["forex-zero-to-hero", "classic-technical", "risk-management-pro", "trading-psychology"],
    },
    {
      title: "مسیر تخصصی پرایس اکشن و SMC", slug: "pa-smc-master",
      description: "برای معامله‌گرانی که می‌خواهند تحلیل بدون اندیکاتور و مبتنی بر رفتار نهادهای بزرگ را تخصصی دنبال کنند.",
      icon: "Target", level: "ADVANCED", color: "#38bdf8",
      audience: "معامله‌گران با حداقل ۶ ماه تجربه",
      objective: "تسلط بر ستاپ‌های پرایس اکشن و اسمارت مانی با وین‌ریت بالای ۵۰٪",
      courseSlugs: ["price-action-full", "smc-advanced", "gold-strategy"],
    },
    {
      title: "مسیر کریپتو و تحلیل آنچین", slug: "crypto-onchain",
      description: "مسیر تخصصی بازار کریپتو از مبانی بلاکچین تا تحلیل آنچین و پیدا کردن نقاط چرخش سیکل.",
      icon: "Bitcoin", level: "INTERMEDIATE", color: "#f5b544",
      audience: "علاقه‌مندان به بازار کریپتوکارنسی",
      objective: "تحلیل مستقل بیت‌کوین و آلت‌کوین‌ها با داده‌های آنچین",
      courseSlugs: ["classic-technical", "onchain-analysis", "risk-management-pro"],
    },
  ];
  for (const p of pathData) {
    const path = db.learningPath.create({
      data: {
        id: `p_${p.slug}`, title: p.title, slug: p.slug, description: p.description, icon: p.icon,
        level: p.level, audience: p.audience, objective: p.objective, color: p.color,
      },
    });
    for (let i = 0; i < p.courseSlugs.length; i++) {
      db.pathCourse.create({ data: { id: `pc_${p.slug}_${i}`, pathId: path.id, courseId: courses[p.courseSlugs[i]], order: i } });
    }
  }

  // ---- enrollments ----
  for (let i = 0; i < extraStudents.length; i++) {
    const st = extraStudents[i];
    const n = 2 + (i % 4);
    for (let j = 0; j < n; j++) {
      const cid = Object.values(courses)[(i * 3 + j * 5) % Object.values(courses).length];
      db.enrollment.create({
        data: { id: `en_${st.id}_${j}`, userId: st.id, courseId: cid, progress: ((i * 17 + j * 29) % 100), createdAt: ago(40 - i * 2) },
      });
    }
  }
  // demo student gets clean enrollments
  for (const [slug, prog] of [["price-action-full", 68], ["risk-management-pro", 100], ["forex-zero-to-hero", 42], ["classic-technical", 15]] as const) {
    db.enrollment.create({ data: { id: `en_demo_${slug}`, userId: student.id, courseId: courses[slug], progress: prog, createdAt: ago(25) } });
  }

  // ---- assignments / submissions ----
  const asg = db.assignment.create({
    data: {
      id: "asg_1", courseId: courses["price-action-full"], title: "تمرین شناسایی نواحی عرضه و تقاضا",
      description: "روی ۵ چارت H4 جفت‌ارز EURUSD نواحی تازه عرضه و تقاضا را مارک‌آپ کنید و تصویر آن را همراه توضیح ارسال کنید.",
      dueDate: ahead(5), maxScore: 100,
    },
  });
  db.submission.create({
    data: {
      id: "sub_1", assignmentId: asg.id, userId: student.id,
      content: "سلام، ۵ چارت H4 را مارک‌آپ کردم. نواحی روی EURUSD و GBPUSD مشخص شده. یک سوال دارم: در ناحیه دوم چارت سوم، آیا ناحیه چون تعویض نشده هنوز معتبر محسوب می‌شود؟",
      status: "GRADED", score: 88, feedback: "عالی بود علی جان! مارک‌آپ‌ها دقیق است. جواب سوالت: ناحیه تا زمانی که پرایس دوباره آن را تست نکرده تازه محسوب می‌شود. فقط دقت کن در چارت ۴ ناحیه کمی به سقف نزدیک است.",
      createdAt: ago(3), gradedAt: ago(1),
    },
  });
  const asg2 = db.assignment.create({
    data: {
      id: "asg_2", courseId: courses["risk-management-pro"], title: "محاسبه سایز پوزیشن در ۱۰ سناریو",
      description: "برای ۱۰ سناریوی داده‌شده با حساب ۵۰۰۰ دلاری و ریسک ۱٪، سایز پوزیشن را محاسبه کنید.",
      dueDate: ahead(9), maxScore: 100,
    },
  });

  // ---- exams ----
  const exam = db.exam.create({
    data: {
      id: "exam_1", courseId: courses["price-action-full"], title: "آزمون فصل ۲: نواحی عرضه و تقاضا",
      description: "۱۵ سوال چهارگزینه‌ای از مباحث فصل دوم", durationMin: 20,
    },
  });
  const qData = [
    ["ناحیه عرضه (Supply) در کدام حالت شکل می‌گیرد؟", ["قبل از ریزش شارپ و صعودی", "قبل از ریزش شارپ و نزولی", "بعد از consolidation طولانی", "هیچ‌کدام"], 1],
    ["ناحیه Fresh به چه ناحیه‌ای گفته می‌شود؟", ["ناحیه‌ای که چند بار تست شده", "ناحیه‌ای که هنوز دوباره تست نشده", "ناحیه‌ای که پر شده", "ناحیه‌ای در تایم پایین"], 1],
    ["کدام گزینه نشانه قوت یک ناحیه تقاضاست؟", ["خروج آرام قیمت", "ریزش شارپ و مواج قبل از صعود", "حجم کم معاملات", "نزدیک بودن به خط روند"], 1],
    ["زمان ورود بهتر با ستاپ پین‌بار کدام است؟", ["وسط رنج", "در نواحی کلیدی پس از واکنش", "هرجا پین‌بار دیدیم", "فقط در تایم H1"], 1],
  ];
  for (let i = 0; i < qData.length; i++) {
    const [text, options, answer] = qData[i] as [string, string[], number];
    db.question.create({ data: { id: `q_${i + 1}`, text, options: JSON.stringify(options), answer, score: 25, examId: exam.id } });
  }
  db.examAttempt.create({
    data: {
      id: "att_1", examId: exam.id, userId: student.id, score: 75, maxScore: 100,
      answers: JSON.stringify({ detail: { q_1: true, q_2: true, q_3: true, q_4: false } }),
      createdAt: ago(4),
    },
  });

  // ---- trading journal (demo student) ----
  const journalData: [string, string, number, number, number, number, number, number, string | null, string | null, string | null, number][] = [
    ["XAUUSD", "LONG", 2312.5, 2338.2, 0.1, 2304.0, 2355.0, 257, "OB+فایب", "ستاپ اردربلاک H1 بعد از سشن لندن عالی اجرا شد", "آرام", 2],
    ["EURUSD", "SHORT", 1.0842, 1.0798, 0.3, 1.0885, 1.0780, 132, "بریکر بلاک", "خبر NFP بود، ریسک کمتر گرفتم", "کمی عجول", 1],
    ["BTCUSDT", "LONG", 61200, 60450, 0.05, 60100, 63500, -375, "فایب", "ورود زودهنگام؛ صبر نمی‌کردم کلوز FVG بخوره", "FOMO", 0],
    ["GBPUSD", "SHORT", 1.2715, 1.2680, 0.2, 1.2755, 1.2650, 70, "پین‌بار ناحیه", null, "متمرکز", 3],
    ["XAUUSD", "SHORT", 2344.0, 2351.5, 0.1, 2350.0, 2320.0, -75, "لیکوییدیتی سوپ", "حد ضرر خورد ولی ستاپ درست بود", "بی‌حوصلگی", 4],
    ["US30", "LONG", 38450, 38690, 0.1, 38380, 38900, 240, "continuation", "پولبک به OB روزانه", "با اعتماد", 5],
    ["EURUSD", "LONG", 1.0810, 1.0838, 0.3, 1.0790, 1.0860, 84, "فایب", null, "آرام", 6],
    ["XAUUSD", "LONG", 2308.0, 2329.4, 0.15, 2302.0, 2340.0, 321, "OB+فایب", "بهترین اجرای این ماه", "متمرکز", 7],
  ];
  for (let i = 0; i < journalData.length; i++) {
    const [symbol, dir, entry, exit, lot, sl, tp, pnl, setup, notes, emotion, d] = journalData[i];
    db.tradeJournalEntry.create({
      data: {
        id: `j_demo_${i}`, userId: student.id, symbol, direction: dir, entryPrice: entry, exitPrice: exit,
        lotSize: lot, stopLoss: sl, takeProfit: tp, pnl, pnlPercent: (pnl / 1000) * 100,
        status: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN", setup, notes, emotion,
        tradeDate: ago(d), createdAt: ago(d),
      },
    });
  }
  // journals for other students (admin stats)
  const symbols = ["XAUUSD", "EURUSD", "BTCUSDT", "GBPUSD"];
  for (let s = 0; s < 6; s++) {
    const st = extraStudents[s];
    for (let i = 0; i < 3; i++) {
      const pnl = [120, -90, 240, 60, -180, 310, -40, 150, 90][s * 3 + i] ?? 50;
      db.tradeJournalEntry.create({
        data: {
          id: `j_${st.id}_${i}`, userId: st.id, symbol: symbols[(s + i) % 4],
          direction: (s + i) % 2 === 0 ? "LONG" : "SHORT",
          entryPrice: 100 + ((s * 13 + i * 7) % 100), exitPrice: 100 + ((s * 11 + i * 5) % 100),
          lotSize: 0.1, pnl, pnlPercent: 1, status: pnl > 0 ? "WIN" : "LOSS",
          tradeDate: ago(i * 3 + 1), createdAt: ago(i * 3 + 1),
        },
      });
    }
  }

  // ---- trading exercises ----
  db.tradingExercise.create({
    data: {
      id: "ex_1", userId: student.id, symbol: "XAUUSD", timeframe: "1H",
      taskTitle: "مارک‌آپ نواحی کلیدی و سناریوی معاملاتی هفته",
      description: "چارت ۱ ساعته طلا را با نواحی عرضه/تقاضا و مسیر احتمالی مارک‌آپ کنید.",
      analysis: "سناریوی اصلی: پولبک به اردربلاک H4 در ۲۳۱۰ و ادامه صعود. سناریوی دوم: شکست کف و جمع‌آوری لیکوییدیتی.",
      checklist: JSON.stringify(["ساختار بالاتر تایم مشخص شد", "ناحیه کلیدی مارک شد", "نقطه ورود و استاپ تعیین شد", "R:R حداقل ۱:۲"]),
      status: "REVIEWED", mentorScore: 92,
      mentorFeedback: "مارک‌آپ دقیق و منطقی. فقط سناریوی دوم رو هم با حجم‌ها چک کن. آفرین!",
      createdAt: ago(6), reviewedAt: ago(5),
    },
  });
  db.tradingExercise.create({
    data: {
      id: "ex_2", userId: student.id, symbol: "EURUSD", timeframe: "4H",
      taskTitle: "تمرین شناسایی بریکر بلاک",
      description: "دو بریکر بلاک معتبر در چارت ۴ ساعته یورودلار پیدا و مارک کنید.",
      analysis: "بریکر صعودی بعد از جمع لیکوییدیتی کف روزانه و بریکر نزولی در سقف هفتگی را مارک کردم.",
      checklist: JSON.stringify(["ساختار بالاتر تایم مشخص شد", "ناحیه کلیدی مارک شد", "نقطه ورود و استاپ تعیین شد"]),
      status: "PENDING", createdAt: ago(1),
    },
  });

  // ---- mentoring ----
  const planData = [
    ["منتورینگ اختصاصی یک‌ماهه", "mentoring-1m", "پلن فشرده یک‌ماهه با ۲ جلسه در هفته، بررسی ژورنال و تمرین‌های معاملاتی و پلن شخصی‌سازی شده.", 8500000, 30, ["۲ جلسه آنلاین در هفته", "بررسی روزانه ژورنال معاملات", "دسترسی مستقیم در تلگرام", "پلن معاملاتی شخصی"], 2],
    ["منتورینگ سه‌ماهه حرفه‌ای", "mentoring-3m", "مسیر کامل تبدیل شدن به معامله‌گر مستقل در ۳ ماه با پشتیبانی کامل و پروژه‌های عملی.", 22000000, 90, ["۲ جلسه آنلاین در هفته", "بررسی هفتگی عملکرد", "بک‌تست هدایت‌شده", "پلن معاملاتی + روانشناسی", "دسترسی VIP به دوره‌ها"], 2],
    ["جلسه رفع اشکال تکی", "mentoring-single", "یک جلسه ۹۰ دقیقه‌ای برای حل مسئله مشخص در تحلیل یا معامله‌گری شما.", 1500000, 1, ["جلسه ۹۰ دقیقه‌ای آنلاین", "ضبط جلسه", "چک‌لیست اقدام"], 1],
  ] as const;
  const plans: Row[] = [];
  for (let i = 0; i < planData.length; i++) {
    const [title, slug, description, price, durationDays, features, spw] = planData[i];
    plans.push(
      db.mentoringPlan.create({
        data: { id: `plan_${slug}`, title, slug, description, price, durationDays, features: JSON.stringify(features), sessionsPerWeek: spw },
      })
    );
  }
  db.mentoringPlanEnrollment.create({
    data: { id: "mpe_1", planId: plans[0].id, mentorId: mentorUser.id, userId: student.id, status: "ACCEPTED", createdAt: ago(20) },
  });

  db.mentorSession.create({
    data: {
      id: "ms_1", title: "جلسه هفتم: بازبینی معاملات هفته", studentId: student.id, mentorId: mentorUser.id,
      startTime: ahead(1, 3), durationMin: 60, status: "SCHEDULED",
      notes: "تمرکز روی مدیریت پارشیال و بهبود ورودهای سشن لندن",
    },
  });
  db.mentorSession.create({
    data: {
      id: "ms_2", title: "جلسه ششم: تحلیل چند زمانی", studentId: student.id, mentorId: mentorUser.id,
      startTime: ago(6), durationMin: 75, status: "COMPLETED",
      notes: "پیشرفت خوب در مارک‌آپ نواحی؛ تمرین بک‌تست ۲۰ معامله داده شد",
    },
  });
  db.mentorSession.create({
    data: {
      id: "ms_3", title: "جلسه پنجم: روانشناسی و دیسیپلین", studentId: student.id, mentorId: mentor2.id,
      startTime: ago(12), durationMin: 60, status: "COMPLETED", notes: "کار روی FOMO بعد از ضرر",
    },
  });
  db.mentorSession.create({
    data: {
      id: "ms_4", title: "جلسه هشتم: بک‌تست استراتژی طلا", studentId: student.id, mentorId: mentorUser.id,
      startTime: ahead(5, 2), durationMin: 90, status: "SCHEDULED",
    },
  });

  db.weeklyReport.create({
    data: {
      id: "wr_1", studentId: student.id, mentorId: mentorUser.id, weekLabel: "هفته دوم آذر",
      summary: "علی این هفته ۹ معامله ثبت کرد؛ وین‌ریت ۶۷٪ و پیروی از پلن بسیار بهتر شده. تمرکز هفته بعد: کاهش حجم در روزهای خبری و تکمیل بک‌تست فصل سوم.",
      progress: 72, createdAt: ago(2),
    },
  });

  // ---- products ----
  const prodData = [
    ["اندیکاتور اختصاصی Supply & Demand دی‌صفارا", "sd-indicator", "اندیکاتور تشخیص خودکار نواحی عرضه و تقاضا برای متاتریدر ۵ و تریدینگ‌ویو با آلارم.", 2200000, "INDICATOR"],
    ["کتاب الکترونیکی نقشه راه معامله‌گر", "trader-roadmap-book", "کتاب ۱۸۰ صفحه‌ای شامل مسیر کامل یادگیری، چک‌لیست‌ها و قالب ژورنال.", 480000, "BOOK"],
    ["قالب ژورنال معاملات اکسل + نوتن", "journal-template", "قالب حرفه‌ای ثبت معاملات با داشبورد آماری خودکار برای اکسل و نوتن.", 320000, "DIGITAL"],
    ["پک ۱۲۰ بک‌دراپ چارت واقعی برای تمرین", "backdrop-pack", "۱۲۰ نمونه چارت واقعی بدون نتیجه برای تمرین تحلیل و بک‌تست.", 690000, "DIGITAL"],
  ] as const;
  for (const [title, slug, description, price, type] of prodData) {
    db.product.create({ data: { id: `prod_${slug}`, title, slug, description, price, type } });
  }

  // ---- orders ----
  const order = db.order.create({
    data: {
      id: "o_1042", orderNo: "DS-1042", userId: student.id, totalAmount: 4800000, status: "PAID",
      createdAt: ago(25), paidAt: ago(25), refId: "884213", couponCode: null,
    },
  });
  db.orderItem.create({ data: { id: "oi_1", orderId: order.id, courseId: courses["price-action-full"], title: "دوره جامع پرایس اکشن صفر تا صد", price: 4800000 } });
  const order2 = db.order.create({
    data: { id: "o_1057", orderNo: "DS-1057", userId: student.id, totalAmount: 2900000, status: "PAID", createdAt: ago(18), paidAt: ago(18), refId: "912840" },
  });
  db.orderItem.create({ data: { id: "oi_2", orderId: order2.id, courseId: courses["risk-management-pro"], title: "مدیریت سرمایه و ریسک حرفه‌ای", price: 2900000 } });
  const order3 = db.order.create({
    data: { id: "o_1071", orderNo: "DS-1071", userId: student.id, totalAmount: 480000, status: "PENDING", createdAt: ago(1) },
  });
  db.orderItem.create({ data: { id: "oi_3", orderId: order3.id, title: "کتاب الکترونیکی نقشه راه معامله‌گر", price: 480000 } });

  // orders from other students (revenue stats, spread over ~5 weeks)
  for (let i = 0; i < 18; i++) {
    const st = extraStudents[i % extraStudents.length];
    const c = courseData[i % courseData.length];
    const amt = c.price || 1000000;
    const paid = i % 7 !== 0;
    db.order.create({
      data: {
        id: `o_2k${i}`, orderNo: `DS-${2000 + i}`, userId: st.id, totalAmount: amt,
        status: paid ? "PAID" : "PENDING",
        createdAt: ago(i * 2 + 1), paidAt: paid ? ago(i * 2 + 1) : null,
        items: { create: { courseId: courses[c.slug as string], title: c.title, price: amt } },
      },
    });
  }

  // ---- wallet transactions ----
  const txData: [string, string, number, string, number][] = [
    [student.id, "DEPOSIT", 5000000, "شارژ کیف پول درگاه زرین‌پال", 26],
    [student.id, "PURCHASE", -4800000, "خرید دوره جامع پرایس اکشن", 25],
    [student.id, "PURCHASE", -2900000, "خرید دوره مدیریت سرمایه", 18],
    [student.id, "DEPOSIT", 5200000, "شارژ کیف پول", 17],
    [mentorUser.id, "COMMISSION", 1440000, "کمیسیون فروش دوره پرایس اکشن", 25],
    [mentorUser.id, "WITHDRAWAL", -2000000, "تسویه درخواستی منتور", 10],
  ];
  for (let i = 0; i < txData.length; i++) {
    const [uid, type, amount, description, d] = txData[i];
    db.financialTransaction.create({ data: { id: `tx_${i}`, userId: uid, type, amount, description, createdAt: ago(d) } });
  }
  db.commission.create({ data: { id: "cm_1", mentorId: mentorUser.id, amount: 1440000, percent: 30, status: "SETTLED", createdAt: ago(25) } });
  db.commission.create({ data: { id: "cm_2", mentorId: mentorUser.id, amount: 870000, percent: 30, status: "PENDING", createdAt: ago(2) } });
  db.commission.create({ data: { id: "cm_3", mentorId: mentor2.id, amount: 690000, percent: 30, status: "PENDING", createdAt: ago(3) } });

  // ---- tickets ----
  const t1 = db.ticket.create({
    data: { id: "tk_1", subject: "مشکل در پخش ویدیوی درس چهارم", userId: student.id, category: "TECHNICAL", priority: "HIGH", status: "ANSWERED", createdAt: ago(2) },
  });
  db.ticketMessage.createMany({
    data: [
      { id: "tm_1", ticketId: t1.id, body: "سلام، ویدیوی درس چهارم فصل دوم بعد از دقیقه ۱۰ قطع می‌شه. چند بار هم کش رو پاک کردم.", isStaff: false, createdAt: ago(2) },
      { id: "tm_2", ticketId: t1.id, body: "سلام علی عزیز، ممنون از اطلاع‌رسانی. فایل جایگزین آپلود شد، لطفاً یکبار دیگر امتحان کنید. اگر مشکل ادامه داشت اطلاع بدید. 🙏", isStaff: true, createdAt: ago(1) },
    ],
  });
  const t2 = db.ticket.create({
    data: { id: "tk_2", subject: "درخواست فاکتور رسمی برای دوره", userId: student.id, category: "BILLING", priority: "MEDIUM", status: "OPEN", createdAt: ago(1) },
  });
  db.ticketMessage.create({ data: { id: "tm_3", ticketId: t2.id, body: "سلام، برای دوره پرایس اکشن فاکتور رسمی با مهر نیاز دارم.", isStaff: false, createdAt: ago(1) } });
  const t3 = db.ticket.create({
    data: { id: "tk_3", subject: "سوال درباره تمدید منتورینگ", userId: extraStudents[2].id, category: "GENERAL", priority: "LOW", status: "OPEN", createdAt: ago(0) },
  });
  db.ticketMessage.create({ data: { id: "tm_4", ticketId: t3.id, body: "سلام، پلن سه‌ماهه من به زودی تموم میشه، شرایط تمدید چطوره؟", isStaff: false, createdAt: ago(0) } });

  // ---- messages ----
  db.message.createMany({
    data: [
      { id: "msg_1", senderId: mentorUser.id, receiverId: student.id, conversationId: `${mentorUser.id}:${student.id}`, body: "سلام علی جان 👋 تمرین بک‌تست این هفته رو شروع کردی؟", createdAt: ago(0, 5) },
      { id: "msg_2", senderId: student.id, receiverId: mentorUser.id, conversationId: `${mentorUser.id}:${student.id}`, body: "سلام استاد، بله ۱۲ تا از ۲۰ معامله رو انجام دادم، فردا کاملش می‌کنم.", createdAt: ago(0, 4) },
      { id: "msg_3", senderId: mentorUser.id, receiverId: student.id, conversationId: `${mentorUser.id}:${student.id}`, body: "عالیه! جلسه هفته روی مدیریت پارشیال تمرکز داریم، چارت‌هات رو آماده داشته باش.", createdAt: ago(0, 3) },
    ],
  });

  // ---- notifications ----
  db.notification.createMany({
    data: [
      { id: "n_1", userId: student.id, title: "تکلیف جدید ثبت شد", body: "تمرین «محاسبه سایز پوزیشن» تا ۹ روز دیگر مهلت دارد.", type: "ASSIGNMENT", createdAt: ago(1) },
      { id: "n_2", userId: student.id, title: "جلسه منتورینگ فردا", body: "جلسه هفتم با استاد رضایی فردا ساعت ۱۸:۰۰ برگزار می‌شود.", type: "SESSION", createdAt: ago(0, 6) },
      { id: "n_3", userId: student.id, title: "پرداخت موفق", body: "پرداخت شما برای دوره مدیریت سرمایه با موفقیت انجام شد.", type: "PAYMENT", isRead: true, createdAt: ago(18) },
      { id: "n_4", userId: student.id, title: "درس جدید اضافه شد", body: "درس «مدل ورود چند زمانی» به دوره پرایس اکشن اضافه شد.", type: "COURSE", createdAt: ago(3) },
      { id: "n_5", userId: student.id, title: "بازخورد منتور روی تمرین شما", body: "امیرحسین رضایی تمرین XAUUSD شما را با نمره ۹۲ بررسی کرد.", type: "ASSIGNMENT", createdAt: ago(5) },
      { id: "n_6", userId: admin.id, title: "گزارش فروش روزانه", body: "دیروز ۴ سفارش جدید به ارزش ۱۲,۸۰۰,۰۰۰ تومان ثبت شد.", type: "SYSTEM", createdAt: ago(0, 2) },
    ],
  });

  // ---- blog ----
  const blogData = [
    ["راهنمای کامل ساخت پلن معاملاتی شخصی", "trading-plan-guide", "تحلیل بازار", "پلن معاملاتی چیست و چطور یک پلن شخصی‌سازی‌شده بنویسیم که واقعاً به آن پایبند بمانیم؟ در این مقاله قالب کامل + مثال عملی ارائه می‌دهیم.", 8, ago(2)],
    ["۵ اشتباه مرگبار در مدیریت سرمایه", "risk-management-mistakes", "مدیریت سرمایه", "ریسک بیش از حد، میارسینگ بدون محاسبه، نداشتن حد ضرر و… این اشتباهات حساب‌های زیادی را نابود کرده‌اند. بیاموزید چطور از آن‌ها دوری کنید.", 6, ago(5)],
    ["اسمارت مانی کانسپت؛ واقعیت یا شعار؟", "smc-reality", "تحلیل بازار", "بررسی منصفانه SMC: چه بخش‌هایی از این متد واقعاً کار می‌کند و کجاها در توهم می‌افتیم؟ با مثال‌های چارت واقعی.", 11, ago(9)],
    ["چطور در سشن لندن معامله کنیم؟", "london-session", "استراتژی", "سشن لندن پرنوسان‌ترین ساعت‌های بازار است. ستاپ‌های اختصاصی این سشن و نکات مدیریت ریسک آن را مرور می‌کنیم.", 7, ago(14)],
    ["روانشناسی ضرر؛ چطور بعد از لوز بازی کنیم؟", "loss-psychology", "روانشناسی", "ضرر بخش جدایی‌ناپذیر معامله‌گری است، اما واکنش ما به آن تعیین‌کننده است. راهکارهای علمی برای برگشت به مسیر.", 9, ago(20)],
    ["چک‌لیست قبل از هر معامله", "pre-trade-checklist", "استراتژی", "قبل از کلیک روی دکمه خرید/فروش، این ۱۲ مورد را چک کنید. چک‌لیست قابل چاپ هم پیوست مقاله است.", 4, ago(26)],
  ] as const;
  for (let i = 0; i < blogData.length; i++) {
    const [title, slug, category, excerpt, readTimeMin, createdAt] = blogData[i];
    db.blogPost.create({
      data: {
        id: `bp_${slug}`, title, slug, category, excerpt, readTimeMin, createdAt,
        content: `${excerpt}\n\n## چرا این موضوع مهم است؟\nدر بازارهای مالی، تفاوت بین معامله‌گر موفق و ناموفق معمولاً در جزئیات اجرا است. در این مقاله تلاش کرده‌ایم مهم‌ترین نکات کاربردی را بدون حاشیه جمع‌بندی کنیم.\n\n## نکات کلیدی\n- ابتدا ساختار تایم بالاتر را مشخص کنید\n- ریسک هر معامله را حداکثر ۱ تا ۲ درصد حساب قرار دهید\n- ژورنال‌نویسی را جدی بگیرید؛ داده‌ها دروغ نمی‌گویند\n- بعد از هر ستاپ، نتیجه را با پلن مقایسه کنید نه با احساسات\n\n## جمع‌بندی\nمسیر حرفه‌ای شدن مسیر تمرین و تکرار هوشمندانه است. اگر این مقاله برایتان مفید بود، آن را با هم‌مسیرهایتان به اشتراک بگذارید و در دوره‌های تخصصی دی‌صفارا همراه ما باشید.`,
        views: 400 + ((i * 733) % 4000),
      },
    });
  }

  // ---- testimonials / faq / resources ----
  const testiData = [
    ["امیر محمدی", "دانشجوی مسیر حرفه‌ای", "بعد از دو سال سردرگمی، با منتورینگ دی‌صفارا بالاخره فهمیدم مشکل کجاست: نداشتن پلن. الان سه ماهه پیوسته سودده‌ام.", 5],
    ["نیلوفر احمدی", "دانشجوی دوره پرایس اکشن", "بهترین بخش کار، ژورنال معاملات و بازخورد منتوره. هر هفته می‌فهمم دقیقاً کجا اشتباه کردم.", 5],
    ["سعید رحیمی", "تریدر فارکس", "ورک‌اسپیس معاملاتی سایت فوق‌العاده‌ست؛ تمرین‌هام رو مستقیم روی چارت انجام می‌دم و استاد مارک‌آپم رو اصلاح می‌کنه.", 5],
    ["مریم کاظمی", "دانشجوی SMC", "پشتیبانی واقعاً سریعه و محتوا بی‌نظیر. از صفر شروع کردم و الان تحلیل مستقل انجام می‌دم.", 4],
    ["حسین توکلی", "معامله‌گر طلا", "استراتژی طلای دی‌صفارا نگاهم رو به XAUUSD کاملاً عوض کرد. ریسک به ریوارد معاملاتم دو برابر شد.", 5],
  ] as const;
  for (let i = 0; i < testiData.length; i++) {
    const [name, role, content, rating] = testiData[i];
    db.testimonial.create({ data: { id: `ts_${i}`, name, role, content, rating } });
  }

  const faqData = [
    ["آیا برای شروع به دانش قبلی نیاز دارم؟", "خیر. مسیر «صفر تا معامله‌گر حرفه‌ای» دقیقاً برای افراد بدون پیش‌زمینه طراحی شده و از مفاهیم پایه شروع می‌کند.", "دوره‌ها"],
    ["دوره‌ها به‌صورت حضوری است یا آنلاین؟", "تمام دوره‌ها و جلسات منتورینگ به‌صورت آنلاین برگزار می‌شوند و ویدیوها به‌صورت همیشگی در پنل شما در دسترس است.", "دوره‌ها"],
    ["اگر از دوره راضی نباشم امکان بازگشت وجه هست؟", "بله؛ تا ۷ روز پس از خرید، اگر کمتر از ۲۰٪ دوره را مشاهده کرده باشید، وجه به‌طور کامل بازگردانده می‌شود.", "پرداخت"],
    ["منتورینگ چطور برگزار می‌شود؟", "پس از ثبت‌نام، منتور متناسب با سطح شما تعیین می‌شود و جلسات هفتگی از طریق پنل و ویدئوکنفرانس برگزار می‌گردد.", "منتورینگ"],
    ["حداقل سرمایه برای شروع معامله چقدر است؟", "برای یادگیری، حساب دمو کافی است. برای ورود به بازار واقعی پیشنهاد ما شروع با سرمایه‌ای است که از دست رفتنش آسیب جدی به زندگی‌تان نزند.", "عمومی"],
    ["آیا بعد از دوره مدرک می‌گیرم؟", "بله، پس از اتمام دوره و قبولی در آزمون پایانی، گواهینامه معتبر دی‌صفارا با سری‌ال یکتا صادر می‌شود.", "دوره‌ها"],
  ] as const;
  for (let i = 0; i < faqData.length; i++) {
    const [question, answer, category] = faqData[i];
    db.faq.create({ data: { id: `faq_${i}`, question, answer, category, order: i } });
  }

  const resData = [
    ["چک‌لیست PDF قبل از معامله", "۱۲ مورد ضروری که قبل از هر ورود باید چک کنید", "PDF", "۱.۲ مگابایت"],
    ["قالب اکسل ژورنال معاملات", "ژورنال ساده با محاسبات خودکار وین‌ریت و دراودان", "PDF", "۸۴۰ کیلوبایت"],
    ["ویدیوی رایگان: مقدمه پرایس اکشن", "اولین درس دوره پرایس اکشن به‌صورت رایگان", "VIDEO", "۲۵ دقیقه"],
    ["راهنمای انتخاب بروکر معتبر", "معیارهای امنیت، اسپرد و برداشت وجه", "PDF", "۹۸۰ کیلوبایت"],
    ["چارت تمرینی هفتگی", "هر هفته یک چارت واقعی برای تمرین تحلیل با پاسخ تشریحی", "PDF", "۶۴۰ کیلوبایت"],
  ] as const;
  const resDownloads = [4820, 2960, 5130, 2210, 1840];
  for (let i = 0; i < resData.length; i++) {
    const [title, description, type, size] = resData[i];
    db.freeResource.create({ data: { id: `res_${i}`, title, description, type, size, downloads: resDownloads[i] } });
  }

  // ---- certificates ----
  db.certificate.create({
    data: { id: "cert_1", serial: "DS-CERT-1403-0231", userId: student.id, courseId: courses["risk-management-pro"], title: "گواهینامه مدیریت سرمایه و ریسک حرفه‌ای", issuedAt: ago(10) },
  });

  // ---- recruitment ----
  db.jobPosting.createMany({
    data: [
      { id: "jp_1", title: "تحلیلگر محتوا (بازار مالی)", department: "محتوا", description: "تولید تحلیل روزانه بازار و محتوای آموزشی در شبکه‌های اجتماعی.", type: "FULL_TIME" },
      { id: "jp_2", title: "پشتیبان فنی پلتفرم", department: "پشتیبانی", description: "پاسخگویی به تیکت‌ها و مشکلات فنی کاربران در شیفت عصر.", type: "PART_TIME" },
      { id: "jp_3", title: "منتور تحلیل تکنیکال", department: "آموزش", description: "برگزاری جلسات منتورینگ و بازبینی تمرین‌های دانشجویان.", type: "FULL_TIME" },
    ],
  });
  db.jobApplication.createMany({
    data: [
      { id: "ja_1", name: "ابوالفضل صادقی", email: "ab@ex.com", phone: "09351112233", resumeText: "۵ سال سابقه تولید محتوای مالی در کانال‌های تلگرامی", status: "INTERVIEW", interviewAt: ahead(3), createdAt: ago(4) },
      { id: "ja_2", name: "الهه کریمی", email: "elahe@ex.com", phone: "09364445566", resumeText: "کارشناس پشتیبانی سابق بروکر آلپاری", status: "PENDING", createdAt: ago(2) },
      { id: "ja_3", name: "مجید نادری", email: "majid@ex.com", phone: "09377778899", resumeText: "مدرس تکنیکال با ۸ سال تجربه", status: "ACCEPTED", createdAt: ago(8) },
      { id: "ja_4", name: "شیوا محمدخانی", email: "shiva@ex.com", phone: "09382223344", resumeText: "تریدر فارکس و منتور", status: "REJECTED", createdAt: ago(12) },
    ],
  });

  // ---- coupons / audit / settings ----
  db.coupon.createMany({
    data: [
      { id: "cp_1", code: "WELCOME15", percentOff: 15, maxUses: 500, usedCount: 132, expiresAt: ahead(30) },
      { id: "cp_2", code: "YALDA40", percentOff: 40, maxUses: 200, usedCount: 187, expiresAt: ahead(12) },
    ],
  });
  db.auditLog.createMany({
    data: [
      { id: "al_1", actorName: "مدیر دی‌صفارا", action: "تایید پرداخت", entity: "سفارش DS-1042", detail: "پرداخت دستی تایید شد", createdAt: ago(25) },
      { id: "al_2", actorName: "سیستم", action: "صادر کردن گواهینامه", entity: "علی کریمی", createdAt: ago(10) },
      { id: "al_3", actorName: "مدیر دی‌صفارا", action: "ایجاد کد تخفیف", entity: "کوپن WELCOME15", createdAt: ago(30) },
      { id: "al_4", actorName: "امیرحسین رضایی", action: "بررسی تمرین معاملاتی", entity: "تمرین XAUUSD علی کریمی", createdAt: ago(5) },
    ],
  });
  db.setting.createMany({
    data: [
      { key: "site_title", value: "دی‌صفارا | آکادمی تخصصی آموزش ترید" },
      { key: "payment_gateway", value: "زرین‌پال" },
      { key: "support_phone", value: "۰۲۱-۹۱۰۰۲۲۳۳" },
      { key: "mentor_commission_percent", value: "30" },
    ],
  });
}

if (store["user"].length === 0) {
  seed();
}

// ---------------------------------------------------------------------------
// New-user onboarding: give freshly-registered (OTP) users a lively demo panel
// ---------------------------------------------------------------------------
export function provisionDemoData(userId: string) {
  const course = (slug: string) => store["course"].find((c) => c.slug === slug);
  const mentor = store["user"].find((u) => u.role === "MENTOR");
  const journal: [string, "LONG" | "SHORT", number, number, number, number, number, number, string | null, string | null, string | null, number][] = [
    ["XAUUSD", "LONG", 2336.0, 2352.4, 0.1, 2330.0, 2360.0, 164, "OB+فایب", "اجرای تمیز روی سشن لندن", "آرام", 1],
    ["EURUSD", "SHORT", 1.0855, 1.0821, 0.2, 1.0880, 1.08, 68, "پین‌بار ناحیه", null, "متمرکز", 2],
    ["BTCUSDT", "LONG", 61500, 60800, 0.05, 60500, 64000, -350, "فایب", "ورود زودهنگام؛ FOMO داشتم", "عجول", 3],
    ["GBPUSD", "SHORT", 1.272, 1.2695, 0.2, 1.275, 1.267, 50, "بریکر بلاک", null, "متمرکز", 4],
    ["XAUUSD", "LONG", 2320.0, 2341.0, 0.1, 2314.0, 2350.0, 210, "OB+فایب", "بهترین اجرای هفته", "با اعتماد", 5],
    ["US30", "LONG", 38500, 38460, 0.1, 38440, 38700, -40, "continuation", "حد ضرر منطقی خورد", "بی‌حوصلگی", 6],
  ];
  for (let i = 0; i < journal.length; i++) {
    const [symbol, dir, entry, exit, lot, sl, tp, pnl, setup, notes, emotion, d] = journal[i];
    const pnlVal = (exit - entry) * (dir === "LONG" ? 1 : -1) * lot * 100;
    db.tradeJournalEntry.create({
      data: {
        userId, symbol, direction: dir, entryPrice: entry, exitPrice: exit, lotSize: lot,
        stopLoss: sl, takeProfit: tp, pnl: +pnlVal.toFixed(2), pnlPercent: +(pnlVal / 10).toFixed(2),
        status: pnlVal > 0 ? "WIN" : pnlVal < 0 ? "LOSS" : "BREAKEVEN",
        setup, notes, emotion, tradeDate: ago(d), createdAt: ago(d),
      },
    });
  }
  for (const [slug, prog] of [["forex-zero-to-hero", 35], ["classic-technical", 12]] as const) {
    const c = course(slug);
    if (c) db.enrollment.create({ data: { userId, courseId: c.id, progress: prog } });
  }
  db.tradingExercise.create({
    data: {
      userId, symbol: "XAUUSD", timeframe: "1H",
      taskTitle: "مارک‌آپ نواحی کلیدی طلا", description: "چارت ۱ ساعته XAUUSD را مارک‌آپ کنید.",
      analysis: "نواحی عرضه ۲۳۵۰ و تقاضای ۲۳۲۰ را مارک کردم؛ سناریو: پولبک به تقاضا و ادامه صعود.",
      checklist: JSON.stringify(["ساختار بالاتر تایم مشخص شد", "ناحیه کلیدی مارک شد", "نقطه ورود و استاپ تعیین شد"]),
      status: "PENDING", createdAt: ago(1),
    },
  });
  if (mentor) {
    db.mentorSession.create({
      data: {
        title: "جلسه آشنایی و تعیین مسیر", studentId: userId, mentorId: mentor.id,
        startTime: ahead(2, 3), durationMin: 60, status: "SCHEDULED",
        notes: "بررسی سطح فعلی و تعیین برنامه هفتگی",
      },
    });
    db.weeklyReport.create({
      data: {
        studentId: userId, mentorId: mentor.id, weekLabel: "هفته اول",
        summary: "شروع مسیر؛ ثبت ژورنال و تمرین اول انجام شد. هدف هفته بعد: تمرین مارک‌آپ ساختار بازار روی ۱۰ چارت.",
        progress: 20, createdAt: ago(1),
      },
    });
  }
}
