"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { faDate, faNum, faToman, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, CalendarDays, CheckCircle2, ChevronLeft, CircleAlert, Clock, Eye, Globe, GraduationCap,
  LineChart, Newspaper, Quote, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Target, TrendingUp,
  Trophy, User, Users, Wallet, XCircle,
} from "lucide-react";
import {
  CourseCard, CourseCover, Logo,
  type CourseType, type PathType,
} from "./public-shell";
import {
  Counter, EmptyState, GridSkeleton, LevelBadge, ListSkeleton, RatingStars, Reveal, SectionHead, StatCard, StatusBadge, useFetch,
} from "./shared";

/* ================= shared page hero band ================= */

function PageHero({
  kicker, title, desc, center, children,
}: {
  kicker: string; title: ReactNode; desc?: string; center?: boolean; children?: ReactNode;
}) {
  return (
    <section className="hero-bg noise relative overflow-hidden">
      <div className="orb right-[-6%] top-[4%] size-72 bg-primary/15" aria-hidden />
      <div className="orb left-[-8%] top-[30%] size-80 bg-sky-500/10" aria-hidden style={{ animationDelay: "-6s" }} />
      <div className="relative z-[2] mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <Reveal className={cn("space-y-4", center ? "mx-auto max-w-2xl text-center" : "max-w-3xl")}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            {kicker}
          </span>
          <h1 className="text-3xl font-black leading-[1.3] md:text-4xl">{title}</h1>
          {desc && (
            <p className={cn("text-sm leading-8 text-muted-foreground md:text-base", center ? "mx-auto" : "max-w-2xl")}>
              {desc}
            </p>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/* ================= courses listing ================= */

export function CoursesPage() {
  const { data, loading } = useFetch<{ courses: CourseType[]; categories: { id: string; title: string; slug: string }[] }>(
    "/api/public?section=catalog"
  );
  const [cat, setCat] = useState("all");
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return (data?.courses || []).filter((c) => {
      if (cat !== "all" && c.category?.slug !== cat) return false;
      if (level !== "all" && c.level !== level) return false;
      if (q && !c.title.includes(q) && !c.description.includes(q)) return false;
      return true;
    });
  }, [data, cat, level, q]);

  return (
    <main>
      <PageHero
        kicker="آکادمی دی‌صفارا"
        title={<>همه <span className="text-gradient">دوره‌های آموزشی</span></>}
        desc="دوره‌ای متناسب با سطح و هدف خود پیدا کنید؛ همه دوره‌ها شامل تمرین، پشتیبانی و گواهینامه هستند."
      >
        <Reveal delay={150} className="mt-8">
          <div className="glass flex max-w-4xl flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:p-5">
            <Input
              placeholder="جستجوی دوره..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-card/60 md:max-w-xs"
            />
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="bg-card/60 md:w-48"><SelectValue placeholder="همه دسته‌ها" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                {data?.categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="bg-card/60 md:w-40"><SelectValue placeholder="همه سطوح" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                <SelectItem value="BEGINNER">مقدماتی</SelectItem>
                <SelectItem value="INTERMEDIATE">متوسط</SelectItem>
                <SelectItem value="ADVANCED">پیشرفته</SelectItem>
              </SelectContent>
            </Select>
            <span className="flex items-center gap-2 text-xs text-muted-foreground md:ms-auto">
              <span className="live-dot size-1.5 rounded-full bg-primary" aria-hidden />
              {toFa(filtered.length)} دوره فعال
            </span>
          </div>
        </Reveal>
      </PageHero>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? <GridSkeleton /> : filtered.length === 0 ? (
            <Reveal delay={80}>
              <EmptyState icon={<CircleAlert className="size-6" />} title="دوره‌ای یافت نشد" desc="فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید." />
            </Reveal>
          ) : (
            <Reveal delay={100} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
            </Reveal>
          )}
        </div>
      </section>
    </main>
  );
}

/* ================= course detail ================= */

type CourseDetail = {
  course: CourseType & {
    longDescription?: string; mentor?: { id: string; name: string; bio: string; avatar: string } | null;
    category?: { title: string; slug: string } | null;
    chapters: { id: string; title: string; order: number; lessons: { id: string; title: string; durationMin: number; isFree: boolean; description?: string }[] }[];
  };
  related: CourseType[];
};

export function CourseDetailPage({ slug }: { slug: string }) {
  const { data, loading } = useFetch<CourseDetail>(`/api/public?section=course&slug=${slug}`);
  const { addToCart, goPublic, user, setAuthOpen } = useApp();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"><GridSkeleton /></main>;
  if (!data?.course) return <main className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"><EmptyState icon={<CircleAlert />} title="دوره یافت نشد" /></main>;

  const { course } = data;
  const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const off = course.oldPrice ? Math.round(((course.oldPrice - course.price) / course.oldPrice) * 100) : 0;

  const buy = () => {
    if (!user) { setAuthOpen(true); return; }
    if (course.price === 0) {
      apiPost("/api/student", { action: "enroll-free", slug: course.slug })
        .then(() => {
          toast({ title: "ثبت‌نام انجام شد 🎉", description: "دوره رایگان به داشبورد شما اضافه شد." });
          useApp.getState().setMode("student");
        })
        .catch((e) => toast({ title: "خطا", description: e.message, variant: "destructive" }));
      return;
    }
    addToCart({ type: "course", slug: course.slug, title: course.title, price: course.price });
    goPublic("cart");
  };

  return (
    <main>
      {/* hero: breadcrumb + title + meta */}
      <section className="hero-bg noise relative overflow-hidden">
        <div className="orb right-[-6%] top-[4%] size-80 bg-primary/15" aria-hidden />
        <div className="orb left-[-10%] top-[40%] size-72 bg-sky-500/10" aria-hidden style={{ animationDelay: "-6s" }} />
        <div className="relative z-[2] mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <Reveal className="max-w-3xl space-y-5">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="مسیر صفحه">
              <button onClick={() => goPublic("courses")} className="cursor-pointer transition-colors hover:text-primary">دوره‌ها</button>
              <ChevronLeft className="size-3.5" aria-hidden />
              {course.category && <span className="font-semibold text-primary">{course.category.title}</span>}
            </nav>
            <h1 className="text-2xl font-black leading-[1.3] md:text-4xl">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <LevelBadge level={course.level} />
              <RatingStars rating={course.rating} />
              <span className="flex items-center gap-1"><GraduationCap className="size-4" /> {faNum(course.studentsCount)} دانشجو</span>
              <span className="flex items-center gap-1"><Clock className="size-4" /> {faNum(course.durationHours)} ساعت</span>
              <span className="flex items-center gap-1"><BookOpen className="size-4" /> {faNum(totalLessons)} درس</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* main column */}
            <div className="space-y-10 lg:col-span-2">
              <Reveal>
                <div className="card-premium rounded-2xl p-6 md:p-8">
                  <p className="mb-3 flex items-center gap-2 font-black"><BookOpen className="size-5 text-primary" /> درباره این دوره</p>
                  <p className="text-sm leading-8 text-muted-foreground">{course.longDescription || course.description}</p>
                </div>
              </Reveal>

              <Reveal delay={80} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-black">سرفصل‌های دوره</p>
                  <span className="text-xs text-muted-foreground">{toFa(course.chapters.length)} فصل • {toFa(totalLessons)} درس</span>
                </div>
                {course.chapters.map((ch, ci) => (
                  <div key={ch.id} className="card-premium overflow-hidden rounded-2xl">
                    <button
                      className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-right md:p-5"
                      onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{toFa(ci + 1)}</span>
                        <span className="text-sm font-semibold">{ch.title}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <span>{toFa(ch.lessons.length)} درس</span>
                        <ChevronLeft className={cn("size-4 transition-transform", expanded === ch.id ? "-rotate-90" : "rotate-180")} aria-hidden />
                      </div>
                    </button>
                    {expanded === ch.id && (
                      <div className="border-t border-border/60">
                        {ch.lessons.map((l) => (
                          <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm odd:bg-card/40">
                            <div className="flex items-center gap-2.5">
                              <LineChart className={cn("size-4 shrink-0", l.isFree ? "text-primary" : "text-muted-foreground")} />
                              <span>{l.title}</span>
                              {l.isFree && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">پیش‌نمایش رایگان</span>}
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">{toFa(l.durationMin)} دقیقه</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Reveal>

              {data.related.length > 0 && (
                <Reveal delay={120} className="space-y-5 pt-2">
                  <p className="text-lg font-black">دوره‌های مرتبط</p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {data.related.map((c) => <CourseCard key={c.id} course={c} />)}
                  </div>
                </Reveal>
              )}
            </div>

            {/* sticky purchase panel */}
            <div>
              <Reveal delay={100} className="sticky top-24">
                <div className="card-premium overflow-hidden rounded-2xl">
                  <CourseCover image={course.image} category={course.category?.slug} className="h-44 w-full md:h-52" />
                  <div className="space-y-5 p-6">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-3xl font-black text-primary">{course.price === 0 ? "رایگان" : faToman(course.price)}</span>
                      {course.oldPrice ? <span className="text-sm text-muted-foreground line-through">{faNum(course.oldPrice)}</span> : null}
                      {off > 0 && <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">{toFa(off)}٪ تخفیف</span>}
                    </div>
                    <Button className="w-full glow-accent" size="lg" onClick={buy}>
                      {course.price === 0 ? "ثبت‌نام رایگان" : "ثبت‌نام و پرداخت"}
                    </Button>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {["دسترسی همیشگی به ویدیوها", "تمرین و تمرین‌نامه اختصاصی", "پشتیبانی مستقیم مدرس", "گواهینامه معتبر پایان دوره", "دسترسی به اپلیکیشن موبایل"].map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-border/60 pt-4">
                      <p className="mb-3 text-xs text-muted-foreground">مدرس دوره</p>
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 font-bold text-primary">
                          {course.mentor?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{course.mentor?.name}</p>
                          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{course.mentor?.bio}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= learning paths ================= */

export function PathsPage() {
  const { data, loading } = useFetch<{ paths: PathType[] }>("/api/public?section=catalog");
  const goPublic = useApp((s) => s.goPublic);
  return (
    <main>
      <PageHero
        kicker="مسیرهای یادگیری"
        title={<>از کجا <span className="text-gradient">شروع کنم؟</span></>}
        desc="مسیرها مجموعه دوره‌های مرتب و ترتیب‌دار هستند؛ کافیست نقطه شروع خود را پیدا کنید."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? <GridSkeleton /> : (
            <div className="grid gap-5 lg:grid-cols-3">
              {data?.paths.map((p, i) => (
                <Reveal key={p.id} delay={i * 80} className="h-full">
                  <div
                    className="card-premium flex h-full cursor-pointer flex-col gap-4 rounded-2xl p-6"
                    onClick={() => goPublic("path", p.slug)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-14 items-center justify-center rounded-2xl text-2xl" style={{ background: `${p.color}22`, color: p.color || "#19b887" }}>
                        {p.icon === "Rocket" ? "🚀" : p.icon === "Target" ? "🎯" : "₿"}
                      </div>
                      <LevelBadge level={p.level} />
                    </div>
                    <p className="text-lg font-black">{p.title}</p>
                    <p className="flex-1 text-sm leading-7 text-muted-foreground">{p.description}</p>
                    <div className="space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Target className="size-3.5 shrink-0 text-primary" /> {p.objective}</p>
                      <p className="flex items-center gap-1.5"><User className="size-3.5 shrink-0 text-primary" /> {p.audience}</p>
                      <p className="flex items-center gap-1.5"><BookOpen className="size-3.5 shrink-0 text-primary" /> {toFa(p.courses.length)} دوره</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                      مشاهده دوره‌های مسیر <ChevronLeft className="size-4" aria-hidden />
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function PathDetailPage({ slug }: { slug: string }) {
  const { data, loading } = useFetch<{ paths: PathType[] }>("/api/public?section=catalog");
  const goPublic = useApp((s) => s.goPublic);
  const path = data?.paths.find((p) => p.slug === slug);
  if (loading) return <main className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20"><GridSkeleton /></main>;
  if (!path) return <main className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20"><EmptyState icon={<CircleAlert />} title="مسیر یافت نشد" /></main>;

  const totalPrice = path.courses.reduce((s, pc) => s + pc.course.price, 0);
  return (
    <main>
      <section className="hero-bg noise relative overflow-hidden">
        <div className="orb right-[-6%] top-[4%] size-80 bg-primary/15" aria-hidden />
        <div className="orb left-[-8%] top-[30%] size-72 bg-sky-500/10" aria-hidden style={{ animationDelay: "-6s" }} />
        <div className="relative z-[2] mx-auto max-w-5xl space-y-5 px-4 py-12 md:px-6 md:py-16">
          <Reveal className="flex flex-col items-start gap-5 md:flex-row md:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl text-4xl" style={{ background: `${path.color}22`, color: path.color || "#19b887" }}>
              {path.icon === "Rocket" ? "🚀" : path.icon === "Target" ? "🎯" : "₿"}
            </div>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="size-3.5" aria-hidden /> مسیر یادگیری
              </span>
              <h1 className="text-3xl font-black leading-[1.3] md:text-4xl"><span className="text-gradient">{path.title}</span></h1>
              <p className="text-sm text-muted-foreground">{toFa(path.courses.length)} دوره • سطح {path.level === "BEGINNER" ? "مقدماتی" : path.level === "INTERMEDIATE" ? "متوسط" : "پیشرفته"}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-2xl text-sm leading-8 text-muted-foreground">{path.description}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <Reveal className="mb-8 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/40 p-4"><Target className="size-4 shrink-0 text-primary" /> هدف: {path.objective}</div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/40 p-4"><User className="size-4 shrink-0 text-primary" /> مناسب برای: {path.audience}</div>
          </Reveal>

          <p className="mb-6 text-lg font-black">مراحل مسیر</p>
          <div className="relative space-y-4 ps-8">
            <div className="absolute bottom-4 start-[13px] top-4 w-0.5 bg-border" aria-hidden />
            {path.courses.map((pc, i) => (
              <Reveal key={pc.course.id} delay={i * 70}>
                <div className="relative">
                  <span className="absolute -start-8 top-6 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-4 ring-background">
                    {toFa(i + 1)}
                  </span>
                  <div
                    className="card-premium flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5"
                    onClick={() => goPublic("course", pc.course.slug)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{pc.course.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{pc.course.description}</p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className={cn("text-sm font-bold", pc.course.price === 0 && "text-primary")}>
                        {pc.course.price === 0 ? "رایگان" : faToman(pc.course.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">{faNum(pc.course.durationHours)} ساعت</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100} className="mt-10">
            <div className="glass flex flex-col items-center justify-between gap-4 rounded-2xl border-primary/25 p-6 sm:flex-row">
              <p className="text-sm">ارزش کل دوره‌های این مسیر: <span className="font-black text-primary">{faToman(totalPrice)}</span></p>
              <Button className="glow-accent" onClick={() => goPublic("courses")}>شروع از اولین دوره</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

/* ================= mentors & services ================= */

type MentorsData = {
  mentors: { id: string; name: string; bio: string; avatar: string }[];
  plans: { id: string; title: string; slug: string; description: string; price: number; durationDays: number; features: string; sessionsPerWeek: number }[];
  mentorCourses: { id: string; title: string; mentorId: string }[];
};

export function MentorsPage() {
  const { data, loading } = useFetch<MentorsData>("/api/public?section=mentors");
  const [selected, setSelected] = useState<string | null>(null);
  const mentor = data?.mentors.find((m) => m.id === selected);
  const mentorCourses = data?.mentorCourses.filter((c) => c.mentorId === selected) || [];

  return (
    <main>
      <PageHero
        kicker="تیم منتورینگ"
        title={<>منتورهای <span className="text-gradient">دی‌صفارا</span></>}
        desc="با منتورهای حرفه‌ای که روزانه در بازار معامله می‌کنند، مسیر خود را هدایت کنید."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? <GridSkeleton /> : (
            <div className="grid gap-5 md:grid-cols-2">
              {data?.mentors.map((m, i) => {
                const courses = data.mentorCourses.filter((c) => c.mentorId === m.id);
                return (
                  <Reveal key={m.id} delay={i * 80} className="h-full">
                    <div className="card-premium flex h-full flex-col gap-4 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-sky-500/10 text-2xl font-black text-primary">
                          {m.name?.charAt(0)}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-lg font-black">{m.name}</p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="live-dot size-1.5 rounded-full bg-primary" aria-hidden /> منتور ارشد دی‌صفارا
                          </p>
                        </div>
                      </div>
                      <p className="flex-1 text-sm leading-7 text-muted-foreground">{m.bio}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {courses.slice(0, 3).map((c) => (
                          <span key={c.id} className="rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-muted-foreground">{c.title}</span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-auto w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setSelected(m.id)}
                      >
                        مشاهده جزئیات و رزرو جلسه
                      </Button>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="glass-strong max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{mentor?.name}</DialogTitle>
            <DialogDescription>{mentor?.bio}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-semibold">دوره‌های تدریس‌شده:</p>
            <div className="space-y-2">
              {mentorCourses.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 p-3 text-sm">
                  <BookOpen className="size-4 shrink-0 text-primary" /> {c.title}
                </div>
              ))}
              {mentorCourses.length === 0 && <p className="text-sm text-muted-foreground">در حال حاضر دوره فعالی ندارد.</p>}
            </div>
            <Button className="w-full glow-accent" onClick={() => { setSelected(null); useApp.getState().goPublic("services"); }}>
              رزرو جلسه از پلن‌های منتورینگ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function ServicesPage() {
  const { data, loading } = useFetch<MentorsData>("/api/public?section=mentors");
  const { toast } = useToast();
  const [form, setForm] = useState({ planSlug: "", name: "", phone: "", experience: "" });
  const [sending, setSending] = useState(false);

  const apply = async () => {
    if (!form.planSlug || !form.name || form.phone.length < 10) {
      toast({ title: "خطا", description: "پلن، نام و شماره تماس را کامل کنید.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await apiPost<{ message: string }>("/api/public", { action: "apply-mentoring", ...form });
      toast({ title: "ثبت شد ✅", description: res.message });
      setForm({ planSlug: "", name: "", phone: "", experience: "" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <PageHero
        kicker="خدمات منتورینگ"
        title={<>منتورینگ اختصاصی؛ <span className="text-gradient">سریع‌ترین راه پیشرفت</span></>}
        desc="در پلن منتورینگ، یک منتور اختصاصی هفته‌ای چندبار با شما جلسه دارد، ژورنال و تمرین‌هایتان را بررسی می‌کند و پلن شخصی می‌سازد."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              {loading ? <ListSkeleton /> : data?.plans.map((p, i) => {
                const features: string[] = JSON.parse(p.features);
                const featured = i === 1;
                return (
                  <Reveal key={p.id} delay={i * 80}>
                    <div className={cn("card-premium space-y-4 rounded-2xl p-6", featured && "glow-accent")}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          {featured && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
                              <Sparkles className="size-3" aria-hidden /> پیشنهاد ویژه
                            </span>
                          )}
                          <p className="text-lg font-black">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{toFa(p.durationDays)} روزه • {toFa(p.sessionsPerWeek)} جلسه در هفته</p>
                        </div>
                        <p className="shrink-0 text-xl font-black text-primary">{faToman(p.price)}</p>
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">{p.description}</p>
                      <ul className="grid gap-2 text-sm sm:grid-cols-2">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-primary" /> {f}</li>
                        ))}
                      </ul>
                      <Button
                        className={cn("w-full", featured && "glow-accent")}
                        variant={featured ? "default" : "outline"}
                        onClick={() => setForm((f) => ({ ...f, planSlug: p.slug }))}
                      >
                        درخواست این پلن
                      </Button>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={120} className="h-fit lg:col-span-2">
              <div className="glass rounded-2xl p-6 md:p-7">
                <p className="mb-1 font-black">فرم درخواست منتورینگ</p>
                <p className="mb-5 text-xs leading-6 text-muted-foreground">فرم زیر را پر کنید؛ کارشناسان ما برای مشاوره رایگان با شما تماس می‌گیرند.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>پلن موردنظر</Label>
                    <Select value={form.planSlug} onValueChange={(v) => setForm((f) => ({ ...f, planSlug: v }))}>
                      <SelectTrigger className="bg-card/60"><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                      <SelectContent>
                        {data?.plans.map((p) => <SelectItem key={p.id} value={p.slug}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نام و نام خانوادگی</Label>
                    <Input className="bg-card/60" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="نام شما" />
                  </div>
                  <div className="space-y-2">
                    <Label>شماره تماس</Label>
                    <Input dir="ltr" inputMode="numeric" className="bg-card/60 text-left" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="09xxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label>سابقه معامله‌گری شما</Label>
                    <Textarea rows={3} className="bg-card/60" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="مثلاً ۶ ماه است با پرایس اکشن معامله می‌کنم..." />
                  </div>
                  <Button className="w-full glow-accent" onClick={apply} disabled={sending}>
                    {sending ? "در حال ارسال..." : "ثبت درخواست مشاوره رایگان"}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-primary" /> پس از ثبت درخواست، برای هماهنگی جلسه معارفه با شما تماس می‌گیریم.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= blog ================= */

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: string; readTimeMin: number; views: number; createdAt: string; authorName: string;
};

export function BlogPage() {
  const { data, loading } = useFetch<{ posts: BlogPost[] }>("/api/public?section=blog");
  const goPublic = useApp((s) => s.goPublic);
  const [cat, setCat] = useState("همه");
  const cats = ["همه", ...Array.from(new Set((data?.posts || []).map((p) => p.category)))];
  const filtered = (data?.posts || []).filter((p) => cat === "همه" || p.category === cat);

  return (
    <main>
      <PageHero
        kicker="بلاگ دی‌صفارا"
        title={<>مقالات و <span className="text-gradient">تحلیل‌های آموزشی</span></>}
        desc="آخرین آموزش‌ها، تحلیل‌های بازار و نکات کاربردی معامله‌گری را رایگان بخوانید."
      >
        <Reveal delay={150} className="mt-8 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors",
                cat === c ? "border-primary/40 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </Reveal>
      </PageHero>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? <GridSkeleton /> : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
                  <div
                    className="card-premium flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl"
                    onClick={() => goPublic("post", p.slug)}
                  >
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/15 via-transparent to-sky-500/10 text-primary">
                      <Newspaper className="size-10 opacity-70" aria-hidden />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-semibold text-primary">{p.category}</span>
                        <span className="text-muted-foreground">{toFa(p.readTimeMin)} دقیقه مطالعه</span>
                      </div>
                      <p className="font-bold leading-7">{p.title}</p>
                      <p className="line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{p.excerpt}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" aria-hidden /> {faDate(p.createdAt)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function BlogPostPage({ slug }: { slug: string }) {
  const { data, loading } = useFetch<{ post: BlogPost; related: BlogPost[] }>(`/api/public?section=post&slug=${slug}`);
  const goPublic = useApp((s) => s.goPublic);
  if (loading) return <main className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20"><ListSkeleton rows={6} /></main>;
  if (!data?.post) return <main className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20"><EmptyState icon={<CircleAlert />} title="مقاله یافت نشد" /></main>;
  const post = data.post;

  return (
    <main>
      <section className="hero-bg noise relative overflow-hidden">
        <div className="orb right-[-6%] top-[4%] size-72 bg-primary/15" aria-hidden />
        <div className="relative z-[2] mx-auto max-w-3xl space-y-4 px-4 py-12 md:px-6 md:py-16">
          <Reveal className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Newspaper className="size-3.5" aria-hidden /> {post.category}
            </span>
            <h1 className="text-2xl font-black leading-[1.3] md:text-4xl">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="size-3.5" /> {post.authorName}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {faDate(post.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {toFa(post.readTimeMin)} دقیقه مطالعه</span>
              <span className="flex items-center gap-1.5"><Eye className="size-3.5" /> {faNum(post.views)} بازدید</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <Reveal>
            <div className="flex h-44 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-transparent to-sky-500/10 text-primary">
              <Newspaper className="size-12 opacity-60" aria-hidden />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-10 space-y-5 text-sm leading-8 text-foreground/90 md:text-base">
              {post.content.split("\n").filter(Boolean).map((para, i) => {
                if (para.startsWith("## ")) return <h2 key={i} className="border-s-2 border-primary ps-3 pt-2 text-xl font-black text-foreground">{para.replace("## ", "")}</h2>;
                if (para.startsWith("- ")) return <li key={i} className="ms-5 list-disc leading-7 text-muted-foreground marker:text-primary">{para.replace("- ", "")}</li>;
                return <p key={i}>{para}</p>;
              })}
            </div>
          </Reveal>

          {data.related.length > 0 && (
            <Reveal delay={120} className="mt-14 space-y-5">
              <p className="text-lg font-black">مقالات مرتبط</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {data.related.map((p) => (
                  <div
                    key={p.id}
                    className="card-premium cursor-pointer space-y-2 rounded-2xl p-4"
                    onClick={() => goPublic("post", p.slug)}
                  >
                    <span className="text-xs font-semibold text-primary">{p.category}</span>
                    <p className="line-clamp-2 text-sm font-semibold leading-6">{p.title}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </main>
  );
}

/* ================= resources / testimonials / faq ================= */

export function ResourcesPage() {
  const { data, loading } = useFetch<{ resources: { id: string; title: string; description: string; type: string; size: string; downloads: number }[] }>("/api/public?section=resources");
  const { toast } = useToast();
  const download = async (id: string, title: string) => {
    await apiPost("/api/public", { action: "download-resource", id }).catch(() => null);
    toast({ title: "دانلود آغاز شد 📥", description: `«${title}» برای شما ارسال شد (نسخه نمایشی).` });
  };
  return (
    <main>
      <PageHero
        kicker="منابع رایگان"
        title={<>کتابخانه <span className="text-gradient">رایگان</span> دی‌صفارا</>}
        desc="این منابع را رایگان دریافت کنید و کیفیت آموزش ما را از نزدیک ببینید."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? <GridSkeleton /> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data?.resources.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 80} className="h-full">
                  <div className="card-premium flex h-full flex-col gap-3 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {r.type === "VIDEO" ? <LineChart className="size-5" /> : r.type === "CHECKLIST" ? <Trophy className="size-5" /> : <BookOpen className="size-5" />}
                      </div>
                      <span className="rounded-lg border border-border/60 bg-card/60 px-2 py-1 text-xs text-muted-foreground" dir="ltr">{r.size}</span>
                    </div>
                    <p className="font-black">{r.title}</p>
                    <p className="flex-1 text-sm leading-7 text-muted-foreground">{r.description}</p>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-xs text-muted-foreground">{faNum(r.downloads)} دانلود</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => download(r.id, r.title)}
                      >
                        دریافت رایگان
                      </Button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function TestimonialsPage() {
  const { data, loading } = useFetch<{ testimonials: { id: string; name: string; role: string; content: string; rating: number }[] }>("/api/public?section=home");
  return (
    <main>
      <PageHero
        kicker="تجربه دانشجویان"
        title={<>نظرات و <span className="text-gradient">داستان‌های موفقیت</span></>}
        desc="خواندن تجربه بقیه بهترین راه برای تصمیم‌گیری است."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? <GridSkeleton /> : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data?.testimonials.map((t, i) => (
                <Reveal key={t.id} delay={(i % 3) * 80} className="h-full">
                  <div className="card-premium flex h-full flex-col gap-4 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <RatingStars rating={t.rating} showValue={false} />
                      <Quote className="size-6 -scale-x-100 text-primary/40" aria-hidden />
                    </div>
                    <p className="flex-1 text-sm leading-7 text-foreground/90">«{t.content}»</p>
                    <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 text-sm font-bold text-primary">{t.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function FaqPage() {
  const { data, loading } = useFetch<{ faqs: { id: string; question: string; answer: string; category: string }[] }>("/api/public?section=faq");
  const [cat, setCat] = useState("همه");
  const cats = ["همه", ...Array.from(new Set((data?.faqs || []).map((f) => f.category)))];
  const [open, setOpen] = useState<string | null>(null);
  const filtered = (data?.faqs || []).filter((f) => cat === "همه" || f.category === cat);

  return (
    <main>
      <PageHero
        center
        kicker="سوالات متداول"
        title={<>پاسخ <span className="text-gradient">سوالات شما</span></>}
        desc="اگر پاسخ سوال خود را پیدا نکردید، تیم پشتیبانی ما همیشه در دسترس است."
      >
        <Reveal delay={150} className="mt-8 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors",
                cat === c ? "border-primary/40 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </Reveal>
      </PageHero>
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {loading ? <ListSkeleton /> : (
            <div className="space-y-3">
              {filtered.map((f, i) => (
                <Reveal key={f.id} delay={Math.min(i, 6) * 50}>
                  <div className="card-premium overflow-hidden rounded-2xl">
                    <button className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-right" onClick={() => setOpen(open === f.id ? null : f.id)}>
                      <span className="text-sm font-semibold">{f.question}</span>
                      <ChevronLeft className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open === f.id ? "-rotate-90" : "rotate-180")} aria-hidden />
                    </button>
                    {open === f.id && <p className="border-t border-border/60 px-5 py-4 text-sm leading-7 text-muted-foreground">{f.answer}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ================= about & contact ================= */

export function AboutPage() {
  return (
    <main>
      <PageHero
        kicker="درباره ما"
        title={<>دی‌صفارا؛ از تجربه واقعی بازار تا <span className="text-gradient">آموزش واقعی</span></>}
        desc="ما باور داریم معامله‌گری مهارتی قابل یادگیری است؛ به همین دلیل آکادمی دی‌صفارا بر سه اصل ساختار، تمرین و بازخورد بنا شده است."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-5xl space-y-6 px-4 md:px-6">
          <Reveal>
            <div className="glass grid gap-8 rounded-3xl p-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: <GraduationCap className="size-5" />, value: 4200, suffix: "+", label: "دانشجو" },
                { icon: <Clock className="size-5" />, value: 120, suffix: "+", label: "ساعت آموزش" },
                { icon: <Users className="size-5" />, value: 8, suffix: "", label: "منتور تخصصی" },
                { icon: <TrendingUp className="size-5" />, value: 98, suffix: "٪", label: "رضایت دانشجویان" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{s.icon}</div>
                  <Counter value={s.value} suffix={s.suffix} className="text-gradient text-3xl font-black" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            <Reveal className="h-full">
              <div className="card-premium h-full space-y-3 rounded-2xl p-6 md:p-7">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target className="size-5" /></div>
                <p className="font-black">ماموریت ما</p>
                <p className="text-sm leading-8 text-muted-foreground">ارتقای سطح معامله‌گری ایرانیان با آموزش اصولی، تمرین واقعی و منتورینگ تخصصی — بدون وعده‌های غیرواقعی سود تضمینی.</p>
              </div>
            </Reveal>
            <Reveal delay={80} className="h-full">
              <div className="card-premium h-full space-y-3 rounded-2xl p-6 md:p-7">
                <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400"><TrendingUp className="size-5" /></div>
                <p className="font-black">چشم‌انداز</p>
                <p className="text-sm leading-8 text-muted-foreground">تبدیل شدن به معتبرترین آکادمی آموزش معامله‌گری فارسی‌زبان با استانداردهای جهانی آموزش و اخلاق حرفه‌ای بازار.</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="card-premium space-y-5 rounded-2xl p-6 md:p-8">
              <p className="font-black">رویکرد آموزشی ما</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["یادگیری ساختاریافته", "هر مفهوم با مثال واقعی چارت و تمرین مشخص تثبیت می‌شود."],
                  ["تمرین در ورک‌اسپیس", "دانشجویان روی چارت واقعی تمرین می‌کنند و منتور نتیجه را بررسی می‌کند."],
                  ["بازخورد مستمر", "ژورنال معاملات، گزارش هفتگی و جلسات منتورینگ مسیر اصلاح را نشان می‌دهد."],
                ].map(([t, d], i) => (
                  <div key={t} className="space-y-2.5 rounded-xl border border-border/50 bg-card/50 p-4">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-black text-primary">{toFa(i + 1)}</span>
                    <p className="text-sm font-bold text-primary">{t}</p>
                    <p className="text-xs leading-6 text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

export function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.name || !form.message) {
      toast({ title: "خطا", description: "نام و متن پیام را وارد کنید.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await apiPost<{ message: string }>("/api/public", { action: "contact", ...form });
      toast({ title: "ارسال شد ✅", description: res.message });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <PageHero
        kicker="تماس با ما"
        title={<>در کنار <span className="text-gradient">شما</span> هستیم</>}
        desc="سوال، پیشنهاد یا مشکل فنی دارید؟ از اینجا بفرستید؛ حداکثر ظرف ۲۴ ساعت پاسخ می‌دهیم."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {[
                { icon: <Globe className="size-5" />, t: "وب‌سایت", d: "dsafara.com" },
                { icon: <User className="size-5" />, t: "پشتیبانی تلفنی", d: "۰۲۱-۹۱۰۰۲۲۳۳ (شنبه تا پنجشنبه، ۹ تا ۱۸)" },
                { icon: <ShieldCheck className="size-5" />, t: "ایمیل", d: "support@dsafara.com" },
                { icon: <Users className="size-5" />, t: "شبکه‌های اجتماعی", d: "اینستاگرام و تلگرام: @dsafara" },
              ].map((c, i) => (
                <Reveal key={c.t} delay={i * 70}>
                  <div className="card-premium flex items-center gap-4 rounded-2xl p-5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{c.icon}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{c.t}</p>
                      <p className="text-sm text-muted-foreground">{c.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={100}>
              <div className="card-premium space-y-4 rounded-2xl p-6 md:p-7">
                <p className="font-black">ارسال پیام</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نام شما *</Label>
                    <Input className="bg-card/60" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>ایمیل</Label>
                    <Input dir="ltr" className="bg-card/60 text-left" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>موضوع</Label>
                  <Input className="bg-card/60" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>پیام شما *</Label>
                  <Textarea rows={5} className="bg-card/60" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                </div>
                <Button className="w-full glow-accent" onClick={send} disabled={sending}>{sending ? "در حال ارسال..." : "ارسال پیام"}</Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= cart & checkout ================= */

export function CartPage() {
  const { cart, removeFromCart, user, setAuthOpen } = useApp();
  const { toast } = useToast();
  const total = cart.reduce((s, c) => s + c.price, 0);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const validateCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await apiPost<{ percentOff: number; message: string }>("/api/checkout", { action: "validate-coupon", code: coupon });
      setDiscount(Math.round((total * res.percentOff) / 100));
      toast({ title: "اعمال شد ✅", description: res.message });
    } catch (e) {
      setDiscount(0);
      toast({ title: "نامعتبر", description: (e as Error).message, variant: "destructive" });
    }
  };

  const checkout = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!cart.length) return;
    try {
      const res = await apiPost<{ order: { id: string; orderNo: string } }>("/api/checkout", {
        action: "create-order",
        items: cart.map((c) => ({ type: c.type, slug: c.slug })),
        couponCode: discount > 0 ? coupon.trim().toUpperCase() : null,
      });
      useApp.getState().goPublic("checkout", res.order.id);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <main>
      <PageHero
        kicker="سبد خرید"
        title={<><span className="text-gradient">سبد خرید</span> شما</>}
        desc="پیش از پرداخت، اقلام سبد خود را بررسی کنید."
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          {!cart.length ? (
            <Reveal>
              <EmptyState
                icon={<ShoppingCart className="size-6" />}
                title="سبد خرید شما خالی است"
                desc="دوره‌های عالی اینجا منتظر شما هستند!"
                action={<Button className="glow-accent mt-2" onClick={() => useApp.getState().goPublic("courses")}>مشاهده دوره‌ها</Button>}
              />
            </Reveal>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {cart.map((item, i) => (
                  <Reveal key={item.slug} delay={i * 70}>
                    <div className="card-premium flex items-center justify-between gap-4 rounded-2xl p-5">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {item.type === "course" ? <GraduationCap className="size-5" /> : <ShoppingBag className="size-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.type === "course" ? "دوره آموزشی" : "محصول دیجیتال"}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <p className={cn("font-bold", item.price === 0 && "text-primary")}>{item.price === 0 ? "رایگان" : faToman(item.price)}</p>
                        <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => { removeFromCart(item.slug); setDiscount(0); }}>
                          <XCircle className="size-5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={100} className="lg:sticky lg:top-24">
                <div className="glass space-y-4 rounded-2xl p-6">
                  <p className="font-black">خلاصه سفارش</p>
                  <div className="flex gap-2">
                    <Input className="bg-card/60" placeholder="کد تخفیف (مثلاً WELCOME15)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                    <Button variant="outline" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary" onClick={validateCoupon}>اعمال</Button>
                  </div>
                  <div className="space-y-2 border-t border-border/60 pt-4 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">جمع اقلام</span><span className="font-semibold">{faToman(total)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-primary"><span>تخفیف</span><span>−{faToman(discount)}</span></div>}
                    <div className="flex justify-between border-t border-border/60 pt-2 text-base font-black">
                      <span>مبلغ قابل پرداخت</span><span className="text-primary">{faToman(total - discount)}</span>
                    </div>
                  </div>
                  <Button className="w-full glow-accent" size="lg" onClick={checkout}>ادامه و پرداخت</Button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" /> پرداخت واقعی هنوز فعال نیست؛ این بخش در محیط توسعه آزمایشی است</p>
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function CheckoutPage({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; refId?: string } | null>(null);
  const clearCart = useApp((s) => s.clearCart);
  const user = useApp((s) => s.user);
  const { data: ordersData } = useFetch<{ orders: { id: string; orderNo: string; totalAmount: number; items: { title: string; price: number }[] }[] }>(
    user ? "/api/student?view=orders" : null
  );
  const order = ordersData?.orders.find((o) => o.id === orderId);

  const pay = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1400)); // simulate gateway redirect
    try {
      const res = await apiPost<{ ok: boolean; message: string; refId?: string }>("/api/checkout", { action: "pay", orderId });
      setResult(res);
      if (res.ok) { clearCart(); toast({ title: "پرداخت موفق ✅", description: res.message }); }
      else toast({ title: "پرداخت ناموفق", description: res.message, variant: "destructive" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const orderNo = order?.orderNo || "—";
  const items = order?.items || [];
  const total = order?.totalAmount || 0;

  if (result) {
    return (
      <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-20 md:px-6">
        <div className="orb right-[-10%] top-[10%] size-72 bg-primary/15" aria-hidden />
        <Reveal className="glass-strong relative z-[2] w-full max-w-lg space-y-6 rounded-[2rem] p-8 text-center md:p-10">
          <div className={cn("mx-auto flex size-20 items-center justify-center rounded-full", result.ok ? "glow-ring bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
            {result.ok ? <CheckCircle2 className="size-10" /> : <XCircle className="size-10" />}
          </div>
          <h1 className="text-2xl font-black">{result.ok ? "پرداخت آزمایشی ثبت شد" : "پرداخت ناموفق بود"}</h1>
          <p className="text-sm leading-7 text-muted-foreground">{result.message}</p>
          {result.refId && <p className="mx-auto w-fit rounded-xl bg-muted px-4 py-2 text-sm">شماره پیگیری: <span dir="ltr" className="font-black">{toFa(result.refId)}</span></p>}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="glow-accent" onClick={() => useApp.getState().setMode("student")}>رفتن به داشبورد و شروع یادگیری</Button>
            <Button variant="outline" onClick={() => useApp.getState().goPublic("courses")}>بازگشت به دوره‌ها</Button>
          </div>
        </Reveal>
      </main>
    );
  }

  return (
    <main>
      <PageHero
        kicker="پرداخت سفارش"
        title={<>تکمیل <span className="text-gradient">پرداخت</span></>}
        desc={`سفارش ${toFa(orderNo)} • مبلغ قابل پرداخت ${faToman(total)}`}
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="grid items-start gap-6 lg:grid-cols-5">
            {/* payment (right on desktop) */}
            <Reveal className="lg:col-span-3">
              <div className="card-premium space-y-6 rounded-2xl p-6 md:p-8">
                <div className="space-y-3">
                  <p className="font-black">درگاه پرداخت</p>
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    <span className="flex items-center gap-2 text-sm"><Wallet className="size-5 shrink-0 text-primary" /> درگاه آزمایشی (بدون پرداخت واقعی)</span>
                    <span className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-2 py-1 text-xs font-bold text-primary">
                      <span className="live-dot size-1.5 rounded-full bg-primary" aria-hidden /> فعال
                    </span>
                  </div>
                </div>
                <Button className="w-full glow-accent" size="lg" onClick={pay} disabled={paying}>
                  {paying ? "در حال انتقال به درگاه..." : `پرداخت ${faToman(total)}`}
                </Button>
                <p className="text-center text-xs leading-6 text-muted-foreground">این یک درگاه نمایشی است؛ پس از زدن دکمه، پرداخت شبیه‌سازی می‌شود.</p>
              </div>
            </Reveal>

            {/* order summary (left on desktop) */}
            <Reveal delay={100} className="lg:col-span-2">
              <div className="glass-strong space-y-5 rounded-[2rem] p-6 lg:sticky lg:top-24 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">خلاصه سفارش</p>
                  <span className="rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground" dir="ltr">#{toFa(orderNo)}</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  {items.map((i, idx) => (
                    <div key={idx} className="flex justify-between gap-3">
                      <span className="truncate">{i.title}</span>
                      <span className="shrink-0 font-semibold">{faToman(i.price)}</span>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-muted-foreground">در حال دریافت اقلام سفارش...</p>}
                </div>
                <div className="flex justify-between border-t border-border/60 pt-4 font-black">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-primary">{faToman(total)}</span>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" /> پرداخت واقعی هنوز فعال نیست؛ این بخش در محیط توسعه آزمایشی است</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= legal pages ================= */

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  const sections = isPrivacy
    ? [
        ["اطلاعاتی که جمع‌آوری می‌کنیم", "هنگام ثبت‌نام، شماره موبایل و نام شما؛ هنگام استفاده از پلتفرم، داده‌های یادگیری (پیشرفت دوره، تمرین‌ها، ژورنال معاملات) و داده‌های پرداخت (بدون ذخیره اطلاعات کارت بانکی) ثبت می‌شود."],
        ["استفاده از اطلاعات", "اطلاعات شما فقط برای ارائه خدمات آموزشی، پشتیبانی، بهبود تجربه کاربری و اطلاع‌رسانی‌های مربوط به حساب شما استفاده می‌شود و هرگز فروخته نمی‌شود."],
        ["امنیت داده‌ها", "ارتباطات پلتفرم با رمزنگاری انجام می‌شود و دسترسی به داده‌های کاربران فقط برای افراد مجوزدار پشتیبانی و آموزش امکان‌پذیر است."],
        ["حق حذف حساب", "هر زمان که بخواهید می‌توانید درخواست حذف حساب و داده‌های شخصی خود را از طریق پشتیبانی ثبت کنید."],
      ]
    : [
        ["پذیرش قوانین", "با ثبت‌نام و استفاده از پلتفرم دی‌صفارا، شما تمام قوانین این سند را می‌پذیرید. این قوانین ممکن است به‌روزرسانی شوند و نسخه جدید از زمان انتشار معتبر است."],
        ["مالکیت محتوا", "تمام ویدیوها، جزوات، تمرین‌ها و ابزارهای این پلتفرم متعلق به دی‌صفارا است و فروش، اشتراک‌گذاری یا بازنشر آن‌ها تخلف محسوب شده و منجر به قطع دسترسی می‌شود."],
        ["گواهینامه و بازگشت وجه", "گواهینامه صرفاً پس از اتمام دوره و قبولی در آزمون صادر می‌شود. درخواست بازگشت وجه تا ۷ روز پس از خرید و مشروط به مشاهده کمتر از ۲۰٪ دوره است."],
        ["هشدار ریسک معامله‌گری", "آموزش‌های این پلتفرم جنبه آموزشی دارد و هیچ‌گونه تضمین سود نیست. مسئولیت تصمیم‌ها و معاملات شما کاملاً بر عهده خودتان است."],
      ];

  return (
    <main>
      <PageHero
        kicker="اسناد دی‌صفارا"
        title={isPrivacy ? <>سیاست <span className="text-gradient">حریم خصوصی</span></> : <>قوانین و <span className="text-gradient">مقررات</span></>}
        desc={isPrivacy ? "نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شما" : "شرایط استفاده از پلتفرم آموزشی دی‌صفارا"}
      />
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl space-y-4 px-4 md:px-6">
          {sections.map(([t, d], i) => (
            <Reveal key={t} delay={Math.min(i, 5) * 60}>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-black text-primary">{toFa(i + 1)}</span>
                  <p className="font-bold">{t}</p>
                </div>
                <p className="text-sm leading-8 text-muted-foreground">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
