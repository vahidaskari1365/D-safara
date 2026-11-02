"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api";
import { faNum, faPercent, faToman, toFa } from "@/lib/fa";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

/* ---------- data hook ---------- */

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.resolve(url ? apiGet<T>(url) : Promise.resolve(null))
      .then((d) => {
        if (!alive) return;
        setData(d as T | null);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError((e as Error).message);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url, key]);
  const refetch = () => setKey((k) => k + 1);
  return { data, loading, error, refetch };
}

/* ---------- scroll reveal ---------- */

export function Reveal({
  children, delay = 0, className, as: Tag = "div",
}: {
  children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/* ---------- animated counter ---------- */

export function Counter({
  value, suffix = "", prefix = "", duration = 1500, className, decimals = 0,
}: {
  value: number; suffix?: string; prefix?: string; duration?: number; className?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min((t - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {faNum(display, decimals)}
      {suffix}
    </span>
  );
}

/* ---------- tiny building blocks ---------- */

const KICKER_TONES = {
  emerald: "border-primary/25 bg-primary/10 text-primary",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
} as const;

export type KickerTone = keyof typeof KICKER_TONES;

export function SectionHead({
  kicker, title, desc, center, tone = "emerald",
}: { kicker?: string; title: string; desc?: string; center?: boolean; tone?: KickerTone }) {
  return (
    <Reveal className={cn("mb-10 space-y-3", center && "text-center")}>
      {kicker && (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide",
            KICKER_TONES[tone],
            center && (tone === "emerald" ? "kicker-line" : `kicker-${tone}`)
          )}
        >
          {kicker}
        </span>
      )}
      <h2 className="text-[1.75rem] font-extrabold leading-[1.35] md:text-4xl md:leading-[1.3]">
        {title}
      </h2>
      {center && (
        <span
          aria-hidden
          className="mx-auto block h-px w-28 bg-gradient-to-l from-transparent via-primary/80 to-transparent"
        />
      )}
      {desc && (
        <p className={cn("max-w-2xl text-sm leading-8 text-muted-foreground md:text-base", center && "mx-auto")}>
          {desc}
        </p>
      )}
    </Reveal>
  );
}

export function StatCard({
  title, value, sub, icon, trend, accent,
}: {
  title: string; value: string; sub?: string; icon?: React.ReactNode;
  trend?: number; accent?: string;
}) {
  return (
    <Card className="card-hover border-border bg-card">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-extrabold tracking-tight", accent || "text-foreground")}>{value}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {typeof trend === "number" && (
              <span className={cn("flex items-center gap-0.5 font-medium", trend >= 0 ? "text-primary" : "text-destructive")}>
                {trend >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {faPercent(Math.abs(trend))}
              </span>
            )}
            {sub}
          </div>
        </div>
        {icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  PAID: "bg-primary/15 text-primary border-primary/30",
  COMPLETED: "bg-primary/15 text-primary border-primary/30",
  ACCEPTED: "bg-primary/15 text-primary border-primary/30",
  REVIEWED: "bg-primary/15 text-primary border-primary/30",
  GRADED: "bg-primary/15 text-primary border-primary/30",
  SCHEDULED: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  ACTIVE: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  SUBMITTED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  OPEN: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  FAILED: "bg-destructive/15 text-destructive border-destructive/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  CLOSED: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  WIN: "bg-primary/15 text-primary border-primary/30",
  LOSS: "bg-destructive/15 text-destructive border-destructive/30",
  BREAKEVEN: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  REVISION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ANSWERED: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  INACTIVE: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge variant="outline" className={cn("border px-2.5 py-0.5 text-[11px] font-medium", statusColors[status] || "bg-muted text-muted-foreground border-border")}>
      {label || status}
    </Badge>
  );
}

export function PnlText({ value, suffix = "" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span className={cn("font-bold tabular-nums", positive ? "text-primary" : "text-destructive")}>
      {positive ? "+" : "−"}{faNum(Math.abs(value))}{suffix}
    </span>
  );
}

export function RatingStars({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn("size-3.5", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
        ))}
      </div>
      {showValue && <span className="text-xs font-medium text-muted-foreground">{faNum(rating, 1)}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon?: React.ReactNode; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <p className="font-semibold">{title}</p>
      {desc && <p className="max-w-sm text-sm leading-6 text-muted-foreground">{desc}</p>}
      {action}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

export function GridSkeleton({ cols = 3, count = 6 }: { cols?: number; count?: number }) {
  return (
    <div className={cn("grid gap-5", cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-56 w-full rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    BEGINNER: { label: "مقدماتی", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
    INTERMEDIATE: { label: "متوسط", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    ADVANCED: { label: "پیشرفته", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const m = map[level] || { label: level, cls: "bg-muted text-muted-foreground border-border" };
  return <Badge variant="outline" className={cn("border text-[11px]", m.cls)}>{m.label}</Badge>;
}

export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("font-bold", className)}>
      {amount === 0 ? <span className="text-primary">رایگان</span> : faToman(amount)}
    </span>
  );
}

/* ---------- chart wrappers (RTL friendly) ---------- */

const tooltipStyle = {
  background: "#1a2a44",
  border: "1px solid rgba(139,160,189,0.25)",
  borderRadius: 12,
  fontSize: 12,
  direction: "rtl" as const,
};

const chartColors = ["#19b887", "#38bdf8", "#f5b544", "#a78bfa", "#ef5466", "#f97316"];

export function RevenueAreaChart({ data, dataKey = "value", color = "#19b887", height = 260 }: {
  data: Record<string, unknown>[]; dataKey?: string; color?: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,160,189,0.12)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} reversed />
        <YAxis tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} orientation="right" tickFormatter={(v) => faNum(Number(v))} width={70} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [faNum(Number(v)), "مبلغ"]} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#grad-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TradesBarChart({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,160,189,0.12)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} reversed />
        <YAxis tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} orientation="right" tickFormatter={(v) => faNum(Number(v))} width={60} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [faNum(Number(v)), "تعداد"]} cursor={{ fill: "rgba(25,184,135,0.08)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#19b887" maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PnlBarChart({ data, height = 240 }: { data: { label: string; pnl: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,160,189,0.12)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} reversed />
        <YAxis tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} orientation="right" width={70} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${faNum(Number(v))} دلار`, "سود/ضرر"]} cursor={{ fill: "rgba(25,184,135,0.08)" }} />
        <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={26}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pnl >= 0 ? "#19b887" : "#ef5466"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleDonut({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={chartColors[i % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [faNum(Number(v)), String(n)]} />
        <Legend formatter={(v) => <span style={{ color: "#8ba0bd", fontSize: 12 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data, height = 240, color = "#38bdf8" }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,160,189,0.12)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} reversed />
        <YAxis tick={{ fill: "#8ba0bd", fontSize: 11 }} axisLine={false} tickLine={false} orientation="right" width={60} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [faNum(Number(v)), ""]} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export { faNum, faToman, faPercent, toFa };
