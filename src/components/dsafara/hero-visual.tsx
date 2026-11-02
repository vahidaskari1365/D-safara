"use client";

/* ============================================================
   Hero Motion Visual — تصویر سینمایی تریدینگ + لایه‌های موشن گرافیک
   (کن بِرنز، پارالاکس موس، ذرات صعودی، چارت متحرک SVG،
    نور جاروب‌کننده، تیکر زنده و نشان‌های شیشه‌ای شناور)
============================================================ */

import { useEffect, useRef, useState } from "react";
import { faNum } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Target, Wallet } from "lucide-react";

/* ---------- deterministic pseudo-random (SSR-safe) ---------- */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- rising particles ---------- */
type Particle = {
  x: number; size: number; delay: number; dur: number;
  drift: number; opacity: number; gold: boolean;
};
const PARTICLES: Particle[] = (() => {
  const rnd = mulberry32(20240613);
  return Array.from({ length: 26 }, () => ({
    x: rnd() * 100,
    size: 2 + rnd() * 5,
    delay: -rnd() * 16,
    dur: 9 + rnd() * 11,
    drift: (rnd() - 0.5) * 64,
    opacity: 0.3 + rnd() * 0.55,
    gold: rnd() < 0.2,
  }));
})();

/* ---------- live mini ticker ---------- */
type Tick = { sym: string; price: number; vol: number; dec: number; up: boolean };
const INITIAL_TICKS: Tick[] = [
  { sym: "XAUUSD", price: 2348.5, vol: 2.2, dec: 1, up: true },
  { sym: "BTCUSD", price: 61240, vol: 85, dec: 0, up: true },
  { sym: "EURUSD", price: 1.0842, vol: 0.0028, dec: 4, up: false },
];

/* ---------- overlay trend path ---------- */
const CHART_PATH =
  "M20,316 C96,282 148,300 204,252 C252,212 296,240 348,198 C404,152 448,164 502,112 C544,72 576,64 612,40";
const CHART_AREA = `${CHART_PATH} L612,400 L20,400 Z`;

export function HeroMotionVisual() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ticks, setTicks] = useState<Tick[]>(INITIAL_TICKS);

  /* live price simulation */
  useEffect(() => {
    const id = setInterval(() => {
      setTicks((ts) =>
        ts.map((t) => {
          const drift = (Math.random() - 0.46) * t.vol;
          return { ...t, price: t.price + drift, up: drift >= 0 };
        })
      );
    }, 1600);
    return () => clearInterval(id);
  }, []);

  /* mouse parallax (rAF-throttled, respects reduced-motion) */
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setTilt({ x, y }));
  };
  const handleLeave = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setTilt({ x: 0, y: 0 }));
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const head = ticks[0];

  return (
    <div className="relative">
      {/* ambient glow behind panel */}
      <div className="absolute -inset-7 rounded-[2.75rem] bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -inset-7 left-10 top-10 rounded-[2.75rem] bg-sky-500/8 blur-3xl" aria-hidden />

      <div
        ref={wrapRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="hero-visual-in relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.85)] sm:aspect-[16/11] lg:aspect-[13/10]"
        role="img"
        aria-label="چارت سه‌بعدی متحرک از رشد بازارهای جهانی با ذرات نوری و تیکر زنده قیمت‌ها"
      >
        {/* layer 1 — cinematic image (ken burns inside, parallax outside) */}
        <div
          className="parallax-layer absolute inset-0"
          style={{ transform: `translate3d(${tilt.x * 10}px, ${tilt.y * 8}px, 0)` }}
        >
          <img
            src="/images/hero-motion.png"
            alt=""
            aria-hidden
            draggable={false}
            fetchPriority="high"
            className="hero-visual-img size-full select-none object-cover"
          />
        </div>

        {/* layer 2 — rising particles */}
        <div
          className="parallax-layer absolute inset-0 z-10 overflow-hidden"
          style={{ transform: `translate3d(${tilt.x * -8}px, ${tilt.y * -6}px, 0)` }}
          aria-hidden
        >
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className={cn("particle", p.gold && "particle-gold")}
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                ["--p-delay" as string]: `${p.delay}s`,
                ["--p-dur" as string]: `${p.dur}s`,
                ["--p-drift" as string]: `${p.drift}px`,
                ["--p-opacity" as string]: p.opacity,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* layer 3 — animated trend line (draw + traveling glow dot) */}
        <div
          className="parallax-layer absolute inset-0 z-10"
          style={{ transform: `translate3d(${tilt.x * 6}px, ${tilt.y * 5}px, 0)` }}
          aria-hidden
        >
          <svg className="size-full" viewBox="0 0 632 400" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="hv-stroke" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#19b887" stopOpacity="0.2" />
                <stop offset="0.55" stopColor="#2fd39d" />
                <stop offset="1" stopColor="#7df0c3" />
              </linearGradient>
              <linearGradient id="hv-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#19b887" stopOpacity="0.28" />
                <stop offset="1" stopColor="#19b887" stopOpacity="0" />
              </linearGradient>
              <filter id="hv-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={CHART_AREA} fill="url(#hv-area)" className="hv-area-in" />
            <path
              d={CHART_PATH}
              stroke="url(#hv-stroke)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.5"
              filter="url(#hv-glow)"
              className="hv-line-draw"
            />
            <path
              d={CHART_PATH}
              stroke="url(#hv-stroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="hv-line-draw"
            />
            <circle r="6" fill="#7df0c3" filter="url(#hv-glow)">
              <animateMotion dur="7s" repeatCount="indefinite" path={CHART_PATH} />
            </circle>
            <circle r="2.8" fill="#ffffff">
              <animateMotion dur="7s" repeatCount="indefinite" path={CHART_PATH} />
            </circle>
          </svg>
        </div>

        {/* layer 4 — cinematic grading (vignette + bottom blend) */}
        <div
          className="absolute inset-0 z-[12] shadow-[inset_0_0_130px_rgba(16,24,39,0.6)]"
          style={{
            background:
              "linear-gradient(to top, rgba(16,24,39,0.92), rgba(16,24,39,0.22) 34%, rgba(16,24,39,0.04) 58%, rgba(16,24,39,0.34))",
          }}
          aria-hidden
        />

        {/* layer 5 — light sweep */}
        <div className="light-sweep z-[15]" aria-hidden />

        {/* HUD corner brackets */}
        <span className="absolute right-3 top-3 z-20 size-6 rounded-tr-lg border-r-2 border-t-2 border-primary/60" aria-hidden />
        <span className="absolute left-3 top-3 z-20 size-6 rounded-tl-lg border-l-2 border-t-2 border-primary/60" aria-hidden />

        {/* floating badge — live market (top-start) */}
        <div
          className="parallax-layer absolute right-4 top-4 z-20 sm:right-5 sm:top-5"
          style={{ transform: `translate3d(${tilt.x * -16}px, ${tilt.y * -12}px, 0)` }}
        >
          <div className="float-card glass-strong rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="live-dot size-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-muted-foreground">بازار جهانی</span>
              <span dir="ltr" className="rounded bg-primary/15 px-1.5 py-0.5 font-black text-[9px] tracking-widest text-primary">
                LIVE
              </span>
            </div>
            <p
              key={`${head.sym}-${head.price.toFixed(head.dec)}`}
              dir="ltr"
              className={cn(
                "price-flash mt-1.5 text-right text-xl font-black tabular-nums",
                head.up ? "text-primary" : "text-destructive"
              )}
            >
              {faNum(head.price, head.dec)}
            </p>
            <p dir="ltr" className="mt-0.5 text-right text-[10px] font-semibold text-muted-foreground">
              {head.sym} · GOLD
            </p>
          </div>
        </div>

        {/* floating badge — win rate (bottom-end, above ticker) */}
        <div
          className="parallax-layer absolute bottom-16 right-4 z-20 hidden sm:block"
          style={{ transform: `translate3d(${tilt.x * -12}px, ${tilt.y * -9}px, 0)` }}
        >
          <div className="float-card-2 glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Target className="size-4.5" />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] text-muted-foreground">نرخ موفقیت سیگنال‌ها</p>
              <p className="text-sm font-black text-primary">+{faNum(84)}٪</p>
            </div>
          </div>
        </div>

        {/* floating badge — student profit (mid-end) */}
        <div
          className="parallax-layer absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 md:block"
          style={{ transform: `translate3d(${tilt.x * -14}px, calc(${tilt.y * -10}px - 50%), 0)` }}
        >
          <div className="float-card glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ animationDelay: "-3s" }}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-400">
              <Wallet className="size-4.5" />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] text-muted-foreground">سود ثبت‌شده دانشجویان</p>
              <p className="text-sm font-black text-sky-300">+{faNum(2480)}$</p>
            </div>
          </div>
        </div>

        {/* layer 6 — live mini ticker (bottom) */}
        <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-4 sm:bottom-4">
          <div className="glass-strong flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5" dir="ltr">
            {ticks.map((t, i) => (
              <div key={t.sym} className={cn("flex min-w-0 items-center gap-2", i > 0 && "hidden sm:flex")}>
                <span className="text-[11px] font-black tracking-wide">{t.sym}</span>
                <span
                  key={t.price.toFixed(t.dec)}
                  className={cn(
                    "price-flash text-[11px] font-bold tabular-nums",
                    t.up ? "text-primary" : "text-destructive"
                  )}
                >
                  {faNum(t.price, t.dec)}
                </span>
                <span
                  className={cn(
                    "rounded px-1 py-0.5 text-[9px] font-black tabular-nums",
                    t.up ? "bg-primary/12 text-primary" : "bg-destructive/12 text-destructive"
                  )}
                >
                  {t.up ? "▲" : "▼"}
                </span>
              </div>
            ))}
            <span className="hidden shrink-0 items-center gap-1.5 text-[9px] font-bold text-muted-foreground md:flex" dir="rtl">
              <span className="live-dot size-1.5 rounded-full bg-primary" />
              داده‌های لحظه‌ای
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
