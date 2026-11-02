"use client";

/* ============================================================
   Hero backdrop + Gold live card
   - HeroBackdrop: تصویر سینمایی تمام‌صفحه + ken burns + ذرات + نور جاروب
   - GoldLiveCard: قاب شیشه‌ای لایو «طلای جهانی» با اسپارک‌لاین زنده
============================================================ */

import { useEffect, useState } from "react";
import { faNum } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

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
  return Array.from({ length: 30 }, () => ({
    x: rnd() * 100,
    size: 2 + rnd() * 5,
    delay: -rnd() * 18,
    dur: 10 + rnd() * 12,
    drift: (rnd() - 0.5) * 70,
    opacity: 0.3 + rnd() * 0.55,
    gold: rnd() < 0.22,
  }));
})();

/* ============================================================
   HeroBackdrop — لایه پس‌زمینه تمام‌صفحه هیرو
============================================================ */
export function HeroBackdrop() {
  return (
    <div className="absolute inset-0" aria-hidden>
      {/* cinematic image — slow ken burns */}
      <img
        src="/images/hero-motion.png"
        alt=""
        draggable={false}
        fetchPriority="high"
        className="hero-visual-img size-full select-none object-cover"
      />

      {/* scrims — deep behind copy (right/RTL), image visible toward left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to left, rgba(16,24,39,0.94) 0%, rgba(16,24,39,0.82) 34%, rgba(16,24,39,0.38) 62%, rgba(16,24,39,0.18) 100%)",
        }}
      />
      {/* top/bottom blend into page background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, #101827 0%, rgba(16,24,39,0.45) 16%, rgba(16,24,39,0.06) 46%, rgba(16,24,39,0.38) 88%, rgba(16,24,39,0.7) 100%)",
        }}
      />

      {/* rising particles */}
      <div className="absolute inset-0 overflow-hidden">
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

      {/* diagonal light sweep */}
      <div className="light-sweep" />

      {/* hairline glow above ticker */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
    </div>
  );
}

/* ============================================================
   GoldLiveCard — قاب کوچک لایو «طلای جهانی»
============================================================ */

function seededGoldSeries(n: number): number[] {
  const rnd = mulberry32(1403);
  const out: number[] = [];
  let v = 2331 + rnd() * 6;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.44) * 4.2;
    out.push(v);
  }
  // gently steer the tail toward a natural level
  const target = 2348.5;
  const last = out[n - 1];
  const shift = target - last;
  return out.map((x, i) => x + (shift * i) / (n - 1));
}

const SPARK_W = 300;
const SPARK_H = 72;

export function GoldLiveCard({ className }: { className?: string }) {
  const [hist, setHist] = useState<number[]>(() => seededGoldSeries(34));
  const [up, setUp] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setHist((h) => {
        const drift = (Math.random() - 0.47) * 3.4;
        const np = h[h.length - 1] + drift;
        setUp(drift >= 0);
        return [...h.slice(1), np];
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const price = hist[hist.length - 1];
  const open = hist[0];
  const chgPct = ((price - open) / open) * 100;
  const rising = chgPct >= 0;
  const hi = Math.max(...hist);
  const lo = Math.min(...hist);
  const spread = 0.7;
  const buy = price + spread / 2;
  const sell = price - spread / 2;

  /* sparkline geometry */
  const min = Math.min(...hist);
  const max = Math.max(...hist);
  const span = max - min || 1;
  const pts = hist.map(
    (v, i) =>
      [
        (i / (hist.length - 1)) * SPARK_W,
        SPARK_H - 8 - ((v - min) / span) * (SPARK_H - 18),
      ] as const
  );
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`;

  return (
    <div className={cn("glass-strong glow-gold relative w-full rounded-3xl p-5", className)}>
      {/* soft gold aura */}
      <div className="absolute -inset-6 rounded-[2.25rem] bg-amber-400/10 blur-2xl" aria-hidden />

      {/* header */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-[11px] font-black text-[#3a2a04] shadow-[0_0_18px_-2px_rgba(245,181,68,0.65)]">
            Au
            <span className="absolute -bottom-0.5 -left-0.5 size-3 rounded-full border-2 border-[#141f32] bg-primary" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-black">طلای جهانی</p>
            <p className="text-[10px] text-muted-foreground">اونس طلا · بازار اسپات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span dir="ltr" className="rounded-md border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-300">
            XAUUSD
          </span>
          <span className="live-dot size-2 rounded-full bg-amber-400" />
        </div>
      </div>

      {/* price */}
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <p
          key={price.toFixed(2)}
          className={cn(
            "price-flash text-[2rem] font-black leading-none tabular-nums",
            up ? "text-amber-300" : "text-amber-300/80"
          )}
        >
          {faNum(price, 2)}
        </p>
        <span
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black tabular-nums",
            rising ? "bg-primary/12 text-primary" : "bg-destructive/12 text-destructive"
          )}
        >
          {rising ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {faNum(Math.abs(chgPct), 2)}٪
        </span>
      </div>

      {/* sparkline */}
      <div className="relative mt-3 overflow-hidden rounded-xl border border-border/50 bg-[#0d1522]/60 p-1.5">
        <svg
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          className="block h-16 w-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="gold-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f5b544" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#fcd34d" />
              <stop offset="1" stopColor="#ffe9a8" />
            </linearGradient>
            <linearGradient id="gold-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f5b544" stopOpacity="0.3" />
              <stop offset="1" stopColor="#f5b544" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#gold-area)" />
          <path d={line} stroke="url(#gold-stroke)" strokeWidth="2" strokeLinecap="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.2" fill="#ffe9a8">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* session stats */}
      <div className="relative mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { l: "باز امروز", v: faNum(hist[0], 1) },
          { l: "بیشترین", v: faNum(hi, 1) },
          { l: "کمترین", v: faNum(lo, 1) },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border/50 bg-card/40 px-1 py-2">
            <p className="text-[9px] text-muted-foreground">{s.l}</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-foreground/90">{s.v}</p>
          </div>
        ))}
      </div>

      {/* buy / sell */}
      <div className="relative mt-3 grid grid-cols-2 gap-2" dir="ltr">
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-center transition-colors hover:bg-primary/15">
          <p className="text-[9px] font-bold text-primary/80">BUY · خرید</p>
          <p className="text-sm font-black tabular-nums text-primary">{faNum(buy, 2)}</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center transition-colors hover:bg-destructive/15">
          <p className="text-[9px] font-bold text-destructive/80">SELL · فروش</p>
          <p className="text-sm font-black tabular-nums text-destructive">{faNum(sell, 2)}</p>
        </div>
      </div>

      {/* live caption */}
      <p className="relative mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="live-dot size-1.5 rounded-full bg-amber-400" />
        قیمت لحظه‌ای — به‌روزرسانی خودکار هر ثانیه
      </p>
    </div>
  );
}
