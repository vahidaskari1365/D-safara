"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { faDate, faNum, faToman, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Reveal, Counter, SectionHead, useFetch } from "./shared";
import { GannCinematic } from "./gann-cinematic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowUpRight, Award, BadgeCheck, BookOpen, Brain, CalendarDays, ChartCandlestick,
  CheckCircle2, ChevronLeft, Clock, Download, FileText, Globe, GraduationCap, Headphones,
  Instagram, LayoutDashboard, LineChart, LogIn, Menu, Newspaper, PlayCircle, Plus, Quote, Send,
  ShieldCheck, ShoppingCart, Sparkles, Star, Target, TrendingUp, Twitter, Users, Wallet, Youtube, Zap,
} from "lucide-react";

/* ============================================================
   types (public contract)
============================================================ */

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

/* ============================================================
   logo
============================================================ */

export function Logo({ small, showText }: { small?: boolean; showText?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => useApp.getState().goPublic("home")}
      className="group flex cursor-pointer items-center gap-3 outline-none"
      aria-label="دی‌صفارا — صفحه اصلی"
    >
      <span
        className={cn(
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-[0_8px_24px_-8px_rgba(25,184,135,0.7)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
          small ? "size-9" : "size-11"
        )}
      >
        {/* candlestick mark */}
        <svg viewBox="0 0 24 24" fill="none" className={cn(small ? "size-5" : "size-6")}>
          <line x1="7" y1="4" x2="7" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
          <rect x="4.4" y="9" width="5.2" height="8" rx="1.4" fill="currentColor" />
          <line x1="17" y1="2.5" x2="17" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
          <rect x="14.4" y="5" width="5.2" height="8" rx="1.4" fill="currentColor" opacity="0.85" />
        </svg>
      </span>
      {(showText || !small) && (
        <span className="leading-tight">
          <span className="block text-lg font-black tracking-tight">دی‌صفارا</span>
          <span className="block text-[9px] font-semibold tracking-[0.28em] text-muted-foreground">D.SAFARA ACADEMY</span>
        </span>
      )}
    </button>
  );
}

/* ============================================================
   course cover (deterministic gradient per category)
============================================================ */

const COVER_THEMES = [
  { grad: "from-emerald-600/30 via-emerald-800/20 to-background", icon: ChartCandlestick },
  { grad: "from-sky-600/25 via-sky-900/20 to-background", icon: Globe },
  { grad: "from-amber-500/25 via-amber-800/20 to-background", icon: Brain },
  { grad: "from-violet-500/25 via-violet-900/20 to-background", icon: LineChart },
  { grad: "from-rose-500/25 via-rose-900/20 to-background", icon: Target },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function CourseCover({
  image, category, className, icon,
}: { image?: string | null; category?: string | null; className?: string; icon?: React.ReactNode }) {
  const theme = COVER_THEMES[hashStr(category || "trading") % COVER_THEMES.length];
  const Icon = theme.icon;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImg = image && failedSrc !== image;
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-gradient-to-br", theme.grad, className)}>
      {showImg ? (
        <>
          <img
            src={image} alt={category || "دوره"}
            className="absolute inset-0 size-full object-cover"
            onError={() => setFailedSrc(image || null)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101827] via-transparent to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(232,237,244,0.35)_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="absolute -bottom-6 -left-6 size-28 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -top-8 right-4 size-20 rounded-full bg-sky-400/10 blur-2xl" />
          {icon || <Icon className="relative size-14 text-foreground/30" strokeWidth={1.4} />}
        </>
      )}
    </div>
  );
}

/* ============================================================
   candle chart (shared renderer for hero + mocks)
============================================================ */

type Candle = { o: number; h: number; l: number; c: number };

function seededCandles(n: number, seed: number, base: number, volatility: number): Candle[] {
  let s = seed | 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let price = base;
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const o = price;
    const c = o + (rnd() - 0.44) * volatility;
    const h = Math.max(o, c) + rnd() * volatility * 0.5;
    const l = Math.min(o, c) - rnd() * volatility * 0.5;
    price = c;
    out.push({ o, h, l, c });
  }
  return out;
}

function CandleChart({
  data, height = 220, showArea = true, gridLines = 3, className, decimals,
}: {
  data: Candle[]; height?: number; showArea?: boolean; gridLines?: number; className?: string; decimals?: number;
}) {
  const W = 600, H = 260, PAD_R = 74, PAD_B = 34, PAD_T = 12;
  if (data.length === 0) return null;
  const innerW = W - PAD_R - 10;
  const innerH = H - PAD_T - PAD_B;
  const lo = Math.min(...data.map((c) => c.l));
  const hi = Math.max(...data.map((c) => c.h));
  const span = hi - lo || 1;
  const y = (v: number) => PAD_T + ((hi - v) / span) * innerH;
  const step = innerW / data.length;
  const bodyW = Math.max(4, step * 0.55);
  const closes = data.map((c) => c.c);
  const smaPath = closes
    .map((_, i) => {
      const from = Math.max(0, i - 3);
      const slice = closes.slice(from, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const x = 10 + i * step + step / 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y(avg).toFixed(1)}`;
    })
    .join(" ");
  const areaPath = `${smaPath} L${(10 + (data.length - 1) * step + step / 2).toFixed(1)},${(H - PAD_B)} L10,${H - PAD_B} Z`;
  const last = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", className)} role="img" aria-label="نمودار قیمت">
      <defs>
        <linearGradient id="cc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#19b887" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#19b887" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {Array.from({ length: gridLines }).map((_, i) => {
        const gy = PAD_T + (innerH / (gridLines - 1 || 1)) * i;
        return <line key={i} x1="0" y1={gy} x2={W - PAD_R} y2={gy} stroke="rgba(139,160,189,0.09)" strokeDasharray="3 5" />;
      })}
      {/* area */}
      {showArea && <path d={areaPath} fill="url(#cc-area)" />}
      {/* sma */}
      <path d={smaPath} fill="none" stroke="#38bdf8" strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />
      {/* candles */}
      {data.map((c, i) => {
        const x = 10 + i * step + step / 2;
        const up = c.c >= c.o;
        const color = up ? "#19b887" : "#ef5466";
        const isLast = i === data.length - 1;
        const top = y(Math.max(c.o, c.c));
        const bot = y(Math.min(c.o, c.c));
        return (
          <g key={i} className={i > data.length - 4 ? "candle-in" : undefined}>
            <line x1={x} y1={y(c.h)} x2={x} y2={y(c.l)} stroke={color} strokeWidth="1.4" opacity={isLast ? 1 : 0.85} />
            <rect
              x={x - bodyW / 2} y={top} width={bodyW}
              height={Math.max(2, bot - top)} fill={color} rx="1.5"
              opacity={isLast ? 1 : 0.9}
            />
            {/* volume */}
            <rect
              x={x - bodyW / 2} y={H - PAD_B + 8} width={bodyW}
              height={Math.max(2, ((c.h - c.l) / span) * 16)}
              fill={color} opacity="0.28" rx="1.5"
            />
          </g>
        );
      })}
      {/* last price line */}
      <line x1="0" y1={y(last.c)} x2={W - PAD_R} y2={y(last.c)} stroke="#19b887" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      <circle cx={W - PAD_R} cy={y(last.c)} r="3.5" fill="#19b887" className="live-dot" />
      <rect x={W - PAD_R + 8} y={y(last.c) - 13} width="62" height="26" rx="7" fill="#0f2c22" stroke="rgba(25,184,135,0.5)" />
      <text x={W - PAD_R + 39} y={y(last.c) + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#4de3b0" fontFamily="Vazirmatn">
        {faNum(last.c, decimals ?? (last.c > 1000 ? 0 : last.c > 10 ? 2 : 4))}
      </text>
    </svg>
  );
}

/* ============================================================
   public header — floating glass pill on scroll
============================================================ */

const NAV_ITEMS = [
  { key: "courses", match: ["courses", "course"], label: "دوره‌ها" },
  { key: "paths", match: ["paths", "path"], label: "مسیرهای یادگیری" },
  { key: "mentors", match: ["mentors"], label: "منتورها" },
  { key: "services", match: ["services"], label: "خدمات منتورینگ" },
  { key: "blog", match: ["blog", "post"], label: "بلاگ" },
  { key: "contact", match: ["contact"], label: "تماس" },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { publicPage, user, cart } = useApp();
  const goPublic = useApp((s) => s.goPublic);
  const setAuthOpen = useApp((s) => s.setAuthOpen);
  const goStudent = useApp((s) => s.goStudent);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (matches: string[]) => matches.includes(publicPage);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className={cn("mx-auto transition-all duration-500", scrolled ? "max-w-6xl px-3 pt-3" : "max-w-7xl px-4 md:px-6")}>
        <div
          className={cn(
            "flex h-16 items-center justify-between gap-4 transition-all duration-500",
            scrolled
              ? "glass-strong rounded-full border-border/70 px-4 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.75)] md:px-6"
              : "border-b border-transparent px-0"
          )}
        >
          <Logo />

          {/* desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="ناوبری اصلی">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => goPublic(n.key)}
                data-active={isActive(n.match)}
                className="nav-link cursor-pointer text-sm font-medium text-foreground/75 transition-colors hover:text-foreground data-[active=true]:text-primary"
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* actions */}
          <div className="flex items-center gap-2">
            {/* cart */}
            <button
              type="button"
              onClick={() => goPublic("cart")}
              className="relative flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/60 text-foreground/80 transition-all hover:border-primary/40 hover:text-primary"
              aria-label="سبد خرید"
            >
              <ShoppingCart className="size-[18px]" />
              {cart.length > 0 && (
                <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {faNum(cart.length)}
                </span>
              )}
            </button>

            {user ? (
              <Button
                className="hidden gap-2 rounded-full sm:inline-flex"
                onClick={() => user.role === "ADMIN" ? useApp.getState().goAdmin("overview") : goStudent("overview")}
              >
                <LayoutDashboard className="size-4" /> داشبورد من
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="hidden rounded-full sm:inline-flex" onClick={() => setAuthOpen(true)}>
                  ورود
                </Button>
                <Button className="btn-gradient-lime hidden gap-1.5 rounded-full sm:inline-flex" onClick={() => goPublic("courses")}>
                  شروع یادگیری <ArrowLeft className="size-4" />
                </Button>
              </>
            )}

            {/* mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/60 lg:hidden"
                  aria-label="باز کردن منو"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-border bg-[#131d30]/95 backdrop-blur-xl p-0">
                <SheetHeader className="border-b border-border p-5 pb-4 text-right">
                  <SheetTitle className="sr-only">منوی ناوبری</SheetTitle>
                  <Logo showText />
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4" aria-label="ناوبری موبایل">
                  {NAV_ITEMS.map((n) => (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => { goPublic(n.key); setMobileOpen(false); }}
                      className={cn(
                        "cursor-pointer rounded-2xl px-4 py-3 text-right text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                        isActive(n.match) ? "bg-primary/10 text-primary" : "text-foreground/80"
                      )}
                    >
                      {n.label}
                    </button>
                  ))}
                  <div className="my-3 h-px bg-border" />
                  {user ? (
                    <Button className="w-full gap-2 rounded-full" onClick={() => { user.role === "ADMIN" ? useApp.getState().goAdmin("overview") : goStudent("overview"); setMobileOpen(false); }}>
                      <LayoutDashboard className="size-4" /> داشبورد من
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button className="btn-gradient-lime w-full rounded-full" onClick={() => { setAuthOpen(true); setMobileOpen(false); }}>
                        <LogIn className="size-4" /> ورود | ثبت‌نام
                      </Button>
                      <Button variant="outline" className="w-full rounded-full" onClick={() => { goPublic("courses"); setMobileOpen(false); }}>
                        مشاهده دوره‌ها
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   public footer — big rounded panel
============================================================ */

export function PublicFooter() {
  const goPublic = useApp((s) => s.goPublic);
  const [email, setEmail] = useState("");

  const quickLinks = [
    { label: "صفحه اصلی", page: "home" },
    { label: "همه دوره‌ها", page: "courses" },
    { label: "مسیرهای یادگیری", page: "paths" },
    { label: "منتورها", page: "mentors" },
    { label: "بلاگ", page: "blog" },
    { label: "سوالات متداول", page: "faq" },
  ];
  const serviceLinks = [
    { label: "خدمات منتورینگ", page: "services" },
    { label: "منابع رایگان", page: "resources" },
    { label: "نظرات دانشجویان", page: "testimonials" },
    { label: "درباره ما", page: "about" },
    { label: "تماس با ما", page: "contact" },
  ];

  const subscribe = () => {
    if (!email.includes("@")) {
      toast({ title: "ایمیل نامعتبر است", description: "لطفاً یک ایمیل صحیح وارد کنید.", variant: "destructive" });
      return;
    }
    setEmail("");
    toast({ title: "عضویت شما ثبت شد ✉️", description: "آخرین تحلیل‌ها و تخفیف‌ها را برایتان ارسال می‌کنیم." });
  };

  const socials = [
    { icon: Instagram, label: "اینستاگرام" },
    { icon: Send, label: "تلگرام" },
    { icon: Youtube, label: "یوتیوب" },
    { icon: Twitter, label: "توییتر" },
  ];

  return (
    <footer className="relative mt-auto px-3 pb-3 md:px-6 md:pb-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-t-[2.5rem] border border-b-0 border-border/70 bg-[#0d1522]">
        {/* glow hairlines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/60 to-transparent" aria-hidden />
        <div className="orb -right-24 -top-24 size-64 bg-primary/8" aria-hidden />
        <div className="orb -left-24 bottom-0 size-64 bg-violet-500/8" aria-hidden style={{ animationDelay: "-7s" }} />

        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
            {/* brand */}
            <div className="space-y-5">
              <Logo />
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                دی‌صفارا آکادمی تخصصی آموزش معامله‌گری در بازارهای مالی جهانی است؛ با دوره‌های ساختاریافته، منتورینگ اختصاصی و ورک‌اسپیس معاملاتی، مسیر شما از صفر تا حرفه‌ای طراحی شده است.
              </p>
              <div className="flex gap-2.5">
                {socials.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    aria-label={s.label}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/50 text-muted-foreground transition-all hover:-translate-y-1 hover:border-primary/40 hover:text-primary"
                  >
                    <s.icon className="size-[18px]" />
                  </button>
                ))}
              </div>
            </div>

            {/* links */}
            <nav aria-label="لینک‌های سریع">
              <p className="mb-4 text-sm font-bold">لینک‌های سریع</p>
              <ul className="space-y-2.5">
                {quickLinks.map((l) => (
                  <li key={l.page}>
                    <button type="button" onClick={() => goPublic(l.page)} className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="خدمات">
              <p className="mb-4 text-sm font-bold">خدمات و منابع</p>
              <ul className="space-y-2.5">
                {serviceLinks.map((l) => (
                  <li key={l.page}>
                    <button type="button" onClick={() => goPublic(l.page)} className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* contact + newsletter */}
            <div className="space-y-5">
              <p className="text-sm font-bold">در تماس باشیم</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>تهران، خیابان ولیعصر، برج نگین، طبقه ۱۲</li>
                <li dir="ltr" className="text-right">{toFa("021-9100 2233")}</li>
                <li dir="ltr" className="text-right">support@dsafara.com</li>
                <li>شنبه تا پنجشنبه، {toFa(9)} تا {toFa(18)}</li>
              </ul>
              <div className="space-y-2">
                <Label htmlFor="newsletter" className="text-xs text-muted-foreground">عضویت در خبرنامه تحلیل‌های هفتگی</Label>
                <div className="flex gap-2">
                  <Input
                    id="newsletter" dir="ltr" type="email" placeholder="you@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && subscribe()}
                    className="rounded-full bg-card/60"
                  />
                  <Button size="icon" className="glow-accent shrink-0 rounded-full" onClick={subscribe} aria-label="عضویت">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 md:flex-row">
            <p className="text-xs text-muted-foreground">
              © {toFa(1403)} دی‌صفارا — تمامی حقوق محفوظ است.
            </p>
            <div className="flex items-center gap-5">
              <button type="button" onClick={() => goPublic("privacy")} className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-primary">حریم خصوصی</button>
              <button type="button" onClick={() => goPublic("terms")} className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-primary">قوانین و مقررات</button>
              <span className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] text-primary">
                <span className="live-dot size-1.5 rounded-full bg-primary" /> محیط آزمایشی
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   auth dialog
============================================================ */

export function AuthDialog() {
  const { authOpen, setAuthOpen, setUser } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  useEffect(() => {
    if (authOpen) apiGet<{ demoMode: boolean }>("/api/auth").then((result) => setDemoMode(result.demoMode)).catch(() => setDemoMode(false));
  }, [authOpen]);

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

  const demoLogin = async (role: "student" | "mentor" | "admin") => {
    setLoading(true); setError("");
    try {
      const res = await apiPost<{ user: { id: string; name: string; phone: string; role: string; avatar: string | null; email?: string | null; bio?: string | null } }>("/api/auth", { action: "demo-login", role });
      const me = await apiGet<{ unreadNotifications: number; unreadMessages: number }>("/api/auth");
      setUser(res.user, me.unreadNotifications || 0, me.unreadMessages || 0);
      close();
      if (res.user.role === "ADMIN") useApp.getState().goAdmin("overview");
      else useApp.getState().goStudent("overview");
      toast({ title: "ورود به محیط نمایشی", description: "اطلاعات آزمایشی و موقتی هستند." });
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
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto border-border bg-card p-0 sm:rounded-3xl">
        <div className="h-1.5 w-full bg-gradient-to-l from-primary via-emerald-400 to-lime-300" />
        <div className="p-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="text-xl font-black">
              {step === "phone" ? "ورود | ثبت‌نام" : "کد تایید را وارد کنید"}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {step === "phone"
                ? (demoMode ? "برای بررسی پنل‌ها، یک نقش نمایشی انتخاب کنید یا با شماره آزمایشی وارد شوید." : "ورود واقعی هنوز پیکربندی نشده است.")
                : `کد آزمایشی نمایش‌داده‌شده را وارد کنید؛ پیامکی ارسال نشده است.`}
            </DialogDescription>
          </DialogHeader>

          {step === "phone" ? (
            <div className="mt-5 space-y-4">
              {demoMode && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-6 text-muted-foreground">
                <p className="mb-1 flex items-center gap-1.5 font-bold text-primary"><Sparkles className="size-3.5" /> ورود سریع نمایشی</p>
                <p className="mb-3">بدون دیتابیس و پیامک؛ حساب‌ها و داده‌ها مشترک و موقتی‌اند.</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => demoLogin("student")}>دانشجو</Button>
                  <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => demoLogin("mentor")}>منتور</Button>
                  <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => demoLogin("admin")}>مدیر</Button>
                </div>
              </div>}
              <div className="space-y-2">
                <Label htmlFor="auth-name">نام و نام خانوادگی (اختیاری)</Label>
                <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً علی کریمی" className="bg-card/60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-phone">شماره موبایل</Label>
                <Input
                  id="auth-phone" dir="ltr" inputMode="numeric" className="text-left bg-card/60"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="09xxxxxxxxx" maxLength={11}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="btn-gradient-lime w-full rounded-full" onClick={requestOtp} disabled={loading || phone.length !== 11}>
                {loading ? "در حال ارسال..." : "دریافت کد تایید"}
              </Button>

            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {devCode && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-center">
                  <p className="text-xs text-amber-400">حالت نمایشی — کد تایید شما:</p>
                  <p dir="ltr" className="mt-1 text-2xl font-black tracking-[0.4em] text-amber-300">{toFa(devCode)}</p>
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
              <Button className="btn-gradient-lime w-full rounded-full" onClick={verify} disabled={loading || code.length !== 6}>
                {loading ? "در حال بررسی..." : "تایید و ورود"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("phone")}>
                تغییر شماره
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   course card — new template shape (inset media + glass chips)
============================================================ */

const CAT_HUES: Record<string, string> = {
  technical: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "risk-management": "border-sky-400/30 bg-sky-400/10 text-sky-300",
  psychology: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  forex: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  crypto: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  bourse: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

const LEVEL_HUES: Record<string, string> = {
  BEGINNER: "border-emerald-400/30 bg-[#0b1a16]/70 text-emerald-300",
  INTERMEDIATE: "border-sky-400/30 bg-[#0a1726]/70 text-sky-300",
  ADVANCED: "border-violet-400/30 bg-[#150f28]/70 text-violet-300",
};

export function CourseCard({ course }: { course: CourseType }) {
  const goPublic = useApp((s) => s.goPublic);
  const levelMap: Record<string, string> = { BEGINNER: "مقدماتی", INTERMEDIATE: "متوسط", ADVANCED: "پیشرفته" };
  const catHue = CAT_HUES[course.category?.slug || ""];
  return (
    <article
      role="link" tabIndex={0}
      onClick={() => goPublic("course", course.slug)}
      onKeyDown={(e) => e.key === "Enter" && goPublic("course", course.slug)}
      className="card-premium group flex cursor-pointer flex-col overflow-hidden rounded-[1.75rem] pb-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* inset media */}
      <div className="relative m-2.5 mb-0 overflow-hidden rounded-2xl">
        <CourseCover
          image={course.image} category={course.category?.title}
          className="h-44 w-full transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute right-3 top-3 flex gap-2">
          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur", LEVEL_HUES[course.level] || "border-border/60 bg-[#101827]/70 text-foreground/90")}>
            {levelMap[course.level] || course.level}
          </span>
          {course.isFree && (
            <span className="rounded-full bg-gradient-to-l from-amber-300 to-amber-500 px-3 py-1 text-[11px] font-black text-amber-950 shadow-[0_4px_16px_-4px_rgba(245,181,68,0.55)]">رایگان</span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-border/60 bg-[#101827]/70 px-2.5 py-1 text-[11px] backdrop-blur">
          <Clock className="size-3 text-primary" /> {faNum(course.durationHours)} ساعت
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Star className="size-3.5 fill-amber-400" />
            <span className="font-bold">{faNum(course.rating, 1)}</span>
          </span>
          <span className="text-muted-foreground">{faNum(course.studentsCount)} دانشجو</span>
        </div>
        <h3 className="line-clamp-2 min-h-[3.5rem] text-[15px] font-bold leading-7 transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {course.mentor?.name?.charAt(0) || "د"}
          </span>
          {course.mentor?.name || "تیم دی‌صفارا"}
          {course.category && (
            <span className={cn("mr-auto rounded-full border px-2.5 py-0.5", catHue || "border-border bg-muted text-muted-foreground")}>
              {course.category.title}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-baseline gap-2">
            {course.oldPrice ? <span className="text-xs text-muted-foreground line-through">{faToman(course.oldPrice)}</span> : null}
            <span className={cn("text-base font-black", course.price === 0 ? "text-primary" : "text-foreground")}>
              {course.price === 0 ? "رایگان" : faToman(course.price)}
            </span>
          </div>
          <span className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <ChevronLeft className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   ticker band — floating glass strip
============================================================ */

function TickerBand() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 md:px-6">
      <div className="glass-strong flex flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-2xl px-5 py-4 text-xs text-muted-foreground">
        <span><b className="text-primary">●</b> آموزش ساختاریافته</span>
        <span><b className="text-primary">●</b> تمرین در کنار منتور</span>
        <span><b className="text-primary">●</b> ژورنال و گزارش عملکرد</span>
        <span><b className="text-primary">●</b> نمودار بازار با TradingView</span>
      </div>
    </div>
  );
}

/* ============================================================
   home page — template v4
============================================================ */

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

const HOME_STATS = [
  { icon: Users, value: 12400, suffix: "+", label: "دانشجوی فعال", orb: "bg-primary/12 text-primary", bar: "from-primary to-emerald-300", w: "88%" },
  { icon: GraduationCap, value: 38, suffix: "", label: "منتور متخصص", orb: "bg-sky-400/12 text-sky-400", bar: "from-sky-400 to-sky-300", w: "64%" },
  { icon: PlayCircle, value: 960, suffix: "+", label: "ساعت محتوای آموزشی", orb: "bg-violet-400/12 text-violet-400", bar: "from-violet-400 to-violet-300", w: "76%" },
  { icon: ShieldCheck, value: 97, suffix: "٪", label: "رضایت دانشجویان", orb: "bg-amber-400/12 text-amber-400", bar: "from-amber-400 to-amber-300", w: "95%" },
];

export function HomePage() {
  const { data, loading } = useFetch<PublicHomeData>("/api/public?section=home");
  const goPublic = useApp((s) => s.goPublic);
  const setAuthOpen = useApp((s) => s.setAuthOpen);
  const setMode = useApp((s) => s.setMode);
  const user = useApp((s) => s.user);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const startLearning = () => (user ? setMode(user.role === "ADMIN" ? "admin" : "student") : setAuthOpen(true));

  return (
    <main>
      <section className="gann-hero relative overflow-hidden">
        <div className="gann-hero-noise" aria-hidden="true" />
        <div className="gann-hero-inner mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-16 md:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-4 lg:pb-20 lg:pt-24">
          <div className="relative z-10 max-w-xl text-right">
            <Reveal><span className="gann-kicker"><span /> آکادمی تخصصی معامله‌گری دی‌صفارا</span></Reveal>
            <Reveal delay={80}><h1 className="gann-headline mt-7 text-4xl font-black leading-[1.45] md:text-6xl md:leading-[1.45]">بازار را از زاویه‌ای<br /><span>دیگر ببین.</span></h1></Reveal>
            <Reveal delay={160}><p className="mt-5 max-w-lg text-sm leading-8 text-slate-300/80 md:text-base">از هندسه‌ی گن تا مهارت معامله‌گری؛ آموزش عمیق، تمرین روی چارت و همراهی منتور، در یک مسیر منسجم.</p></Reveal>
            <Reveal delay={240} className="mt-8 flex flex-wrap gap-3"><Button size="lg" className="gann-primary h-12 rounded-lg px-7 font-bold" onClick={startLearning}>شروع مسیر یادگیری <ArrowLeft className="size-4" /></Button><Button size="lg" variant="outline" className="h-12 rounded-lg border-white/15 bg-white/[.03] px-6" onClick={() => goPublic("paths")}>کشف مسیرها <ChevronLeft className="size-4" /></Button></Reveal>
            <Reveal delay={320} className="gann-hero-foot mt-10 flex flex-wrap items-center gap-5"><span>آموزش ساختاریافته</span><span>تحلیل و تمرین</span><span>منتورینگ اختصاصی</span></Reveal>
          </div>
          <Reveal delay={160} className="gann-visual-wrap"><GannCinematic /></Reveal>
        </div>
        <div className="gann-bottom-line"><span>THE ART OF MARKET GEOMETRY</span><span>آموزش · تحلیل · پیشرفت</span><span>DS / 01</span></div>
      </section>
      <section className="landing-features mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-3 md:px-6 md:py-16">
        {[{ icon: BookOpen, title: "یادگیری با مسیر مشخص", text: "از مبانی تا استراتژی، با دوره‌هایی که قدم به قدم همراه تو هستند." }, { icon: ChartCandlestick, title: "تمرین در فضای واقعی بازار", text: "تحلیل، ژورنال و بررسی عملکرد خود را یک‌جا دنبال کن." }, { icon: Users, title: "همراهی منتور", text: "از تجربه منتورها برای ساختن یک مسیر شخصی استفاده کن." }].map((item) => <div key={item.title} className="landing-feature"><item.icon className="size-5 text-[#b6ff5a]" /><h3 className="mt-5 font-bold">{item.title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{item.text}</p></div>)}
      </section>

      {/* ================= FEATURED COURSES ================= */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              kicker="دوره‌های محبوب"
              title="پرطرفدارترین دوره‌های دی‌صفارا"
              desc="دسترسی مادام‌العمر، تمرین تعاملی و پشتیبانی منتور — انتخاب اکثر دانشجوهای ما."
              tone="sky"
            />
            <Reveal className="mb-10 hidden md:block">
              <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => goPublic("courses")}>
                همه دوره‌ها <ChevronLeft className="size-4" />
              </Button>
            </Reveal>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? [...Array(6)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-[1.75rem] bg-muted/40" />)
              : (data?.courses || []).slice(0, 6).map((c, i) => (
                  <Reveal key={c.id} delay={(i % 3) * 90}>
                    <CourseCard course={c} />
                  </Reveal>
                ))}
          </div>
          <Reveal className="mt-10 text-center md:hidden">
            <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => goPublic("courses")}>
              مشاهده همه دوره‌ها <ChevronLeft className="size-4" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ================= LEARNING PATHS ================= */}
      <section className="band band-emerald py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead
            center
            kicker="مسیرهای یادگیری"
            title="نقشه راه خودت را انتخاب کن"
            desc="هر مسیر یک برنامه هدفمند از دوره‌ها، تمرین‌ها و آزمون‌هاست که قدم‌به‌قدم شما را به هدف می‌رساند."
          />
          {loading ? (
            <div className="grid gap-5 md:grid-cols-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-56 animate-pulse rounded-[1.75rem] bg-muted/40" />)}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(data?.paths || []).map((p, i) => {
                const hours = p.courses.reduce((a, c) => a + (c.course?.durationHours || 0), 0);
                const featured = i === 0;
                return (
                  <Reveal
                    key={p.id}
                    delay={i * 110}
                    className={cn(featured && "md:col-span-2 lg:col-span-1")}
                  >
                    <article
                      role="link" tabIndex={0}
                      onClick={() => goPublic("path", p.slug)}
                      onKeyDown={(e) => e.key === "Enter" && goPublic("path", p.slug)}
                      className={cn(
                        "card-premium group relative flex h-full cursor-pointer flex-col gap-5 rounded-[1.75rem] p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        featured && "hairline-top"
                      )}
                      style={{ "--hairline-color": `${p.color || "#19b887"}88` } as React.CSSProperties}
                    >
                      {featured && (
                        <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-l from-primary to-emerald-500 px-3 py-1 text-[10px] font-black text-primary-foreground shadow-lg">
                          پیشنهاد شروع
                        </span>
                      )}
                      <div className="flex items-start justify-between">
                        <span
                          className="icon-orb size-14 text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                          style={{ background: `${p.color || "#19b887"}1f`, color: p.color || "#19b887" }}
                        >
                          {p.icon === "Rocket" ? "🚀" : p.icon === "Target" ? "🎯" : p.icon === "Bitcoin" ? "₿" : "📈"}
                        </span>
                        <span className="rounded-full border border-border/70 bg-card/50 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                          {faNum(p.courses.length)} دوره · {faNum(hours)} ساعت
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-black transition-colors group-hover:text-primary">{p.title}</h3>
                        <p className={cn("text-sm leading-7 text-muted-foreground", featured ? "line-clamp-2" : "line-clamp-3")}>{p.description}</p>
                      </div>
                      {featured && p.courses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.courses.slice(0, 3).map((c) => (
                            <span key={c.course.id} className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
                              {c.course.title}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="mt-auto flex items-center justify-between pt-2">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                          شروع مسیر
                          <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowLeft className="size-3.5" />
                        </span>
                      </span>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= WHY US — asymmetric bento ================= */}
      <section className="band band-deep py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead
            center
            kicker="چرا دی‌صفارا؟"
            title="فراتر از یک دوره آنلاین"
            desc="ما فقط ویدیو نمی‌فروشیم؛ یک اکوسیستم کامل تمرین، منتورینگ و ارزیابی ساخته‌ایم تا یادگیری به نتیجه واقعی برسد."
            tone="violet"
          />
          <div className="grid gap-5 md:grid-cols-6">
            {/* workspace — wide */}
            <Reveal className="md:col-span-4">
              <div className="card-premium hairline-top flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[1.75rem] p-7 lg:flex-row lg:items-center">
                <div className="max-w-xs space-y-3">
                  <span className="icon-orb size-12 bg-primary/12 text-primary">
                    <ChartCandlestick className="size-6" />
                  </span>
                  <h3 className="text-lg font-black">ورک‌اسپیس معاملاتی</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    تمرین مستقیم روی چارت تعاملی با ابزارهای تحلیل، سناریونویسی و ثبت تمرین برای بررسی منتور.
                  </p>
                </div>
                <div className="w-full max-w-[250px] shrink-0 rounded-2xl border border-border/60 bg-[#0d1522]/70 p-3">
                  <CandleChart data={seededCandles(14, 5, 2180, 8)} height={150} showArea={false} gridLines={2} />
                </div>
              </div>
            </Reveal>

            {/* mentoring */}
            <Reveal delay={100} className="md:col-span-2">
              <div className="card-premium flex h-full flex-col gap-3 rounded-[1.75rem] p-7">
                <span className="icon-orb size-12 bg-sky-400/12 text-sky-400">
                  <Users className="size-6" />
                </span>
                <h3 className="text-lg font-black">منتورینگ اختصاصی</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  منتور متناسب با سطح شما؛ جلسات هفتگی، بررسی ژورنال و گزارش پیشرفت منظم.
                </p>
                <div className="mt-auto flex -space-x-2 space-x-reverse pt-2">
                  {["ا", "ش", "ک"].map((ch, i) => (
                    <span key={i} className="flex size-8 items-center justify-center rounded-full border-2 border-[#141f32] bg-gradient-to-br from-primary/60 to-emerald-900 text-[10px] font-bold text-primary-foreground">
                      {ch}
                    </span>
                  ))}
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#141f32] bg-muted text-[9px] font-bold">
                    +{toFa(35)}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* journal */}
            <Reveal className="md:col-span-2">
              <div className="card-premium flex h-full flex-col gap-3 rounded-[1.75rem] p-7">
                <span className="icon-orb size-12 bg-violet-400/12 text-violet-400">
                  <LineChart className="size-6" />
                </span>
                <h3 className="text-lg font-black">ژورنال هوشمند</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  ثبت معاملات با تحلیل خودکار وین‌ریت، پروفیت فکتور و آمار هر نماد.
                </p>
                <div className="mt-auto flex items-end gap-1.5 pt-2" aria-hidden>
                  {[38, 62, 46, 80, 58, 92].map((h, i) => (
                    <span key={i} className={cn("w-4 rounded-t-lg", i % 3 === 2 ? "bg-destructive/50" : "bg-primary/60")} style={{ height: h / 4 + 8 }} />
                  ))}
                </div>
              </div>
            </Reveal>

            {/* certificate */}
            <Reveal delay={90} className="md:col-span-2">
              <div className="card-premium flex h-full flex-col gap-3 rounded-[1.75rem] p-7">
                <span className="icon-orb size-12 bg-amber-400/12 text-amber-400">
                  <Award className="size-6" />
                </span>
                <h3 className="text-lg font-black">آزمون و گواهینامه معتبر</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  با آزمون‌های پایان دوره، گواهینامه قابل استعلام بگیرید و رزومه‌تان را قوی کنید.
                </p>
                <div className="mt-auto pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300">
                    <Award className="size-3.5" /> گواهینامه DS-{toFa(2407)}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* support */}
            <Reveal delay={180} className="md:col-span-2">
              <div className="card-premium flex h-full flex-col gap-3 rounded-[1.75rem] p-7">
                <span className="icon-orb size-12 bg-primary/12 text-primary">
                  <Headphones className="size-6" />
                </span>
                <h3 className="text-lg font-black">پشتیبانی ۲۴/۷ و جامعه حرفه‌ای</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  هر سوالی داری بپرس؛ تیم پشتیبانی و جامعه هزاران معامله‌گر همیشه پاسخگوست.
                </p>
                <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-primary">
                  <span className="live-dot size-2 rounded-full bg-primary" /> پشتیبان آنلاین است
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= WORKSPACE SHOWCASE ================= */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Reveal>
            <div className="glass relative overflow-hidden rounded-[2rem]">
              <div className="orb -left-20 bottom-[-30%] size-72 bg-primary/10" aria-hidden />
              <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-2 lg:items-center">
                {/* copy */}
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-1.5 text-xs font-semibold text-sky-300">
                    <Zap className="size-3.5" /> تریدینگ ورک‌اسپیس
                  </span>
                  <h2 className="text-2xl font-black leading-[1.4] md:text-4xl md:leading-[1.35]">
                    همان محیطی که در آن
                    <span className="text-gradient"> معامله می‌کنی</span>، همان‌جا یاد می‌گیری
                  </h2>
                  <ul className="space-y-3.5">
                    {[
                      "چارت کندل‌استیک زنده با ابزارهای ترسیم و اندازه‌گیری",
                      "ثبت تمرین تحلیل و ارسال مستقیم برای بررسی منتور",
                      "اتصال به ژورنال معاملات و مشاهده آمار لحظه‌ای",
                      "تمرین روی سناریوهای واقعی بازار بدون ریسک مالی",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-sm leading-7 text-foreground/85">
                        <CheckCircle2 className="mt-1 size-4.5 shrink-0 text-primary" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="glow-accent gap-2 rounded-full" onClick={startLearning}>
                    ورود به ورک‌اسپیس <ArrowLeft className="size-4.5" />
                  </Button>
                </div>

                {/* mock window + floating chips */}
                <div className="relative">
                  <div className="absolute -inset-4 rounded-[2rem] bg-primary/8 blur-2xl" aria-hidden />
                  <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-[#0d1522] shadow-2xl">
                    {/* window bar */}
                    <div className="flex items-center gap-2 border-b border-border/60 bg-card/60 px-4 py-2.5" dir="ltr">
                      <span className="size-2.5 rounded-full bg-rose-500/70" />
                      <span className="size-2.5 rounded-full bg-amber-400/70" />
                      <span className="size-2.5 rounded-full bg-primary/70" />
                      <span className="mx-auto rounded-full bg-muted/70 px-3 py-0.5 text-[10px] font-bold text-muted-foreground" dir="rtl">
                        XAUUSD · H1 — ورک‌اسپیس دی‌صفارا
                      </span>
                    </div>
                    <div className="grid grid-cols-[44px_1fr]">
                      {/* tool rail */}
                      <div className="flex flex-col items-center gap-3 border-e border-border/60 py-4" dir="ltr">
                        {[ChartCandlestick, LineChart, Target, Wallet].map((I, i) => (
                          <span key={i} className={cn("flex size-8 items-center justify-center rounded-xl", i === 0 ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
                            <I className="size-4" />
                          </span>
                        ))}
                      </div>
                      <div className="space-y-3 p-3">
                        <CandleChart data={seededCandles(20, 11, 2310, 8)} height={170} />
                        {/* order row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-center">
                            <p className="text-[10px] text-primary/80">خرید / BUY</p>
                            <p className="text-sm font-black text-primary">{faNum(2346.8, 1)}</p>
                          </div>
                          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-center">
                            <p className="text-[10px] text-destructive/80">فروش / SELL</p>
                            <p className="text-sm font-black text-destructive">{faNum(2344.2, 1)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* floating result chips */}
                  <div className="float-card-2 absolute -left-4 -top-4 hidden items-center gap-2 glass-strong rounded-2xl px-3.5 py-2 shadow-xl md:flex">
                    <span className="icon-orb size-8 bg-primary/15 text-primary"><CheckCircle2 className="size-4" /></span>
                    <span className="text-xs font-bold">تمرین ثبت شد ✓</span>
                  </div>
                  <div className="float-card absolute -bottom-5 -right-3 hidden items-center gap-2 glass-strong rounded-2xl px-3.5 py-2 shadow-xl md:flex" style={{ animationDelay: "-3s" }}>
                    <span className="icon-orb size-8 bg-amber-400/15 text-amber-400"><TrendingUp className="size-4" /></span>
                    <span className="text-xs font-bold">+{toFa(32)} پیپ سود تمرینی</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= MENTORS ================= */}
      {(data?.mentors?.length ?? 0) > 0 && (
        <section className="band band-sky py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <SectionHead
              center
              kicker="منتورها"
              title="مربی‌هایی که خودشان معامله‌گرند"
              desc="منتورهای دی‌صفارا سال‌ها در بازار واقعی معامله کرده‌اند و مسیر شما را با تجربه واقعی هدایت می‌کنند."
              tone="amber"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(data?.mentors || []).slice(0, 4).map((m, i) => {
                const stat = [
                  { v: `${toFa(240)}+`, l: "دانشجو" },
                  { v: `${toFa(180)}+`, l: "دانشجو" },
                  { v: `${toFa(310)}+`, l: "دانشجو" },
                  { v: `${toFa(150)}+`, l: "دانشجو" },
                ][i % 4];
                return (
                  <Reveal key={m.id} delay={i * 90}>
                    <div className="card-premium group flex h-full flex-col items-center gap-3 rounded-[1.75rem] p-6 text-center">
                      <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-emerald-900/60 text-2xl font-black text-primary ring-2 ring-primary/30 ring-offset-4 ring-offset-[#101827] transition-transform duration-300 group-hover:scale-105">
                        {m.name?.charAt(0)}
                        <span className="absolute bottom-1 left-1 size-3.5 rounded-full border-2 border-[#141f32] bg-primary" />
                      </span>
                      <div>
                        <p className="font-black">{m.name}</p>
                        <p className="mt-0.5 text-xs text-primary">منتور دی‌صفارا</p>
                      </div>
                      <p className="line-clamp-3 text-xs leading-6 text-muted-foreground">{m.bio}</p>
                      <span className="rounded-full border border-border/70 bg-card/50 px-3 py-1 text-[11px] font-bold text-foreground/85">
                        {stat.v} {stat.l}
                      </span>
                      <button
                        type="button"
                        onClick={() => goPublic("mentors")}
                        className="mt-auto inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        پلن‌های منتورینگ <ChevronLeft className="size-3.5" />
                      </button>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= TESTIMONIALS MARQUEE ================= */}
      {(data?.testimonials?.length ?? 0) >= 3 && (
        <section className="band band-violet overflow-hidden py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <SectionHead
              center
              kicker="نظرات دانشجویان"
              title="نتایج واقعی، از زبان خود دانشجویان"
              tone="sky"
            />
          </div>
          {(() => {
            const t = data!.testimonials;
            const half = Math.ceil(t.length / 2);
            const rows = [t.slice(0, half), t.slice(half).length >= 2 ? t.slice(half) : t.slice(0, half)];
            return (
              <div className="marquee-paused space-y-5" dir="ltr">
                {rows.map((row, ri) => {
                  const doubled = [...row, ...row];
                  return (
                    <div key={ri} className="mask-fade-x overflow-hidden">
                      <div
                        className={cn("marquee gap-5", ri === 1 && "marquee-rev")}
                        style={{ "--marquee-dur": ri === 0 ? "46s" : "54s" } as React.CSSProperties}
                      >
                        {[0, 1].map((halfIdx) => (
                          <div key={halfIdx} className="flex shrink-0 gap-5 pl-5" dir="rtl">
                            {doubled.map((q, i) => (
                              <figure
                                key={`${halfIdx}-${i}`}
                                className="glass relative w-[320px] shrink-0 overflow-hidden rounded-[1.5rem] p-5 md:w-[380px]"
                              >
                                <Quote className="absolute -top-1 left-4 size-16 text-primary/8" aria-hidden />
                                <div className="mb-3 flex gap-1">
                                  {[...Array(q.rating)].map((_, si) => (
                                    <Star key={si} className="size-3.5 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                                <blockquote className="text-sm leading-7 text-foreground/90">«{q.content}»</blockquote>
                                <figcaption className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                    {q.name.charAt(0)}
                                  </span>
                                  <span>
                                    <span className="block text-sm font-bold">{q.name}</span>
                                    <span className="block text-xs text-muted-foreground">{q.role}</span>
                                  </span>
                                </figcaption>
                              </figure>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
      )}

      {/* ================= BLOG ================= */}
      {(data?.posts?.length ?? 0) > 0 && (
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHead kicker="بلاگ دی‌صفارا" title="آخرین مقالات آموزشی" tone="violet" />
              <Reveal className="mb-10 hidden md:block">
                <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => goPublic("blog")}>
                  همه مقالات <ChevronLeft className="size-4" />
                </Button>
              </Reveal>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {(data?.posts || []).slice(0, 3).map((p, i) => (
                <Reveal key={p.id} delay={i * 100}>
                  <article
                    role="link" tabIndex={0}
                    onClick={() => goPublic("post", p.slug)}
                    onKeyDown={(e) => e.key === "Enter" && goPublic("post", p.slug)}
                    className="card-premium group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] pb-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative m-2.5 mb-0 h-36 overflow-hidden rounded-2xl">
                      <CourseCover
                        category={p.category}
                        className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05]"
                        icon={<Newspaper className="size-10 text-foreground/25" strokeWidth={1.4} />}
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-[#101827]/75 px-3 py-1 text-[11px] font-semibold text-primary backdrop-blur">
                        {p.category}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2.5 px-5 pt-4">
                      <h3 className="line-clamp-2 font-bold leading-7 transition-colors group-hover:text-primary">{p.title}</h3>
                      <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{p.excerpt}</p>
                      <div className="mt-auto flex items-center gap-4 pt-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {faDate(p.createdAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3.5" /> {faNum(p.readTimeMin)} دقیقه</span>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= FREE RESOURCES ================= */}
      {(data?.resources?.length ?? 0) > 0 && (
        <section className="band band-gold py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHead kicker="منابع رایگان" title="قبل از خرید، رایگان شروع کن" tone="amber" />
              <Reveal className="mb-10 hidden md:block">
                <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => goPublic("resources")}>
                  همه منابع <ChevronLeft className="size-4" />
                </Button>
              </Reveal>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(data?.resources || []).slice(0, 4).map((r, i) => {
                const Icon = r.type === "VIDEO" ? PlayCircle : r.type === "PDF" ? FileText : BookOpen;
                const hue = r.type === "VIDEO" ? "bg-violet-400/12 text-violet-400" : r.type === "PDF" ? "bg-amber-400/12 text-amber-400" : "bg-sky-400/12 text-sky-400";
                return (
                  <Reveal key={r.id} delay={i * 80}>
                    <button
                      type="button"
                      onClick={() =>
                        apiPost("/api/public", { action: "download-resource", id: r.id })
                          .then(() => toast({ title: "درخواست شما ثبت شد 📥", description: "لینک دانلود برایتان ارسال می‌شود." }))
                          .catch(() => toast({ title: "خطا در دریافت", variant: "destructive" }))
                      }
                      className="card-premium group flex w-full cursor-pointer items-center gap-3.5 rounded-[1.5rem] p-4 text-right outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={cn("icon-orb size-11 transition-transform duration-300 group-hover:scale-110", hue)}>
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{r.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{faNum(r.downloads)} دانلود · {r.size}</span>
                      </span>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:text-primary">
                        <Download className="size-4" />
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= FAQ ================= */}
      {(data?.faqs?.length ?? 0) > 0 && (
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <SectionHead center kicker="سوالات متداول" title="هر سوالی داری، اینجا جوابش هست" />
            <div className="space-y-3">
              {(data?.faqs || []).slice(0, 6).map((f, i) => {
                const open = openFaq === f.id;
                return (
                  <Reveal key={f.id} delay={i * 60}>
                    <div className={cn("overflow-hidden rounded-2xl border bg-card/70 transition-all", open ? "border-primary/40 shadow-[0_0_36px_-14px_rgba(25,184,135,0.4)]" : "border-border")}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : f.id)}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-right"
                        aria-expanded={open}
                      >
                        <span className="text-sm font-bold leading-7">{f.question}</span>
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-all duration-300", open && "rotate-45 border-primary/40 bg-primary/10 text-primary")}>
                          <Plus className="size-4" />
                        </span>
                      </button>
                      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="overflow-hidden">
                          <p className="border-t border-border/60 px-5 py-4 text-sm leading-8 text-muted-foreground">{f.answer}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                جوابت را پیدا نکردی؟{" "}
                <button type="button" onClick={() => goPublic("contact")} className="cursor-pointer font-bold text-primary hover:underline">
                  با ما در تماس باش
                </button>
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ================= FINAL CTA ================= */}
      <section className="px-4 pb-24 pt-4 md:px-6">
        <Reveal className="mx-auto max-w-5xl">
          <div className="cta-deep noise dots-pattern relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center md:px-14 md:py-20">
            <div className="orb -left-16 -top-16 size-64 bg-lime-400/10" aria-hidden />
            <div className="orb -bottom-20 -right-10 size-72 bg-violet-500/10" aria-hidden style={{ animationDelay: "-8s" }} />
            <div className="relative space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-1.5 text-xs font-bold text-lime-200">
                <Sparkles className="size-3.5" /> همین امروز شروع کن
              </span>
              <h2 className="mx-auto max-w-2xl text-3xl font-black leading-[1.35] md:text-5xl md:leading-[1.3]">
                آماده‌ای مسیر حرفه‌ای‌ات را
                <span className="text-gradient-lime"> شروع کنی؟</span>
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-8 text-muted-foreground md:text-base">
                اولین قدم رایگان است. ثبت‌نام کن، منابع رایگان را دریافت کن و با منتورهای حرفه‌ای مسیرت را بساز.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button size="lg" className="btn-gradient-lime h-13 gap-2 rounded-full px-8 text-base" onClick={startLearning}>
                  ثبت‌نام رایگان <ArrowLeft className="size-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-13 rounded-full border-border/80 bg-card/40 px-8" onClick={() => goPublic("contact")}>
                  مشاوره رایگان
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 pt-4 text-xs text-muted-foreground">
                {["دسترسی مادام‌العمر به محتوا", "تضمین بازگشت وجه تا ۷ روز", "پشتیبانی مستقیم منتور"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
