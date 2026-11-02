"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { faDate, faNum, faToman, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Award, BookOpen, Brain, CheckCircle2, ChevronLeft, CircleAlert, Globe, GraduationCap,
  LineChart, Newspaper, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Target, TrendingUp,
  Trophy, User, Users, Wallet, XCircle, CalendarDays, Clock,
} from "lucide-react";
import {
  CourseCard, CourseCover, Logo,
  type CourseType, type PathType,
} from "./public-shell";
import {
  EmptyState, GridSkeleton, LevelBadge, ListSkeleton, RatingStars, SectionHead, StatCard, StatusBadge, useFetch,
} from "./shared";

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
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="آکادمی دی‌صفارا" title="دوره‌های آموزشی" desc="دوره‌ای متناسب با سطح و هدف خود پیدا کنید؛ همه دوره‌ها شامل تمرین، پشتیبانی و گواهینامه هستند." />

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <Input placeholder="جستجوی دوره..." value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="همه دسته‌ها" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {data?.categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="همه سطوح" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه سطوح</SelectItem>
            <SelectItem value="BEGINNER">مقدماتی</SelectItem>
            <SelectItem value="INTERMEDIATE">متوسط</SelectItem>
            <SelectItem value="ADVANCED">پیشرفته</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground md:mr-auto">{toFa(filtered.length)} دوره</span>
      </div>

      {loading ? <GridSkeleton /> : filtered.length === 0 ? (
        <EmptyState icon={<CircleAlert className="size-6" />} title="دوره‌ای یافت نشد" desc="فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
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

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><GridSkeleton /></main>;
  if (!data?.course) return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><EmptyState icon={<CircleAlert />} title="دوره یافت نشد" /></main>;

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
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* main info */}
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <button onClick={() => goPublic("courses")} className="hover:text-primary">دوره‌ها</button> /
              {course.category && <span className="text-primary">{course.category.title}</span>}
            </div>
            <h1 className="text-2xl font-extrabold leading-relaxed md:text-3xl">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <LevelBadge level={course.level} />
              <RatingStars rating={course.rating} />
              <span className="flex items-center gap-1"><GraduationCap className="size-4" /> {faNum(course.studentsCount)} دانشجو</span>
              <span className="flex items-center gap-1"><Clock className="size-4" /> {faNum(course.durationHours)} ساعت</span>
              <span className="flex items-center gap-1"><BookOpen className="size-4" /> {faNum(totalLessons)} درس</span>
            </div>
            <CourseCover image={course.image} category={course.category?.slug} className="h-64 w-full rounded-2xl border border-border md:h-80" />
          </div>

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-6">
              <p className="font-bold">درباره این دوره</p>
              <p className="text-sm leading-8 text-muted-foreground">{course.longDescription || course.description}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <p className="text-lg font-bold">سرفصل‌های دوره</p>
            {course.chapters.map((ch, ci) => (
              <Card key={ch.id} className="overflow-hidden border-border bg-card">
                <button className="flex w-full items-center justify-between gap-3 p-4 text-right" onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{toFa(ci + 1)}</span>
                    <span className="text-sm font-semibold">{ch.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{toFa(ch.lessons.length)} درس</span>
                </button>
                {expanded === ch.id && (
                  <div className="border-t border-border">
                    {ch.lessons.map((l, li) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm odd:bg-muted/30">
                        <div className="flex items-center gap-2.5">
                          <LineChart className={cn("size-4", l.isFree ? "text-primary" : "text-muted-foreground")} />
                          <span>{l.title}</span>
                          {l.isFree && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">پیش‌نمایش رایگان</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{toFa(l.durationMin)} دقیقه</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {data.related.length > 0 && (
            <div className="pt-4">
              <p className="mb-5 text-lg font-bold">دوره‌های مرتبط</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.related.map((c) => <CourseCard key={c.id} course={c} />)}
              </div>
            </div>
          )}
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          <Card className="sticky top-20 border-border bg-card">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-primary">{course.price === 0 ? "رایگان" : faToman(course.price)}</span>
                {course.oldPrice ? <span className="text-sm text-muted-foreground line-through">{faNum(course.oldPrice)}</span> : null}
                {off > 0 && <span className="rounded-lg bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">{toFa(off)}٪ تخفیف</span>}
              </div>
              <Button className="w-full glow-accent" size="lg" onClick={buy}>
                {course.price === 0 ? "ثبت‌نام رایگان" : "ثبت‌نام و پرداخت"}
              </Button>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {["دسترسی همیشگی به ویدیوها", "تمرین و تمرین‌نامه اختصاصی", "پشتیبانی مستقیم مدرس", "گواهینامه معتبر پایان دوره", "دسترسی به اپلیکیشن موبایل"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-4">
                <p className="mb-3 text-xs text-muted-foreground">مدرس دوره</p>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary">
                    {course.mentor?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{course.mentor?.name}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{course.mentor?.bio}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

/* ================= learning paths ================= */

export function PathsPage() {
  const { data, loading } = useFetch<{ paths: PathType[] }>("/api/public?section=catalog");
  const goPublic = useApp((s) => s.goPublic);
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="مسیرهای یادگیری" title="از کجا شروع کنم؟" desc="مسیرها مجموعه دوره‌های مرتب و ترتیب‌دار هستند؛ کافیست نقطه شروع خود را پیدا کنید." />
      {loading ? <GridSkeleton /> : (
        <div className="grid gap-5 lg:grid-cols-3">
          {data?.paths.map((p) => (
            <Card key={p.id} className="card-hover flex cursor-pointer flex-col border-border bg-card" onClick={() => goPublic("path", p.slug)}>
              <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl text-2xl" style={{ background: `${p.color}22`, color: p.color || "#19b887" }}>
                    {p.icon === "Rocket" ? "🚀" : p.icon === "Target" ? "🎯" : "₿"}
                  </div>
                  <LevelBadge level={p.level} />
                </div>
                <p className="text-lg font-bold">{p.title}</p>
                <p className="flex-1 text-sm leading-7 text-muted-foreground">{p.description}</p>
                <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Target className="size-3.5 text-primary" /> {p.objective}</p>
                  <p className="flex items-center gap-1.5"><User className="size-3.5 text-primary" /> {p.audience}</p>
                  <p className="flex items-center gap-1.5"><BookOpen className="size-3.5 text-primary" /> {toFa(p.courses.length)} دوره</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export function PathDetailPage({ slug }: { slug: string }) {
  const { data, loading } = useFetch<{ paths: PathType[] }>("/api/public?section=catalog");
  const goPublic = useApp((s) => s.goPublic);
  const path = data?.paths.find((p) => p.slug === slug);
  if (loading) return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><GridSkeleton /></main>;
  if (!path) return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><EmptyState icon={<CircleAlert />} title="مسیر یافت نشد" /></main>;

  const totalPrice = path.courses.reduce((s, pc) => s + pc.course.price, 0);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Card className="mb-8 border-border bg-gradient-to-bl from-primary/10 via-card to-card">
        <CardContent className="space-y-4 p-8">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl text-3xl" style={{ background: `${path.color}22`, color: path.color || "#19b887" }}>
              {path.icon === "Rocket" ? "🚀" : path.icon === "Target" ? "🎯" : "₿"}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{path.title}</h1>
              <p className="text-sm text-muted-foreground">{toFa(path.courses.length)} دوره • سطح {path.level === "BEGINNER" ? "مقدماتی" : path.level === "INTERMEDIATE" ? "متوسط" : "پیشرفته"}</p>
            </div>
          </div>
          <p className="text-sm leading-8 text-muted-foreground">{path.description}</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3"><Target className="size-4 text-primary" /> هدف: {path.objective}</div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3"><User className="size-4 text-primary" /> مناسب برای: {path.audience}</div>
          </div>
        </CardContent>
      </Card>

      <p className="mb-5 text-lg font-bold">مراحل مسیر</p>
      <div className="relative space-y-4 pr-6">
        <div className="absolute bottom-4 right-[13px] top-4 w-0.5 bg-border" />
        {path.courses.map((pc, i) => (
          <div key={pc.course.id} className="relative">
            <span className="absolute -right-6 top-6 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-4 ring-background">
              {toFa(i + 1)}
            </span>
            <Card className="card-hover cursor-pointer border-border bg-card" onClick={() => goPublic("course", pc.course.slug)}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
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
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <Card className="mt-8 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-between gap-3 p-6 sm:flex-row">
          <p className="text-sm">ارزش کل دوره‌های این مسیر: <span className="font-bold">{faToman(totalPrice)}</span></p>
          <Button onClick={() => goPublic("courses")}>شروع از اولین دوره</Button>
        </CardContent>
      </Card>
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
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="تیم منتورینگ" title="منتورهای دی‌صفارا" desc="با منتورهای حرفه‌ای که روزانه در بازار معامله می‌کنند، مسیر خود را هدایت کنید." />
      {loading ? <GridSkeleton /> : (
        <div className="grid gap-5 md:grid-cols-2">
          {data?.mentors.map((m) => {
            const courses = data.mentorCourses.filter((c) => c.mentorId === m.id);
            return (
              <Card key={m.id} className="card-hover border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 text-2xl font-extrabold text-primary">
                      {m.name?.charAt(0)}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-lg font-bold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">منتور ارشد دی‌صفارا</p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{m.bio}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {courses.slice(0, 3).map((c) => (
                      <span key={c.id} className="rounded-lg bg-muted px-2.5 py-1">{c.title}</span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setSelected(m.id)}>
                    مشاهده جزئیات و رزرو جلسه
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle>{mentor?.name}</DialogTitle>
            <DialogDescription>{mentor?.bio}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-semibold">دوره‌های تدریس‌شده:</p>
            <div className="space-y-2">
              {mentorCourses.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm">
                  <BookOpen className="size-4 text-primary" /> {c.title}
                </div>
              ))}
              {mentorCourses.length === 0 && <p className="text-sm text-muted-foreground">در حال حاضر دوره فعالی ندارد.</p>}
            </div>
            <Button className="w-full" onClick={() => { setSelected(null); useApp.getState().goPublic("services"); }}>
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
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="خدمات منتورینگ" title="منتورینگ اختصاصی؛ سریع‌ترین راه پیشرفت" desc="در پلن منتورینگ، یک منتور اختصاصی هفته‌ای چندبار با شما جلسه دارد، ژورنال و تمرین‌هایتان را بررسی می‌کند و پلن شخصی می‌سازد." />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {loading ? <ListSkeleton /> : data?.plans.map((p, i) => {
            const features: string[] = JSON.parse(p.features);
            const featured = i === 1;
            return (
              <Card key={p.id} className={cn("border-border bg-card", featured && "border-primary/50 glow-accent")}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{toFa(p.durationDays)} روزه • {toFa(p.sessionsPerWeek)} جلسه در هفته</p>
                    </div>
                    <p className="shrink-0 text-xl font-extrabold text-primary">{faToman(p.price)}</p>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{p.description}</p>
                  <ul className="grid gap-2 text-sm sm:grid-cols-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> {f}</li>
                    ))}
                  </ul>
                  <Button
                    className={cn("w-full", featured && "glow-accent")}
                    variant={featured ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, planSlug: p.slug }))}
                  >
                    درخواست این پلن
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit border-border bg-card lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <p className="font-bold">فرم درخواست منتورینگ</p>
            <div className="space-y-2">
              <Label>پلن موردنظر</Label>
              <Select value={form.planSlug} onValueChange={(v) => setForm((f) => ({ ...f, planSlug: v }))}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>
                  {data?.plans.map((p) => <SelectItem key={p.id} value={p.slug}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نام و نام خانوادگی</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="نام شما" />
            </div>
            <div className="space-y-2">
              <Label>شماره تماس</Label>
              <Input dir="ltr" inputMode="numeric" className="text-left" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="09xxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label>سابقه معامله‌گری شما</Label>
              <Textarea rows={3} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="مثلاً ۶ ماه است با پرایس اکشن معامله می‌کنم..." />
            </div>
            <Button className="w-full glow-accent" onClick={apply} disabled={sending}>
              {sending ? "در حال ارسال..." : "ثبت درخواست مشاوره رایگان"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">پس از ثبت درخواست، برای هماهنگی جلسه معارفه با شما تماس می‌گیریم.</p>
          </CardContent>
        </Card>
      </div>
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
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="بلاگ دی‌صفارا" title="مقالات و تحلیل‌های آموزشی" desc="آخرین آموزش‌ها، تحلیل‌های بازار و نکات کاربردی معامله‌گری را رایگان بخوانید." />
      <div className="mb-8 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", cat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}
          >
            {c}
          </button>
        ))}
      </div>
      {loading ? <GridSkeleton /> : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="card-hover cursor-pointer border-border bg-card" onClick={() => goPublic("post", p.slug)}>
              <div className="flex h-32 items-center justify-center rounded-t-2xl bg-gradient-to-br from-primary/15 via-card to-card text-primary">
                <Newspaper className="size-10 opacity-70" />
              </div>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-primary">{p.category}</span>
                  <span className="text-muted-foreground">{toFa(p.readTimeMin)} دقیقه مطالعه</span>
                </div>
                <p className="font-bold leading-7">{p.title}</p>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{p.excerpt}</p>
                <p className="text-xs text-muted-foreground">{faDate(p.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export function BlogPostPage({ slug }: { slug: string }) {
  const { data, loading } = useFetch<{ post: BlogPost; related: BlogPost[] }>(`/api/public?section=post&slug=${slug}`);
  const goPublic = useApp((s) => s.goPublic);
  if (loading) return <main className="mx-auto max-w-3xl px-4 py-10 md:px-6"><ListSkeleton rows={6} /></main>;
  if (!data?.post) return <main className="mx-auto max-w-3xl px-4 py-10 md:px-6"><EmptyState icon={<CircleAlert />} title="مقاله یافت نشد" /></main>;
  const post = data.post;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <article className="space-y-6">
        <div className="space-y-4">
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary">{post.category}</span>
          <h1 className="text-2xl font-extrabold leading-relaxed md:text-3xl">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>{post.authorName}</span>
            <span>{faDate(post.createdAt)}</span>
            <span>{toFa(post.readTimeMin)} دقیقه مطالعه</span>
            <span>{faNum(post.views)} بازدید</span>
          </div>
          <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card text-primary">
            <Newspaper className="size-12 opacity-60" />
          </div>
        </div>
        <div className="space-y-5 text-sm leading-8 text-foreground/90">
          {post.content.split("\n").filter(Boolean).map((para, i) => {
            if (para.startsWith("## ")) return <h2 key={i} className="pt-2 text-lg font-bold text-foreground">{para.replace("## ", "")}</h2>;
            if (para.startsWith("- ")) return <li key={i} className="mr-4 list-disc leading-7 text-muted-foreground">{para.replace("- ", "")}</li>;
            return <p key={i}>{para}</p>;
          })}
        </div>
      </article>
      {data.related.length > 0 && (
        <div className="mt-12">
          <p className="mb-5 text-lg font-bold">مقالات مرتبط</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.related.map((p) => (
              <Card key={p.id} className="card-hover cursor-pointer border-border bg-card" onClick={() => goPublic("post", p.slug)}>
                <CardContent className="space-y-2 p-4">
                  <span className="text-xs text-primary">{p.category}</span>
                  <p className="line-clamp-2 text-sm font-semibold leading-6">{p.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
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
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="منابع رایگان" title="کتابخانه رایگان دی‌صفارا" desc="این منابع را رایگان دریافت کنید و کیفیت آموزش ما را از نزدیک ببینید." />
      {loading ? <GridSkeleton /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.resources.map((r) => (
            <Card key={r.id} className="card-hover border-border bg-card">
              <CardContent className="flex h-full flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {r.type === "VIDEO" ? <LineChart className="size-5" /> : r.type === "CHECKLIST" ? <Trophy className="size-5" /> : <BookOpen className="size-5" />}
                  </div>
                  <span className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{r.size}</span>
                </div>
                <p className="font-bold">{r.title}</p>
                <p className="flex-1 text-sm leading-7 text-muted-foreground">{r.description}</p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">{faNum(r.downloads)} دانلود</span>
                  <Button size="sm" variant="secondary" onClick={() => download(r.id, r.title)}>دریافت رایگان</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export function TestimonialsPage() {
  const { data, loading } = useFetch<{ testimonials: { id: string; name: string; role: string; content: string; rating: number }[] }>("/api/public?section=home");
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHead kicker="تجربه دانشجویان" title="نظرات و داستان‌های موفقیت" desc="خواندن تجربه بقیه بهترین راه برای تصمیم‌گیری است." />
      {loading ? <GridSkeleton /> : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.testimonials.map((t) => (
            <Card key={t.id} className="border-border bg-card">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <RatingStars rating={t.rating} showValue={false} />
                <p className="flex-1 text-sm leading-7 text-foreground/90">«{t.content}»</p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <SectionHead center kicker="سوالات متداول" title="پاسخ سوالات شما" />
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-4 py-1.5 text-sm", cat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
            {c}
          </button>
        ))}
      </div>
      {loading ? <ListSkeleton /> : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <Card key={f.id} className="overflow-hidden border-border bg-card">
              <button className="flex w-full items-center justify-between gap-4 p-5 text-right" onClick={() => setOpen(open === f.id ? null : f.id)}>
                <span className="text-sm font-semibold">{f.question}</span>
                <ChevronLeft className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open === f.id ? "-rotate-90" : "rotate-180")} />
              </button>
              {open === f.id && <p className="border-t border-border px-5 py-4 text-sm leading-7 text-muted-foreground">{f.answer}</p>}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

/* ================= about & contact ================= */

export function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <SectionHead kicker="درباره ما" title="دی‌صفارا؛ از تجربه واقعی بازار تا آموزش واقعی" />
      <div className="space-y-6">
        <Card className="border-border bg-gradient-to-bl from-primary/10 to-card">
          <CardContent className="grid gap-6 p-8 sm:grid-cols-4">
            {[
              ["+۴,۲۰۰", "دانشجو"], ["+۱۲۰", "ساعت آموزش"], ["۸", "منتور تخصصی"], ["۹۸٪", "رضایت"],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-extrabold text-primary">{v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-border bg-card"><CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 font-bold"><Target className="size-5 text-primary" /> ماموریت ما</p>
            <p className="text-sm leading-8 text-muted-foreground">ارتقای سطح معامله‌گری ایرانیان با آموزش اصولی، تمرین واقعی و منتورینگ تخصصی — بدون وعده‌های غیرواقعی سود تضمینی.</p>
          </CardContent></Card>
          <Card className="border-border bg-card"><CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 font-bold"><TrendingUp className="size-5 text-primary" /> چشم‌انداز</p>
            <p className="text-sm leading-8 text-muted-foreground">تبدیل شدن به معتبرترین آکادمی آموزش معامله‌گری فارسی‌زبان با استانداردهای جهانی آموزش و اخلاق حرفه‌ای بازار.</p>
          </CardContent></Card>
        </div>
        <Card className="border-border bg-card"><CardContent className="space-y-4 p-6">
          <p className="font-bold">رویکرد آموزشی ما</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["۱. یادگیری ساختاریافته", "هر مفهوم با مثال واقعی چارت و تمرین مشخص تثبیت می‌شود."],
              ["۲. تمرین در ورک‌اسپیس", "دانشجویان روی چارت واقعی تمرین می‌کنند و منتور نتیجه را بررسی می‌کند."],
              ["۳. بازخورد مستمر", "ژورنال معاملات، گزارش هفتگی و جلسات منتورینگ مسیر اصلاح را نشان می‌دهد."],
            ].map(([t, d]) => (
              <div key={t} className="space-y-2 rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-bold text-primary">{t}</p>
                <p className="text-xs leading-6 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
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
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <SectionHead kicker="تماس با ما" title="در کنار شما هستیم" desc="سوال، پیشنهاد یا مشکل فنی دارید؟ از اینجا بفرستید؛ حداکثر ظرف ۲۴ ساعت پاسخ می‌دهیم." />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: <Globe className="size-5" />, t: "وب‌سایت", d: "dsafara.com" },
            { icon: <User className="size-5" />, t: "پشتیبانی تلفنی", d: "۰۲۱-۹۱۰۰۲۲۳۳ (شنبه تا پنجشنبه، ۹ تا ۱۸)" },
            { icon: <ShieldCheck className="size-5" />, t: "ایمیل", d: "support@dsafara.com" },
            { icon: <Users className="size-5" />, t: "شبکه‌های اجتماعی", d: "اینستاگرام و تلگرام: @dsafara" },
          ].map((c) => (
            <Card key={c.t} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{c.icon}</div>
                <div>
                  <p className="text-sm font-bold">{c.t}</p>
                  <p className="text-sm text-muted-foreground">{c.d}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>نام شما *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>ایمیل</Label><Input dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>موضوع</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-2"><Label>پیام شما *</Label><Textarea rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></div>
            <Button className="w-full glow-accent" onClick={send} disabled={sending}>{sending ? "در حال ارسال..." : "ارسال پیام"}</Button>
          </CardContent>
        </Card>
      </div>
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
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <SectionHead kicker="سبد خرید" title="سبد خرید شما" />
      {!cart.length ? (
        <EmptyState
          icon={<ShoppingCart className="size-6" />}
          title="سبد خرید شما خالی است"
          desc="دوره‌های عالی اینجا منتظر شما هستند!"
          action={<Button className="mt-2" onClick={() => useApp.getState().goPublic("courses")}>مشاهده دوره‌ها</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cart.map((item) => (
              <Card key={item.slug} className="border-border bg-card">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type === "course" ? "دوره آموزشی" : "محصول دیجیتال"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn("font-bold", item.price === 0 && "text-primary")}>{item.price === 0 ? "رایگان" : faToman(item.price)}</p>
                    <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => { removeFromCart(item.slug); setDiscount(0); }}>
                      <XCircle className="size-5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="h-fit border-border bg-card">
            <CardContent className="space-y-4 p-6">
              <p className="font-bold">خلاصه سفارش</p>
              <div className="flex gap-2">
                <Input placeholder="کد تخفیف (مثلاً WELCOME15)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                <Button variant="outline" onClick={validateCoupon}>اعمال</Button>
              </div>
              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">جمع اقلام</span><span>{faToman(total)}</span></div>
                {discount > 0 && <div className="flex justify-between text-primary"><span>تخفیف</span><span>−{faToman(discount)}</span></div>}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>مبلغ قابل پرداخت</span><span className="text-primary">{faToman(total - discount)}</span>
                </div>
              </div>
              <Button className="w-full glow-accent" size="lg" onClick={checkout}>ادامه و پرداخت</Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> پرداخت امن از طریق درگاه بانکی</p>
            </CardContent>
          </Card>
        </div>
      )}
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
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center md:px-6">
        <div className={cn("flex size-20 items-center justify-center rounded-full", result.ok ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
          {result.ok ? <CheckCircle2 className="size-10" /> : <XCircle className="size-10" />}
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">{result.ok ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود"}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{result.message}</p>
        {result.refId && <p className="mt-3 rounded-xl bg-muted px-4 py-2 text-sm">شماره پیگیری: <span dir="ltr" className="font-bold">{toFa(result.refId)}</span></p>}
        <div className="mt-8 flex gap-3">
          <Button className="glow-accent" onClick={() => useApp.getState().setMode("student")}>رفتن به داشبورد و شروع یادگیری</Button>
          <Button variant="outline" onClick={() => useApp.getState().goPublic("courses")}>بازگشت به دوره‌ها</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 md:px-6">
      <Card className="border-border bg-card">
        <CardContent className="space-y-5 p-8">
          <div className="space-y-1">
            <p className="text-lg font-extrabold">تکمیل پرداخت</p>
            <p className="text-sm text-muted-foreground">سفارش {toFa(orderNo)}</p>
          </div>
          <div className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate">{i.title}</span>
                <span className="shrink-0">{faToman(i.price)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>مبلغ قابل پرداخت</span>
              <span className="text-primary">{faToman(total)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">درگاه پرداخت</p>
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
              <span className="flex items-center gap-2 text-sm"><Wallet className="size-5 text-primary" /> درگاه بانکی (زرین‌پال)</span>
              <span className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-bold text-primary">فعال</span>
            </div>
          </div>
          <Button className="w-full glow-accent" size="lg" onClick={pay} disabled={paying}>
            {paying ? "در حال انتقال به درگاه..." : `پرداخت ${faToman(total)}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">این یک درگاه نمایشی است؛ پس از زدن دکمه، پرداخت شبیه‌سازی می‌شود.</p>
        </CardContent>
      </Card>
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
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <SectionHead title={isPrivacy ? "سیاست حریم خصوصی" : "قوانین و مقررات"} desc={isPrivacy ? "نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شما" : "شرایط استفاده از پلتفرم آموزشی دی‌صفارا"} />
      <div className="space-y-4">
        {sections.map(([t, d]) => (
          <Card key={t} className="border-border bg-card">
            <CardContent className="space-y-2 p-6">
              <p className="font-bold">{t}</p>
              <p className="text-sm leading-8 text-muted-foreground">{d}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
