import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-mode";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const mentorSelect = {
  id: true, name: true, bio: true, avatar: true,
};

/** GET /api/public?section=catalog|blog|faq|home|mentors|paths|resources|contact-info */
export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") || "home";

  if (section === "home") {
    const [courses, paths, mentors, testimonials, faqs, resources, posts, categories] =
      await Promise.all([
        db.course.findMany({
          where: { isPublished: true },
          include: { category: true, mentor: { select: mentorSelect } },
          orderBy: { studentsCount: "desc" },
        }),
        db.learningPath.findMany({ include: { courses: { include: { course: true } } } }),
        db.user.findMany({ where: { role: "MENTOR" }, select: mentorSelect }),
        db.testimonial.findMany({ where: { isActive: true }, orderBy: { rating: "desc" } }),
        db.faq.findMany({ orderBy: { order: "asc" } }),
        db.freeResource.findMany(),
        db.blogPost.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 3 }),
        db.category.findMany(),
      ]);
    return NextResponse.json({ courses, paths, mentors, testimonials, faqs, resources, posts, categories });
  }

  if (section === "catalog") {
    const [courses, categories, paths] = await Promise.all([
      db.course.findMany({
        where: { isPublished: true },
        include: { category: true, mentor: { select: mentorSelect } },
        orderBy: { createdAt: "desc" },
      }),
      db.category.findMany(),
      db.learningPath.findMany({ include: { courses: { include: { course: true } } } }),
    ]);
    return NextResponse.json({ courses, categories, paths });
  }

  if (section === "blog") {
    const posts = await db.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ posts });
  }

  if (section === "faq") {
    const faqs = await db.faq.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ faqs });
  }

  if (section === "mentors") {
    const mentors = await db.user.findMany({
      where: { role: "MENTOR" },
      select: { ...mentorSelect, courses: { where: { mentorId: { not: null } } } },
    });
    const plans = await db.mentoringPlan.findMany({ where: { isActive: true } });
    const mentorCourses = await db.course.findMany({
      where: { mentorId: { not: null } },
      select: { id: true, title: true, mentorId: true },
    });
    return NextResponse.json({ mentors, plans, mentorCourses });
  }

  if (section === "resources") {
    const resources = await db.freeResource.findMany();
    return NextResponse.json({ resources });
  }

  if (section === "course" ) {
    const slug = req.nextUrl.searchParams.get("slug") || "";
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        category: true,
        mentor: { select: mentorSelect },
        chapters: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, durationMin: true, isFree: true } } } },
      },
    });
    if (!course || !course.isPublished) return NextResponse.json({ error: "دوره یافت نشد" }, { status: 404 });
    const related = await db.course.findMany({
      where: { categoryId: course.categoryId, isPublished: true, id: { not: course.id } },
      take: 3,
      include: { category: true, mentor: { select: mentorSelect } },
    });
    return NextResponse.json({ course, related });
  }

  if (section === "post") {
    const slug = req.nextUrl.searchParams.get("slug") || "";
    const post = await db.blogPost.findUnique({ where: { slug } });
    if (!post) return NextResponse.json({ error: "مقاله یافت نشد" }, { status: 404 });
    await db.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
    const related = await db.blogPost.findMany({
      where: { isPublished: true, slug: { not: slug } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return NextResponse.json({ post, related });
  }

  return NextResponse.json({ error: "section نامعتبر" }, { status: 400 });
}

/** POST /api/public — public forms: contact, mentoring application, job application, resource download */
export async function POST(req: NextRequest) {
  // Volatile submissions are allowed only in the explicitly labelled demo.
  if (!isDemoMode()) return NextResponse.json({ error: "ثبت درخواست واقعی هنوز پیکربندی نشده است." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "contact") {
    const { name, email, message, subject } = body;
    if (!name || !message) return NextResponse.json({ error: "نام و پیام الزامی است" }, { status: 400 });
    const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
    if (admin) {
      await db.notification.create({
        data: { userId: admin.id, title: `پیام جدید از تماس با ما — ${name}`, body: `${subject || "بدون موضوع"}: ${message.slice(0, 200)}`, type: "SYSTEM" },
      });
    }
    return NextResponse.json({ ok: true, message: "پیام شما با موفقیت ثبت شد؛ همکاران ما به‌زودی پاسخ می‌دهند." });
  }

  if (action === "apply-mentoring") {
    const { planSlug, name, phone, experience } = body;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120 || typeof phone !== "string" || !/^09\d{9}$/.test(phone.trim()) || typeof planSlug !== "string")
      return NextResponse.json({ error: "نام و شماره موبایل معتبر الزامی است" }, { status: 400 });
    const plan = await db.mentoringPlan.findUnique({ where: { slug: planSlug } });
    if (!plan || !plan.isActive) return NextResponse.json({ error: "پلن یافت نشد" }, { status: 404 });
    await db.mentoringPlanEnrollment.create({
      data: { planId: plan.id, mentorId: null, userId: null, applicantName: name.trim(), applicantPhone: phone.trim(), experience: typeof experience === "string" ? experience.slice(0, 2000) : "", status: "PENDING" },
    });
    return NextResponse.json({ ok: true, message: "درخواست منتورینگ شما ثبت شد؛ برای هماهنگی جلسه تماس می‌گیریم." });
  }

  if (action === "job-apply") {
    const { name, email, phone, resumeText } = body;
    if (!name || !phone) return NextResponse.json({ error: "نام و شماره تماس الزامی است" }, { status: 400 });
    await db.jobApplication.create({ data: { name, email: email || "", phone, resumeText: resumeText || "" } });
    return NextResponse.json({ ok: true, message: "رزومه شما ثبت شد؛ در صورت تایید برای مصاحبه تماس می‌گیریم." });
  }

  if (action === "download-resource") {
    const id = body.id as string;
    await db.freeResource.update({ where: { id }, data: { downloads: { increment: 1 } } }).catch(() => null);
    return NextResponse.json({ ok: true, message: "لینک دانلود برای شما ارسال شد (نسخه نمایشی)." });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
