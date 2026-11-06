"use client";

/* ============================================================
   Hero backdrop + Gold live card
   - HeroBackdrop: تصویر سینمایی تمام‌صفحه + ken burns + ذرات + نور جاروب
   - GoldLiveCard: قاب شیشه‌ای لایو «طلای جهانی» با اسپارک‌لاین زنده
============================================================ */

import { cn } from "@/lib/utils";

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
        src="/images/hero-cinematic.png"
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

export function GoldLiveCard({ className }: { className?: string }) {
  const params = new URLSearchParams({ symbol: "OANDA:XAUUSD", interval: "60", theme: "dark", style: "3", locale: "en", timezone: "Etc/UTC", hide_side_toolbar: "1", hide_top_toolbar: "1", save_image: "0" });
  return (
    <div className={cn("hero-market-card relative w-full overflow-hidden rounded-3xl p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-400/15 font-black text-amber-300">Au</span>
          <div><p className="font-bold">طلای جهانی</p><p className="mt-1 text-xs text-muted-foreground">نگاهی به بازار جهانی</p></div>
        </div>
        <span dir="ltr" className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">XAU / USD</span>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#0b111b]" dir="ltr">
        <iframe title="نمودار طلای جهانی از TradingView" src={`https://s.tradingview.com/widgetembed/?${params}`} className="h-[250px] w-full border-0" loading="lazy" />
      </div>
      <p className="mt-3 text-[10px] leading-5 text-muted-foreground">منبع: TradingView · داده‌ها ممکن است با تأخیر نمایش داده شوند.</p>
    </div>
  );
}
