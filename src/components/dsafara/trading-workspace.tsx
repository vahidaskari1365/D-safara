"use client";

import { useState } from "react";
import { toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import { CandlestickChart, Check, ClipboardCheck, Pencil, Save, TrendingUp } from "lucide-react";
import { EmptyState, ListSkeleton, StatusBadge } from "./shared";

const SYMBOLS = ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD", "US30"];
const TIMEFRAMES = ["15M", "1H", "4H", "1D"];

const CHECKLIST_ITEMS = [
  "ساختار تایم بالاتر را مشخص کردم",
  "نواحی کلیدی عرضه/تقاضا مارک شد",
  "نقطه ورود، حد ضرر و هدف تعیین شد",
  "R:R حداقل ۱ به ۲ است",
  "خبر مهم امروز (قرمز) نداریم",
  "ریسک این معامله حداکثر ۱٪ حساب است",
];

/* ---------- chart component ---------- */

const MARKET_SYMBOLS: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD", EURUSD: "OANDA:EURUSD", GBPUSD: "OANDA:GBPUSD",
  BTCUSD: "COINBASE:BTCUSD", US30: "CAPITALCOM:US30",
};
const MARKET_INTERVALS: Record<string, string> = { "15M": "15", "1H": "60", "4H": "240", "1D": "D" };

function TradingChart({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const params = new URLSearchParams({
    symbol: MARKET_SYMBOLS[symbol], interval: MARKET_INTERVALS[timeframe], theme: "dark",
    style: "1", locale: "en", timezone: "Etc/UTC", hide_side_toolbar: "0",
    allow_symbol_change: "0", hide_top_toolbar: "1", save_image: "0", hideideas: "1",
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
        <span className="flex items-center gap-2 font-bold"><CandlestickChart className="size-4 text-primary" /> نمودار بازار · {symbol}</span>
        <span className="text-xs text-muted-foreground">داده‌ها از TradingView؛ تأخیر احتمالی بسته به بازار</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-[#0b111b]" dir="ltr">
        <iframe title={`نمودار ${symbol} در TradingView`} src={`https://s.tradingview.com/widgetembed/?${params}`} className="h-[520px] w-full border-0" allowFullScreen />
      </div>
      <p className="text-xs leading-6 text-muted-foreground">برای رسم ابزارهای گن، از نوار ابزار سمت چپ نمودار گزینه Gann and Fibonacci Tools را انتخاب کنید. نمایش نمودار به اتصال به TradingView وابسته است؛ ابزارها و تأخیر داده‌ها تابع شرایط آن سرویس هستند.</p>
    </div>
  );
}

/* ---------- main workspace ---------- */

type Exercise = {
  id: string; symbol: string; timeframe: string; taskTitle: string; description?: string | null;
  analysis?: string | null; checklist?: string | null; status: string;
  mentorScore?: number | null; mentorFeedback?: string | null; createdAt: string;
  reviewComments?: { id: string; body: string; user?: { name: string } }[];
};

export function TradingWorkspace({ exercises, loading, onRefresh }: {
  exercises: Exercise[]; loading: boolean; onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("1H");
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(false));
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ taskTitle: "", description: "" });

  const submitExercise = async () => {
    if (!form.taskTitle.trim()) {
      toast({ title: "خطا", description: "عنوان تمرین را وارد کنید.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/student", {
        action: "add-exercise",
        symbol, timeframe,
        taskTitle: form.taskTitle,
        description: form.description,
        analysis: notes,
        checklist: CHECKLIST_ITEMS.map((label, i) => ({ label, done: checked[i] })),
        snapshot: { symbol, timeframe, note: "نماد و تایم‌فریم انتخاب‌شده؛ تصویر چارت ذخیره نشده است" },
      });
      toast({ title: "تمرین ثبت شد ✅", description: "منتور شما به‌زودی آن را بررسی می‌کند." });
      setDialogOpen(false);
      setForm({ taskTitle: "", description: "" });
      setNotes("");
      setChecked(Array(CHECKLIST_ITEMS.length).fill(false));
      onRefresh();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const doneCount = checked.filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SYMBOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex rounded-xl border border-border p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", timeframe === tf ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Save className="size-4" /> ثبت تمرین جدید</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg border-border bg-card">
            <DialogHeader>
              <DialogTitle>ثبت تمرین تحلیلی</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/60 p-3">نماد: <b>{symbol}</b></div>
                <div className="rounded-xl bg-muted/60 p-3">تایم‌فریم: <b>{timeframe}</b></div>
              </div>
              <div className="space-y-2">
                <Label>عنوان تمرین *</Label>
                <Input value={form.taskTitle} onChange={(e) => setForm((f) => ({ ...f, taskTitle: e.target.value }))} placeholder="مثلاً مارک‌آپ نواحی کلیدی و سناریوی هفته" />
              </div>
              <div className="space-y-2">
                <Label>توضیح تمرین</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>تحلیل / سناریوی شما (پیوست به تمرین)</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="سناریوی اصلی و جایگزین را توضیح دهید..." />
              </div>
              <Button className="w-full glow-accent" onClick={submitExercise} disabled={saving}>
                {saving ? "در حال ارسال..." : "ثبت و ارسال برای منتور"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        {/* chart + notes */}
        <div className="space-y-5 xl:col-span-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <TradingChart symbol={symbol} timeframe={timeframe} />
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-bold"><Pencil className="size-4 text-primary" /> یادداشت تحلیل شخصی</p>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="سناریو، نکات و نتیجه‌گیری تحلیل خود را اینجا بنویسید..." />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>یادداشت‌ها فقط برای خودتان و منتورتان قابل مشاهده است.</span>
                <span>تصویر چارت همراه تمرین ذخیره نمی‌شود.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* checklist sidebar */}
        <div className="space-y-5">
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="flex items-center justify-between text-sm font-bold">
                <span className="flex items-center gap-2"><ClipboardCheck className="size-4 text-primary" /> چک‌لیست قبل از معامله</span>
                <span className={cn("text-xs", doneCount === CHECKLIST_ITEMS.length ? "text-primary" : "text-muted-foreground")}>
                  {toFa(doneCount)}/{toFa(CHECKLIST_ITEMS.length)}
                </span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%` }} />
              </div>
              <div className="space-y-2.5">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <label key={item} className="flex cursor-pointer items-start gap-2.5 text-xs leading-6">
                    <Checkbox
                      checked={checked[i]}
                      onCheckedChange={(v) => setChecked((c) => c.map((x, j) => (j === i ? !!v : x)))}
                      className="mt-0.5"
                    />
                    <span className={checked[i] ? "text-muted-foreground line-through" : ""}>{item}</span>
                  </label>
                ))}
              </div>
              {doneCount === CHECKLIST_ITEMS.length && (
                <p className="rounded-xl bg-primary/10 p-3 text-center text-xs font-medium text-primary">
                  ✅ همه موارد چک شد — تمرین آماده ثبت است!
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="size-4 text-primary" /> تمرین‌های من</p>
              {loading ? <ListSkeleton rows={3} /> : exercises.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">هنوز تمرینی ثبت نکرده‌اید.</p>
              ) : (
                <div className="max-h-72 space-y-2.5 overflow-y-auto pl-1">
                  {exercises.slice(0, 8).map((ex) => (
                    <div key={ex.id} className="space-y-1.5 rounded-xl bg-muted/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold">{ex.taskTitle}</p>
                        <StatusBadge status={ex.status} label={ex.status === "PENDING" ? "در انتظار بررسی" : ex.status === "REVIEWED" ? "بررسی شده" : "بازنگری"} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{ex.symbol} · {ex.timeframe}</span>
                        {ex.mentorScore != null && <span className="font-bold text-primary">نمره: {toFa(ex.mentorScore)}</span>}
                      </div>
                      {ex.mentorFeedback && <p className="text-[11px] leading-5 text-muted-foreground">💬 {ex.mentorFeedback}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { EmptyState, Check };
