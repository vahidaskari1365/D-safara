"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { faNum, faToman, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { SectionHead, Price, useFetch } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import {
  BadgeCheck, BookOpen, Brain, CandlestickChart, ChartCandlestick, ChevronLeft, Globe,
  GraduationCap, LayoutDashboard, LineChart, LogIn, LogOut, Menu, ShieldCheck, ShoppingBag,
  ShoppingCart, Sparkles, TrendingUp, User, Users, Wallet, X, Award, Headphones,
} from "lucide-react";

/* ================= logo ================= */

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex cursor-pointer items-center gap-2.5" onClick={() => useApp.getState().goPublic("home")}>
      <div className={cn("flex items-center justify-center rounded-xl bg-primary/15 font-extrabold text-primary ring-1 ring-primary/40", small ? "size-8 text-sm" : "size-10 text-lg")}>
        دی
      </div>
      <div className="leading-tight">
        <p className="font-extrabold tracking-tight">دی‌صفارا</p>
        <p className="text-[10px] text-muted-foreground">D.SAFARA ACADEMY</p>
      </div>
    </div>
  );
}

/* ================= course cover (gradient fallback) ================= */

const coverGradients: Record<string, string> = {
  technical: "from-emerald-500/25 via-teal-600/10 to-background",
  "risk-management": "from-sky-500/25 via-cyan-600/10 to-background",
  psychology: "from-violet-500/25 via-purple-600/10 to-background",
  forex: "from-amber-500/25 via-orange-600/10 to-background",
  crypto: "from-orange-500/25 via-amber-600/10 to-background",
  bourse: "from-rose-500/25 via-pink-600/10 to-background",
};

export function CourseCover({ image, category, className, icon }: { image?: string | null; category?: string | null; className?: string; icon?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  const grad = coverGradients[category || "technical"] || coverGradients.technical;
  if (image && !failed) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <img src={image} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br", grad, className)}>
      <div className="text-primary/80">{icon || <ChartCandlestick className="size-12" />}</div>
    </div>
  );
}

/* ================= header & footer ================= */

const navItems = [
  { key: "home", label: "خانه" },
  { key: "courses", label: "دوره‌ها" },
  { key: "paths", label: "مسیرهای یادگیری" },
  { key: "mentors", label: "منتورها" },
  { key: "services", label: "منتورینگ" },
  { key: "blog", label: "بلاگ" },
  { key: "resources", label: "منابع رایگان" },
  { key: "faq", label: "سوالات" },
  { key: "contact", label: "تماس" },
];

export function PublicHeader() {
  const { user, goPublic, publicPage, setAuthOpen, cart, goStudent, goAdmin, setMode, setUser } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const doLogout = async () => {
    await apiPost("/api/auth", { action: "logout" }).catch(() => null);
    useApp.getState().setUser(null);
    goPublic("home");
    toast({ title: "خارج شدید", description: "به امید دیدار دوباره!" });
  };

  return (
    <header className={cn("sticky top-0 z-40 w-full border-b transition-all", scrolled ? "border-border bg-background/85 shadow-lg backdrop-blur-xl" : "border-transparent bg-background/60 backdrop-blur-md")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => goPublic(n.key)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-card hover:text-primary",
                  publicPage === n.key ? "text-primary" : "text-muted-foreground"
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* cart */}
          <Button variant="ghost" size="icon" className="relative" aria-label="سبد خرید" onClick={() => goPublic("cart")}>
            <ShoppingCart className="size-5" />
            {cart.length > 0 && (
              <span className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {toFa(cart.length)}
              </span>
            )}
          </Button>

          {user ? (
            <div className="flex items-center gap-1.5">
              {user.role === "ADMIN" ? (
                <Button size="sm" className="gap-1.5" onClick={() => goAdmin("overview")}>
                  <LayoutDashboard className="size-4" /> پنل مدیریت
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={() => setMode("student")}>
                  <LayoutDashboard className="size-4" /> داشبورد من
                </Button>
              )}
              <Button variant="ghost" size="icon" aria-label="خروج" onClick={doLogout}>
                <LogOut className="size-4.5" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => setAuthOpen(true)}>
                <LogIn className="size-4" /> ورود
              </Button>
              <Button size="sm" className="hidden sm:flex" onClick={() => setAuthOpen(true)}>
                شروع رایگان
              </Button>
            </>
          )}

          {/* mobile nav */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="منو">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border bg-sidebar">
              <SheetHeader>
                <SheetTitle><Logo small /></SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-2" aria-label="منوی موبایل">
                {navItems.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => { goPublic(n.key); setMobileOpen(false); }}
                    className={cn("rounded-lg px-3 py-2.5 text-right text-sm font-medium transition-colors hover:bg-card", publicPage === n.key ? "bg-card text-primary" : "text-muted-foreground")}
                  >
                    {n.label}
                  </button>
                ))}
                {!user && (
                  <Button className="mt-3" onClick={() => { setAuthOpen(true); setMobileOpen(false); }}>
                    <LogIn className="size-4" /> ورود / ثبت‌نام
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const goPublic = useApp((s) => s.goPublic);
  const cols: { title: string; links: { label: string; page: string; param?: string }[] }[] = [
    {
      title: "آموزش",
      links: [
        { label: "همه دوره‌ها", page: "courses" },
        { label: "مسیرهای یادگیری", page: "paths" },
        { label: "منابع رایگان", page: "resources" },
        { label: "بلاگ", page: "blog" },
      ],
    },
    {
      title: "خدمات",
      links: [
        { label: "پلن‌های منتورینگ", page: "services" },
        { label: "منتورها", page: "mentors" },
        { label: "نظرات دانشجویان", page: "testimonials" },
        { label: "سوالات متداول", page: "faq" },
      ],
    },
    {
      title: "دی‌صفارا",
      links: [
        { label: "درباره ما", page: "about" },
        { label: "تماس با ما", page: "contact" },
        { label: "حریم خصوصی", page: "privacy" },
        { label: "قوانین و مقررات", page: "terms" },
      ],
    },
  ];
  return (
    <footer className="mt-auto border-t border-border bg-sidebar/60">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <Logo />
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              آکادمی تخصصی آموزش معامله‌گری و بازارهای مالی؛ با مسیرهای یادگیری ساختاریافته، منتورینگ حرفه‌ای و ابزارهای تمرین واقعی، مسیر شما تا معامله‌گری مستقل را کوتاه‌تر می‌کنیم.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" /> پرداخت امن
              <BadgeCheck className="size-4 text-primary" /> ضمانت بازگشت وجه
              <Headphones className="size-4 text-primary" /> پشتیبانی ۷ روز هفته
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-sm font-bold">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <button onClick={() => goPublic(l.page, l.param)} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {toFa(1403)} دی‌صفارا — تمامی حقوق محفوظ است.</p>
          <p>ساخته شده با ❤️ برای معامله‌گران ایرانی</p>
        </div>
      </div>
    </footer>
  );
}

/* ================= auth dialog (OTP) ================= */

export function AuthDialog() {
  const { authOpen, setAuthOpen, setUser } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setAuthOpen(false);
    setStep("phone"); setCode(""); setDevCode(null); setError("");
  };

  const requestOtp = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiPost<{ devCode: string }>("/api/auth", { action: "request-otp", phone });
      setDevCode(res.devCode);
      setStep("otp");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiPost<{ ok: boolean; user: { id: string; name: string; phone: string; role: string; avatar: string } }>(
        "/api/auth", { action: "verify-otp", phone, code, name }
      );
      const me = await apiGet<{ user: unknown; unreadNotifications: number; unreadMessages: number }>("/api/auth");
      setUser(res.user, me.unreadNotifications || 0, me.unreadMessages || 0);
      close();
      toast({ title: "خوش آمدید! 🎉", description: "ورود شما با موفقیت انجام شد." });
      if (res.user.role === "ADMIN") useApp.getState().goAdmin("overview");
      else useApp.getState().setMode("student");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md border-border bg-card sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">
            {step === "phone" ? "ورود | ثبت‌نام" : "کد تایید را وارد کنید"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "با شماره موبایل وارد شوید یا حساب جدید بسازید."
              : `کد ۶ رقمی ارسال‌شده به ${toFa(phone)} را وارد کنید.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-name">نام و نام خانوادگی (اختیاری)</Label>
              <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً علی کریمی" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-phone">شماره موبایل</Label>
              <Input
                id="auth-phone" dir="ltr" inputMode="numeric" className="text-left"
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="09xxxxxxxxx" maxLength={11}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={requestOtp} disabled={loading || phone.length !== 11}>
              {loading ? "در حال ارسال..." : "دریافت کد تایید"}
            </Button>
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-6 text-muted-foreground">
              <p className="font-medium text-primary">حساب‌های نمایشی:</p>
              <p>دانشجو: <span dir="ltr">09123333333</span> | مدیر: <span dir="ltr">09120000000</span> | منتور: <span dir="ltr">09121111111</span></p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {devCode && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm">
                <p className="text-xs text-amber-400">حالت نمایشی — کد تایید شما:</p>
                <p dir="ltr" className="mt-1 text-2xl font-extrabold tracking-[0.4em] text-amber-300">{toFa(devCode)}</p>
              </div>
            )}
            <div dir="ltr" className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={verify} disabled={loading || code.length !== 6}>
              {loading ? "در حال بررسی..." : "تایید و ورود"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("phone")}>
              تغییر شماره
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ================= home page ================= */

type PublicHomeData = {
  courses: CourseType[];
  paths: PathType[];
  mentors: { id: string; name: string; bio: string; avatar: string }[];
  testimonials: { id: string; name: string; role: string; content: string; rating: number }[];
  faqs: { id: string; question: string; answer: string; category: string }[];
  resources: { id: string; title: string; description: string; type: string; size: string; downloads: number }[];
  posts: { id: string; title: string; slug: string; excerpt: string; category: string; readTimeMin: number; createdAt: string }[];
  categories: { id: string; title: string; slug: string; description: string }[];
};

export type CourseType = {
  id: string; title: string; slug: string; description: string; image?: string;
  level: string; price: number; oldPrice?: number | null; durationHours: number;
  rating: number; studentsCount: number; isFree: boolean;
  category?: { title: string; slug: string } | null;
  mentor?: { id: string; name: string; avatar: string } | null;
};

export type PathType = {
  id: string; title: string; slug: string; description: string; icon?: string;
  level: string; audience?: string; objective?: string; color?: string;
  courses: { course: CourseType; order: number }[];
};

const tickerItems = [
  { sym: "XAUUSD", price: "۲,۳۱۲.۵۰", chg: +0.84 },
  { sym: "EURUSD", price: "۱.۰۸۴۲", chg: -0.12 },
  { sym: "BTCUSD", price: "۶۱,۲۴۰", chg: +2.31 },
  { sym: "GBPUSD", price: "۱.۲۷۱۵", chg: +0.09 },
  { sym: "US30", price: "۳۸,۴۵۰", chg: +0.52 },
  { sym: "USOIL", price: "۷۸.۲۴", chg: -1.05 },
];

function Ticker() {
  return (
    <div className="flex items-center gap-6 overflow-hidden" dir="ltr">
      {tickerItems.map((t) => (
        <div key={t.sym} className="flex shrink-0 items-center gap-2 text-xs">
          <span className="font-bold text-foreground">{t.sym}</span>
          <span className="text-muted-foreground">{t.price}</span>
          <span className={cn("font-medium tabular-nums", t.chg >= 0 ? "text-primary" : "text-destructive")}>
            {t.chg >= 0 ? "▲" : "▼"} {toFa(Math.abs(t.chg).toFixed(2))}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { data, loading } = useFetch<PublicHomeData>("/api/public?section=home");
  const goPublic = useApp((s) => s.goPublic);
  const setMode = useApp((s) => s.setMode);
  const user = useApp((s) => s.user);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <main>
      {/* ===== hero ===== */}
      <section className="hero-grid-bg relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> آکادمی تخصصی ترید و بازارهای مالی
              </div>
              <h1 className="text-3xl font-extrabold leading-[1.35] md:text-5xl md:leading-[1.3]">
                از <span className="text-primary ticker-glow">صفر</span> تا معامله‌گر
                <br />
                حرفه‌ای و مستقل
              </h1>
              <p className="max-w-xl text-sm leading-8 text-muted-foreground md:text-base">
                آموزش ساختاریافته پرایس اکشن و اسمارت مانی، منتورینگ اختصاصی، ورک‌اسپیس تمرین چارت و ژورنال هوشمند معاملات — همه در یک پلتفرم. مسیر یادگیری شما را ما برنامه‌ریزی می‌کنیم؛ اجرا با شماست.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="glow-accent gap-2 text-base" onClick={() => goPublic("courses")}>
                  شروع یادگیری <ChevronLeft className="size-5" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => goPublic("services")}>
                  <Users className="size-4.5" /> مشاوره و منتورینگ
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 text-sm">
                {[
                  ["+۴,۲۰۰", "دانشجوی فعال"],
                  ["+۱۲۰", "ساعت آموزش تخصصی"],
                  ["۹۸٪", "رضایت دانشجویان"],
                  ["۸", "منتور حرفه‌ای"],
                ].map(([v, l]) => (
                  <div key={l} className="space-y-0.5">
                    <p className="text-xl font-extrabold text-primary">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* hero card */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <Card className="border-border/80 bg-card/90 shadow-2xl backdrop-blur">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <CandlestickChart className="size-5 text-primary" /> XAUUSD · طلا / دلار
                    </div>
                    <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">H1</span>
                  </div>
                  {/* mini candlestick svg */}
                  <svg viewBox="0 0 320 130" className="w-full" role="img" aria-label="نمودار نمایشی قیمت طلا">
                    {[
                      [10, 55, 75, 45, 85], [30, 50, 70, 42, 78], [50, 62, 82, 55, 90],
                      [70, 45, 65, 38, 72], [90, 55, 78, 50, 85], [110, 70, 92, 65, 100],
                      [130, 82, 95, 76, 105], [150, 75, 90, 70, 98], [170, 88, 108, 84, 115],
                      [190, 95, 100, 88, 110], [210, 92, 112, 86, 120], [230, 105, 122, 100, 130],
                      [250, 118, 125, 110, 128], [270, 112, 118, 104, 124], [290, 120, 128, 115, 130],
                    ].map(([x, o, c, l, h], i) => (
                      <g key={i}>
                        <line x1={x + 6} y1={130 - h} x2={x + 6} y2={130 - l} stroke={c >= o ? "#19b887" : "#ef5466"} strokeWidth="1.5" />
                        <rect x={x} y={130 - Math.max(o, c)} width="12" height={Math.abs(c - o) || 2} fill={c >= o ? "#19b887" : "#ef5466"} rx="2" />
                      </g>
                    ))}
                  </svg>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-[10px] text-muted-foreground">وین‌ریت این هفته</p>
                      <p className="mt-1 text-lg font-extrabold text-primary">{toFa("۶۷٪")}</p>
                    </div>
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-[10px] text-muted-foreground">R:R میانگین</p>
                      <p className="mt-1 text-lg font-extrabold text-sky-400">{toFa("۱:۲.۸")}</p>
                    </div>
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-[10px] text-muted-foreground">معاملات ثبت‌شده</p>
                      <p className="mt-1 text-lg font-extrabold">{faNum(8)}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">پیشرفت دوره پرایس اکشن</span>
                      <span className="font-bold text-primary">{toFa(68)}٪</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-300" style={{ width: "68%" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ticker strip */}
        <div className="border-y border-border bg-sidebar/70 py-2.5">
          <Ticker />
        </div>
      </section>

      {/* ===== why us ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHead center kicker="چرا دی‌صفارا؟" title="متفاوت با کلاس‌های معمول آنلاین" desc="ما فقط ویدیو نمی‌فروشیم؛ یک اکوسیستم کامل تمرین، منتورینگ و ارزیابی می‌سازیم تا یادگیری به نتیجه واقعی برسد." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <ChartCandlestick className="size-6" />, t: "ورک‌اسپیس معاملاتی", d: "تمرین مستقیم روی چارت تعاملی با ابزارهای تحلیل، سناریونویسی و ثبت تمرین برای منتور." },
            { icon: <Users className="size-6" />, t: "منتورینگ اختصاصی", d: "منتور متناسب با سطح شما، جلسات هفتگی، بررسی ژورنال و گزارش پیشرفت منظم." },
            { icon: <LineChart className="size-6" />, t: "ژورنال هوشمند", d: "ثبت معاملات با تحلیل خودکار وین‌ریت، پروفیت فکتور و آمار هر نماد." },
            { icon: <GraduationCap className="size-6" />, t: "مسیر ساختاریافته", d: "از صفر تا تخصص با نقشه راه مرحله‌به‌مرحله، آزمون و گواهینامه معتبر." },
          ].map((f) => (
            <Card key={f.t} className="card-hover border-border bg-card">
              <CardContent className="space-y-3 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{f.icon}</div>
                <p className="font-bold">{f.t}</p>
                <p className="text-sm leading-7 text-muted-foreground">{f.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== learning paths ===== */}
      <section className="border-y border-border bg-sidebar/40 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead kicker="مسیرهای یادگیری" title="نقشه راه خود را انتخاب کنید" desc="هر مسیر مجموعه‌ای هدفمند از دوره‌هاست که شما را قدم‌به‌قدم به هدف می‌رساند." />
          {loading ? (
            <div className="grid gap-5 md:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/50" />)}</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {data?.paths.map((p) => (
                <Card key={p.id} className="card-hover cursor-pointer border-border bg-card" onClick={() => goPublic("path", p.slug)}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl text-2xl" style={{ background: `${p.color}22`, color: p.color || "#19b887" }}>
                        {p.icon === "Rocket" ? "🚀" : p.icon === "Target" ? "🎯" : "₿"}
                      </div>
                      <span className="text-xs text-muted-foreground">{toFa(p.courses.length)} دوره</span>
                    </div>
                    <p className="mb-2 font-bold">{p.title}</p>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{p.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                      مشاهده مسیر <ChevronLeft className="size-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== featured courses ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <SectionHead kicker="دوره‌های محبوب" title="پرطرفدارترین دوره‌های دی‌صفارا" />
          <Button variant="outline" size="sm" onClick={() => goPublic("courses")}>همه دوره‌ها</Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.courses || []).slice(0, 6).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* ===== mentors ===== */}
      <section className="border-y border-border bg-sidebar/40 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead center kicker="منتورها" title="مربی‌هایی که خودشان معامله‌گرند" desc="منتورهای دی‌صفارا سال‌ها در بازار واقعی معامله کرده‌اند و مسیر شما را با تجربه واقعی هدایت می‌کنند." />
          <div className="grid gap-5 md:grid-cols-2">
            {data?.mentors.map((m) => (
              <Card key={m.id} className="card-hover border-border bg-card">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xl font-extrabold text-primary">
                    {m.name?.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold">{m.name}</p>
                    <p className="text-sm leading-7 text-muted-foreground">{m.bio}</p>
                    <Button size="sm" variant="outline" onClick={() => goPublic("mentors")}>مشاهده پلن‌ها</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== testimonials ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHead center kicker="نظرات دانشجویان" title="نتایج واقعی، از زبان خود دانشجویان" />
        <div className="grid gap-5 md:grid-cols-3">
          {data?.testimonials.slice(0, 3).map((t) => (
            <Card key={t.id} className="border-border bg-card">
              <CardContent className="space-y-4 p-6">
                <div className="flex gap-1 text-amber-400">{[...Array(t.rating)].map((_, i) => <span key={i}>★</span>)}</div>
                <p className="text-sm leading-7 text-foreground/90">«{t.content}»</p>
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
      </section>

      {/* ===== free resources ===== */}
      <section className="border-y border-border bg-sidebar/40 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-end justify-between">
            <SectionHead kicker="منابع رایگان" title="قبل از خرید، رایگان شروع کنید" />
            <Button variant="outline" size="sm" onClick={() => goPublic("resources")}>همه منابع</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.resources.slice(0, 3).map((r) => (
              <Card key={r.id} className="card-hover border-border bg-card">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {r.type === "VIDEO" ? <LineChart className="size-5" /> : <BookOpen className="size-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== blog teaser ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <SectionHead kicker="بلاگ" title="آخرین مقالات آموزشی" />
          <Button variant="outline" size="sm" onClick={() => goPublic("blog")}>همه مقالات</Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {data?.posts.map((p) => (
            <Card key={p.id} className="card-hover cursor-pointer border-border bg-card" onClick={() => goPublic("post", p.slug)}>
              <CardContent className="space-y-3 p-6">
                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary">{p.category}</span>
                <p className="font-bold leading-7">{p.title}</p>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{p.excerpt}</p>
                <p className="text-xs text-muted-foreground">{toFa(p.readTimeMin)} دقیقه مطالعه</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== faq ===== */}
      <section className="border-y border-border bg-sidebar/40 py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <SectionHead center kicker="سوالات متداول" title="هر سوالی داری، اینجا جوابش هست" />
          <div className="space-y-3">
            {data?.faqs.slice(0, 5).map((f) => (
              <Card key={f.id} className="overflow-hidden border-border bg-card">
                <button className="flex w-full items-center justify-between gap-4 p-5 text-right" onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}>
                  <span className="text-sm font-semibold">{f.question}</span>
                  <ChevronLeft className={cn("size-5 shrink-0 text-muted-foreground transition-transform", openFaq === f.id ? "-rotate-90" : "rotate-180")} />
                </button>
                {openFaq === f.id && <p className="border-t border-border px-5 py-4 text-sm leading-7 text-muted-foreground">{f.answer}</p>}
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => goPublic("faq")}>مشاهده همه سوالات</Button>
          </div>
        </div>
      </section>

      {/* ===== final CTA ===== */}
      <section className="hero-grid-bg mx-auto w-full py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="text-2xl font-extrabold md:text-4xl">مسیر معامله‌گری حرفه‌ای را امروز شروع کنید</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            اولین درس هر دوره رایگان است. همین حالا ثبت‌نام کنید و به بیش از ۴,۲۰۰ دانشجوی دی‌صفارا بپیوندید.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Button size="lg" className="glow-accent gap-2" onClick={() => setMode("student")}>
                <LayoutDashboard className="size-5" /> رفتن به داشبورد
              </Button>
            ) : (
              <AuthButtons />
            )}
            <Button size="lg" variant="outline" onClick={() => goPublic("courses")}>
              مرور دوره‌ها
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthButtons() {
  const setAuthOpen = useApp((s) => s.setAuthOpen);
  return (
    <Button size="lg" className="glow-accent gap-2" onClick={() => setAuthOpen(true)}>
      <LogIn className="size-5" /> ثبت‌نام رایگان
    </Button>
  );
}

/* ================= course card ================= */

export function CourseCard({ course }: { course: CourseType }) {
  const { goPublic, addToCart, user, setAuthOpen } = useApp();
  const off = course.oldPrice ? Math.round(((course.oldPrice - course.price) / course.oldPrice) * 100) : 0;

  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setAuthOpen(true); return; }
    const ok = addToCart({ type: "course", slug: course.slug, title: course.title, price: course.price });
    toast({ title: ok ? "به سبد خرید اضافه شد 🛒" : "قبلاً در سبد هست", description: course.title });
    if (ok) goPublic("cart");
  };

  return (
    <Card className="card-hover group cursor-pointer overflow-hidden border-border bg-card" onClick={() => goPublic("course", course.slug)}>
      <div className="relative">
        <CourseCover image={course.image} category={course.category?.slug} className="h-40 w-full" />
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-lg bg-destructive px-2 py-1 text-[11px] font-bold text-white">
            {toFa(off)}٪ تخفیف
          </span>
        )}
        {course.isFree && (
          <span className="absolute left-3 top-3 rounded-lg bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground">رایگان</span>
        )}
      </div>
      <CardContent className="space-y-3 p-5">
        {course.category && <span className="text-xs text-primary">{course.category.title}</span>}
        <p className="line-clamp-1 font-bold leading-7">{course.title}</p>
        <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{course.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><GraduationCap className="size-3.5" /> {faNum(course.studentsCount)}</span>
            <span className="flex items-center gap-1 text-amber-400">★ {faNum(course.rating, 1)}</span>
          </div>
          <span>{faNum(course.durationHours)} ساعت</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-baseline gap-2">
            <Price amount={course.price} className="text-primary" />
            {course.oldPrice ? <span className="text-xs text-muted-foreground line-through">{faNum(course.oldPrice)}</span> : null}
          </div>
          <Button size="sm" variant="secondary" onClick={add} className="gap-1">
            <ShoppingBag className="size-3.5" /> ثبت‌نام
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

