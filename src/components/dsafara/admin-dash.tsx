"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { faAgo, faCompact, faDate, faDateTime, faNum, faToman, faStatus, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Award, BarChart3, BookOpen, Briefcase, CandlestickChart, ClipboardCheck, CreditCard, FileText,
  Globe, LayoutDashboard, ListTodo, LogOut, MessageSquare, Newspaper, Percent, Receipt, Settings,
  ShieldCheck, ShoppingBag, Star, Users, Wallet, Megaphone, Landmark,
} from "lucide-react";
import {
  EmptyState, GridSkeleton, ListSkeleton, PnlText, RatingStars, RevenueAreaChart, SectionHead,
  SimpleDonut, StatCard, StatusBadge, TradesBarChart, TrendLineChart, useFetch,
} from "./shared";
import { Logo } from "./public-shell";

/* ================= shell ================= */

const adminNav = [
  { key: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { key: "users", label: "کاربران", icon: Users },
  { key: "courses", label: "مدیریت دوره‌ها", icon: BookOpen },
  { key: "orders", label: "سفارش‌ها و فروش", icon: ShoppingBag },
  { key: "finance", label: "مدیریت مالی", icon: Landmark },
  { key: "mentors", label: "منتورها و کمیسیون", icon: Star },
  { key: "assignments", label: "ارزیابی تمرین‌ها", icon: ClipboardCheck },
  { key: "exercises", label: "بررسی تمرین معاملاتی", icon: CandlestickChart },
  { key: "sessions", label: "مدیریت جلسات", icon: Receipt },
  { key: "support", label: "پشتیبانی", icon: MessageSquare },
  { key: "recruitment", label: "استخدام", icon: Briefcase },
  { key: "cms", label: "مدیریت محتوا (CMS)", icon: Newspaper },
  { key: "marketing", label: "بازاریابی", icon: Megaphone },
  { key: "audit", label: "گزارش فعالیت‌ها", icon: ShieldCheck },
  { key: "settings", label: "تنظیمات سیستم", icon: Settings },
];

export function AdminApp() {
  const { adminPage, adminParam, goAdmin, goPublic, setUser, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell dashboard-admin flex min-h-screen">
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-border bg-sidebar transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <Logo small showText />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="بستن">✕</Button>
        </div>
        <ScrollArea className="flex-1 p-3">
          <nav className="space-y-1" aria-label="منوی مدیریت">
            <p className="dashboard-nav-label">مدیریت آکادمی</p>
            {adminNav.map((n) => (
              <button
                key={n.key}
                onClick={() => { goAdmin(n.key); setSidebarOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  adminPage === n.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <n.icon className="size-4.5 shrink-0" /> {n.label}
              </button>
            ))}
            <div className="my-2 border-t border-border" />
            <button onClick={() => goPublic("home")} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-card">
              <Globe className="size-4.5" /> وب‌سایت عمومی
            </button>
            <button onClick={async () => { await apiPost("/api/auth", { action: "logout" }); setUser(null); goPublic("home"); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive/80 hover:bg-destructive/10">
              <LogOut className="size-4.5" /> خروج
            </button>
          </nav>
        </ScrollArea>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="منو"><ListTodo className="size-5" /></Button>
            <p className="font-bold">{adminNav.find((n) => n.key === adminPage)?.label}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground md:block">{user?.name}</span>
            <Avatar className="size-9 ring-2 ring-destructive/40"><AvatarFallback className="bg-destructive/15 font-bold text-destructive">{user?.name?.charAt(0)}</AvatarFallback></Avatar>
          </div>
        </header>
        <main className="p-4 pb-16 md:p-6">
          <AdminView page={adminPage} param={adminParam} />
        </main>
      </div>
    </div>
  );
}

function AdminView({ page, param }: { page: string; param: string }) {
  switch (page) {
    case "overview": return <AdminOverview />;
    case "users": return <UsersView />;
    case "student": return <StudentDetail id={param} />;
    case "courses": return <CoursesAdmin />;
    case "orders": return <OrdersAdmin />;
    case "finance": return <FinanceAdmin />;
    case "mentors": return <MentorsAdmin />;
    case "assignments": return <AssignmentsAdmin />;
    case "exercises": return <ExercisesAdmin />;
    case "sessions": return <SessionsAdmin />;
    case "support": return <SupportAdmin />;
    case "recruitment": return <RecruitmentAdmin />;
    case "cms": return <CmsAdmin />;
    case "marketing": return <MarketingAdmin />;
    case "audit": return <AuditAdmin />;
    case "settings": return <SettingsAdmin />;
    default: return <AdminOverview />;
  }
}

/* ================= overview ================= */

type OverviewData = {
  stats: { totalUsers: number; totalStudents: number; totalMentors: number; revenue: number; monthRevenue: number; totalOrders: number; openTickets: number; pendingApplications: number; totalEnrollments: number; totalTrades: number };
  revenueByMonth: { month: string; revenue: number }[];
  recentOrders: { id: string; orderNo: string; totalAmount: number; status: string; paidAt?: string | null; user: { name: string } }[];
  coursePerf: { id: string; title: string; students: number; price: number; rating: number; category?: string }[];
  tickets: { id: string; subject: string; status: string; createdAt: string; user: { name: string } }[];
  commissions: { id: string; amount: number; status: string; mentor: { name: string } }[];
};

function AdminOverview() {
  const { data, loading, error, refetch } = useFetch<OverviewData>("/api/admin?view=overview");
  const goAdmin = useApp((s) => s.goAdmin);
  const [period, setPeriod] = useState<3 | 6>(6);
  if (loading) return <GridSkeleton cols={2} count={4} />;
  if (error || !data) return <div className="rounded-xl border border-border p-6"><p>دریافت گزارش مدیریت ممکن نشد.</p><Button variant="outline" className="mt-4" onClick={refetch}>تلاش دوباره</Button></div>;
  const s = data.stats;

  return (
    <div className="space-y-6">
      <div className="dashboard-title-row"><div><p className="dashboard-eyebrow">داشبورد / مدیریت آکادمی</p><h1 className="mt-2 text-2xl font-black md:text-3xl">مرکز فرماندهی آکادمی</h1><p className="mt-2 text-sm text-muted-foreground">عملکرد فروش، کاربران و فعالیت‌های آکادمی در یک نگاه</p></div><span className="dashboard-pill"><span className="dashboard-status-dot" /> اطلاعات ثبت‌شده در سیستم</span></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="درآمد کل" value={faCompact(s.revenue) + " تومان"} accent="text-primary" icon={<Landmark className="size-5" />} sub="مجموع سفارش‌های موفق" />
        <StatCard title="درآمد این ماه" value={faToman(s.monthRevenue)} icon={<CreditCard className="size-5" />} sub={`${faNum(s.totalOrders)} سفارش موفق`} />
        <StatCard title="کاربران" value={faNum(s.totalUsers)} icon={<Users className="size-5" />} sub={`${faNum(s.totalStudents)} دانشجو • ${faNum(s.totalMentors)} منتور`} />
        <StatCard title="ثبت‌نام دوره‌ها" value={faNum(s.totalEnrollments)} icon={<BookOpen className="size-5" />} sub={`${faNum(s.totalTrades)} معامله ثبت‌شده`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ActionCard title="تیکت‌های باز" value={faNum(s.openTickets)} onClick={() => goAdmin("support")} icon={<MessageSquare className="size-5" />} />
        <ActionCard title="درخواست همکاری" value={faNum(s.pendingApplications)} onClick={() => goAdmin("recruitment")} icon={<Briefcase className="size-5" />} />
        <ActionCard title="کمیسیون پرداخت‌نشده" value={faToman(data.commissions.filter((c) => c.status === "PENDING").reduce((a, c) => a + c.amount, 0))} onClick={() => goAdmin("mentors")} icon={<Wallet className="size-5" />} />
        <ActionCard title="پرفروش‌ترین دوره" value={data.coursePerf[0] ? data.coursePerf[0].title : "دوره‌ای ثبت نشده"} onClick={() => goAdmin("courses")} icon={<Star className="size-5" />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="border-border bg-card xl:col-span-2">
          <CardContent className="space-y-3 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">روند درآمد</p><p className="mt-1 text-xs text-muted-foreground">سفارش‌های پرداخت‌شده · تومان</p></div><div className="flex gap-1 rounded-lg border border-white/10 p-1">{([3, 6] as const).map((n) => <button key={n} onClick={() => setPeriod(n)} className={cn("rounded-md px-3 py-1 text-xs", period === n ? "bg-primary/15 text-primary" : "text-muted-foreground")}>{faNum(n)} ماه</button>)}</div></div>
            {data.revenueByMonth.length ? <RevenueAreaChart color="#f2a65a" data={data.revenueByMonth.slice(-period).map((r) => ({ label: faMonthLabel(r.month), value: r.revenue }))} /> : <p className="py-20 text-center text-sm text-muted-foreground">هنوز سفارشی پرداخت نشده است.</p>}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">پرفروش‌ترین دوره‌ها</p>
            <div className="space-y-2.5">
              {data.coursePerf.slice(0, 5).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold", i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{toFa(i + 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{c.title}</p>
                    <div className="admin-course-meter mt-2"><span style={{ width: `${Math.max(0, Math.min(100, data.coursePerf[0]?.students ? c.students / data.coursePerf[0].students * 100 : 0))}%` }} /></div>
                  </div>
                  <span className="text-xs font-bold text-primary">{faNum(c.students)} <span className="font-normal text-muted-foreground">دانشجو</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-2">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <p className="font-bold">سفارش‌های اخیر</p>
              <Button variant="ghost" size="sm" onClick={() => goAdmin("orders")}>همه</Button>
            </div>
            <div className="space-y-2">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                  <div>
                    <p className="font-medium" dir="ltr">{toFa(o.orderNo)}</p>
                    <p className="text-xs text-muted-foreground">{o.user.name} • {faDate(o.paidAt || "")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{faToman(o.totalAmount)}</span>
                    <StatusBadge status={o.status} label={faStatus(o.status)} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">تیکت‌های اخیر</p>
            <div className="space-y-2">
              {data.tickets.map((t) => (
                <button key={t.id} onClick={() => goAdmin("support")} className="w-full rounded-xl bg-muted/40 p-3 text-right text-sm hover:bg-muted/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{t.subject}</span>
                    <StatusBadge status={t.status} label={faStatus(t.status)} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.user.name} • {faAgo(t.createdAt)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionCard({ title, value, onClick, icon }: { title: string; value: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full text-right">
      <Card className="card-hover h-full border-border bg-card">
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-lg font-extrabold">{value}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        </CardContent>
      </Card>
    </button>
  );
}

function faMonthLabel(key: string) {
  const months = ["ژانویه", "فوریه", "مارس", "آوریل", "می", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
  const m = Number(key.slice(5, 7)) - 1;
  return months[m] || key;
}

/* ================= users ================= */

type UserRow = {
  id: string; name: string; phone: string; role: string; isActive: boolean; createdAt: string;
  wallet?: { balance: number } | null;
  _count: { enrollments: number; orders: number; journalEntries: number };
};

function UsersView() {
  const { data, loading, refetch } = useFetch<{ users: UserRow[] }>(`/api/admin?view=users&q=${""}`);
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const goAdmin = useApp((s) => s.goAdmin);
  const [qApplied, setQApplied] = useState("");
  const { data: filtered, refetch: refetchFiltered } = useFetch<{ users: UserRow[] }>(qApplied ? `/api/admin?view=users&q=${encodeURIComponent(qApplied)}` : null);

  const update = async (id: string, patch: Record<string, unknown>) => {
    await apiPost("/api/admin", { action: "update-user", id, ...patch }).catch(() => null);
    toast({ title: "کاربر به‌روزرسانی شد ✅" });
    refetch(); refetchFiltered();
  };

  if (loading || !data) return <GridSkeleton />;
  const users = qApplied ? filtered?.users || [] : data.users;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Input placeholder="جستجو بر اساس نام یا شماره موبایل..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setQApplied(q)} />
        <Button onClick={() => setQApplied(q)}>جستجو</Button>
        {qApplied && <Button variant="ghost" onClick={() => { setQ(""); setQApplied(""); }}>پاک کردن</Button>}
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-muted-foreground">
                <th className="p-4 text-right font-medium">کاربر</th>
                <th className="p-4 text-right font-medium">نقش</th>
                <th className="p-4 text-right font-medium">دوره‌ها</th>
                <th className="p-4 text-right font-medium">سفارش‌ها</th>
                <th className="p-4 text-right font-medium">کیف پول</th>
                <th className="p-4 text-right font-medium">وضعیت</th>
                <th className="p-4 text-right font-medium">عضویت</th>
                <th className="p-4 text-right font-medium"></th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9"><AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{u.name?.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p dir="ltr" className="text-xs text-muted-foreground">{toFa(u.phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Select value={u.role} onValueChange={(v) => update(u.id, { role: v })}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">دانشجو</SelectItem>
                          <SelectItem value="MENTOR">منتور</SelectItem>
                          <SelectItem value="ADMIN">مدیر</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">{faNum(u._count.enrollments)}</td>
                    <td className="p-4">{faNum(u._count.orders)}</td>
                    <td className="p-4 text-xs">{faToman(u.wallet?.balance || 0)}</td>
                    <td className="p-4"><StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} label={u.isActive ? "فعال" : "غیرفعال"} /></td>
                    <td className="p-4 text-xs text-muted-foreground">{faDate(u.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        {u.role === "STUDENT" && <Button size="sm" variant="outline" onClick={() => goAdmin("student", u.id)}>پروفایل</Button>}
                        <Button size="sm" variant={u.isActive ? "destructive" : "default"} onClick={() => update(u.id, { isActive: !u.isActive })}>
                          {u.isActive ? "غیرفعال" : "فعال"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= student detail (admin) ================= */

function StudentDetail({ id }: { id: string }) {
  const goAdmin = useApp((s) => s.goAdmin);
  const { data, loading } = useFetch<{
    user: UserRow & {
      enrollments: { progress: number; course: { title: string } }[];
      orders: { orderNo: string; totalAmount: number; status: string; createdAt: string }[];
      journalEntries: { symbol: string; pnl: number; tradeDate: string }[];
      sessions: { title: string; startTime: string; mentor: { name: string } }[];
      wallet: { balance: number } | null;
      submissions: { id: string; status: string; score?: number | null; assignment: { title: string } }[];
      examAttempts: { score: number; maxScore: number; exam: { title: string } }[];
    };
  }>(id ? `/api/admin?view=student&id=${id}` : null);
  const { toast } = useToast();

  if (loading || !data) return <GridSkeleton />;
  const u = data.user;
  const tradesPnl = u.journalEntries.reduce((s, j) => s + j.pnl, 0);
  const wins = u.journalEntries.filter((j) => j.pnl > 0).length;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => goAdmin("users")} className="gap-1">› بازگشت به کاربران</Button>
      <Card className="border-border bg-card">
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="size-16 ring-2 ring-primary/40"><AvatarFallback className="bg-primary/15 text-xl font-extrabold text-primary">{u.name?.charAt(0)}</AvatarFallback></Avatar>
          <div className="flex-1">
            <p className="text-xl font-extrabold">{u.name}</p>
            <p dir="ltr" className="text-sm text-muted-foreground">{toFa(u.phone)}</p>
          </div>
          <div className="flex gap-6 text-center text-sm">
            <div><p className="font-extrabold text-primary">{faToman(u.wallet?.balance || 0)}</p><p className="text-xs text-muted-foreground">کیف پول</p></div>
            <div><p className="font-extrabold">{faNum(u._count.enrollments)}</p><p className="text-xs text-muted-foreground">دوره</p></div>
            <div><p className={cn("font-extrabold", tradesPnl >= 0 ? "text-primary" : "text-destructive")}>{tradesPnl >= 0 ? "+" : "−"}{faNum(Math.abs(tradesPnl))}$</p><p className="text-xs text-muted-foreground">سود/ضرر</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">دوره‌ها و پیشرفت</p>
            {u.enrollments.map((e) => (
              <div key={e.course.title} className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="truncate">{e.course.title}</span><span className="text-xs font-bold text-primary">{faNum(e.progress)}٪</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${e.progress}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">آمار معاملات</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{faNum(u.journalEntries.length)}</p><p className="text-[10px] text-muted-foreground">معامله</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold text-primary">{faNum(u.journalEntries.length ? Math.round((wins / u.journalEntries.length) * 100) : 0)}٪</p><p className="text-[10px] text-muted-foreground">وین‌ریت</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{faNum(u.submissions.length)}</p><p className="text-[10px] text-muted-foreground">تمرین ارسالی</p></div>
            </div>
            <div className="space-y-2 pt-2">
              {u.journalEntries.slice(0, 5).map((j) => (
                <div key={j.id + j.tradeDate} className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-sm">
                  <span className="font-bold">{j.symbol}</span>
                  <span className="text-xs text-muted-foreground">{faDate(j.tradeDate)}</span>
                  <PnlText value={j.pnl} suffix="$" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">سفارش‌ها</p>
            {u.orders.map((o) => (
              <div key={o.orderNo} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                <span dir="ltr" className="font-medium">{toFa(o.orderNo)}</span>
                <span className="text-xs text-muted-foreground">{faDate(o.createdAt)}</span>
                <div className="flex items-center gap-2"><span className="font-bold">{faToman(o.totalAmount)}</span><StatusBadge status={o.status} label={faStatus(o.status)} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">جلسات و آزمون‌ها</p>
            {u.sessions.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded-xl bg-muted/40 p-3.5 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">با {s.mentor.name} • {faDateTime(s.startTime)}</p>
              </div>
            ))}
            {u.examAttempts.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                <span className="truncate">{a.exam.title}</span>
                <span className={cn("text-xs font-bold", a.score / Math.max(a.maxScore, 1) >= 0.7 ? "text-primary" : "text-destructive")}>{toFa(a.score)}/{toFa(a.maxScore)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================= courses admin ================= */

type CourseRow = {
  id: string; title: string; slug: string; price: number; level: string; isPublished: boolean; rating: number;
  category?: { title: string } | null; mentor?: { name: string } | null;
  _count: { enrollments: number; chapters: number };
};

function CoursesAdmin() {
  const { data, loading, refetch } = useFetch<{ courses: CourseRow[]; categories: { id: string; title: string }[]; mentors: { id: string; name: string }[] }>("/api/admin?view=courses");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", level: "BEGINNER", categoryId: "", mentorId: "", durationHours: "10", isPublished: true });

  const create = async () => {
    setSaving(true);
    try {
      const res = await apiPost<{ message: string }>("/api/admin", { action: "create-course", ...form, price: Number(form.price) || 0 });
      toast({ title: "ساخته شد ✅", description: res.message });
      setOpen(false); refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const togglePublish = async (c: CourseRow) => {
    await apiPost("/api/admin", { action: "update-course", id: c.id, isPublished: !c.isPublished }).catch(() => null);
    toast({ title: c.isPublished ? "دوره غیرمنتشر شد" : "دوره منتشر شد" });
    refetch();
  };

  const del = async (c: CourseRow) => {
    await apiPost("/api/admin", { action: "delete-course", id: c.id }).catch(() => null);
    toast({ title: "دوره حذف شد", variant: "destructive" });
    refetch();
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg border-border bg-card">
            <DialogHeader><DialogTitle>ایجاد دوره جدید</DialogTitle></DialogHeader>
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto pl-2">
              <div className="space-y-2"><Label>عنوان دوره *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>توضیحات</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>قیمت (تومان)</Label><Input dir="ltr" className="text-left" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, "") }))} /></div>
                <div className="space-y-2"><Label>مدت (ساعت)</Label><Input dir="ltr" className="text-left" inputMode="numeric" value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value.replace(/[^0-9]/g, "") }))} /></div>
                <div className="space-y-2">
                  <Label>دسته‌بندی</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                    <SelectTrigger><SelectValue placeholder="انتخاب" /></SelectTrigger>
                    <SelectContent>{data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مدرس</Label>
                  <Select value={form.mentorId} onValueChange={(v) => setForm((f) => ({ ...f, mentorId: v }))}>
                    <SelectTrigger><SelectValue placeholder="انتخاب" /></SelectTrigger>
                    <SelectContent>{data.mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>سطح</Label>
                  <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="BEGINNER">مقدماتی</SelectItem><SelectItem value="INTERMEDIATE">متوسط</SelectItem><SelectItem value="ADVANCED">پیشرفته</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="glow-accent" onClick={create} disabled={saving || !form.title}>{saving ? "در حال ایجاد..." : "ایجاد دوره"}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button className="gap-1.5" onClick={() => setOpen(true)}>+ دوره جدید</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.courses.map((c) => (
          <Card key={c.id} className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.category?.title} • {c.mentor?.name || "بدون مدرس"}</p>
                </div>
                <StatusBadge status={c.isPublished ? "ACTIVE" : "INACTIVE"} label={c.isPublished ? "منتشر شده" : "پیش‌نویس"} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/50 p-2"><p className="font-bold">{faNum(c._count.enrollments)}</p><p className="text-[10px] text-muted-foreground">دانشجو</p></div>
                <div className="rounded-lg bg-muted/50 p-2"><p className="font-bold text-primary">{c.price === 0 ? "رایگان" : faCompact(c.price)}</p><p className="text-[10px] text-muted-foreground">قیمت</p></div>
                <div className="rounded-lg bg-muted/50 p-2"><p className="font-bold text-amber-400">★ {faNum(c.rating, 1)}</p><p className="text-[10px] text-muted-foreground">امتیاز</p></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => togglePublish(c)}>{c.isPublished ? "لغو انتشار" : "انتشار"}</Button>
                <Button size="sm" variant="destructive" onClick={() => del(c)}>حذف</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ================= orders admin ================= */

function OrdersAdmin() {
  const { data, loading, refetch } = useFetch<{ orders: { id: string; orderNo: string; totalAmount: number; status: string; refId?: string | null; createdAt: string; user: { name: string }; items: { title: string; price: number }[] }[] }>("/api/admin?view=orders");
  const { toast } = useToast();

  const setStatus = async (id: string, status: string) => {
    await apiPost("/api/admin", { action: "update-order", id, status }).catch(() => null);
    toast({ title: "وضعیت سفارش تغییر کرد ✅" });
    refetch();
  };

  if (loading || !data) return <ListSkeleton rows={6} />;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="p-4 text-right font-medium">سفارش</th>
              <th className="p-4 text-right font-medium">مشتری</th>
              <th className="p-4 text-right font-medium">اقلام</th>
              <th className="p-4 text-right font-medium">مبلغ</th>
              <th className="p-4 text-right font-medium">وضعیت</th>
              <th className="p-4 text-right font-medium">تاریخ</th>
              <th className="p-4 text-right font-medium">عملیات</th>
            </tr></thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="p-4 font-bold" dir="ltr">{toFa(o.orderNo)}</td>
                  <td className="p-4">{o.user.name}</td>
                  <td className="p-4 max-w-48 truncate text-xs text-muted-foreground">{o.items.map((i) => i.title).join("، ")}</td>
                  <td className="p-4 font-bold">{faToman(o.totalAmount)}</td>
                  <td className="p-4"><StatusBadge status={o.status} label={faStatus(o.status)} /></td>
                  <td className="p-4 text-xs text-muted-foreground">{faDate(o.createdAt)}</td>
                  <td className="p-4">
                    <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">در انتظار</SelectItem>
                        <SelectItem value="PAID">پرداخت شده</SelectItem>
                        <SelectItem value="FAILED">ناموفق</SelectItem>
                        <SelectItem value="REFUNDED">بازپرداخت</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= finance ================= */

function FinanceAdmin() {
  const { data, loading, refetch } = useFetch<{
    transactions: { id: string; type: string; amount: number; description: string; createdAt: string; user?: { name: string } | null }[];
    commissions: { id: string; amount: number; percent: number; status: string; mentor: { name: string }; createdAt: string }[];
    wallets: { balance: number; user: { name: string } }[];
    stats: { revenue: number; pendingCommissions: number; settledCommissions: number; walletTotal: number };
  }>("/api/admin?view=finance");
  const { toast } = useToast();

  const settle = async (id: string) => {
    await apiPost("/api/admin", { action: "settle-commission", id }).catch(() => null);
    toast({ title: "کمیسیون تسویه شد ✅" });
    refetch();
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="درآمد کل" value={faToman(data.stats.revenue)} accent="text-primary" icon={<Landmark className="size-5" />} />
        <StatCard title="کمیسیون پرداخت‌نشده" value={faToman(data.stats.pendingCommissions)} icon={<Wallet className="size-5" />} />
        <StatCard title="کمیسیون تسویه‌شده" value={faToman(data.stats.settledCommissions)} icon={<Receipt className="size-5" />} />
        <StatCard title="موجودی کل کیف پول‌ها" value={faToman(data.stats.walletTotal)} icon={<CreditCard className="size-5" />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">دفتر کل مالی — تراکنش‌ها</p>
            <div className="max-h-96 space-y-2 overflow-y-auto pl-1">
              {data.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.user?.name || "سیستم"} • {faAgo(t.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="border-border text-[10px]">{t.type}</Badge>
                    <PnlText value={t.amount} suffix=" ت" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">کمیسیون منتورها</p>
            <div className="max-h-96 space-y-2 overflow-y-auto pl-1">
              {data.commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                  <div>
                    <p className="font-medium">{c.mentor.name}</p>
                    <p className="text-xs text-muted-foreground">{faNum(c.percent)}٪ کمیسیون • {faDate(c.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{faToman(c.amount)}</span>
                    {c.status === "PENDING" ? (
                      <Button size="sm" onClick={() => settle(c.id)}>تسویه</Button>
                    ) : <StatusBadge status="SETTLED" label="تسویه شده" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================= mentors admin ================= */

function MentorsAdmin() {
  const { data, loading, refetch } = useFetch<{
    mentors: { id: string; name: string; bio?: string; coursesTaught: { title: string }[]; planMentorEnrollments: { plan: { title: string }; user?: { name: string | null } | null }[]; wallet?: { balance: number } | null }[];
    plans: { id: string; title: string; price: number; sessionsPerWeek: number }[];
    planRequests: { id: string; status: string; plan: { title: string }; mentor?: { name: string } | null; user?: { name?: string | null } | null; applicantName?: string; applicantPhone?: string; experience?: string; createdAt: string }[];
  }>("/api/admin?view=mentors");
  if (loading || !data) return <GridSkeleton />;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.mentors.map((m) => (
          <Card key={m.id} className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-12"><AvatarFallback className="bg-primary/15 font-bold text-primary">{m.name.charAt(0)}</AvatarFallback></Avatar>
                <div><p className="font-bold">{m.name}</p><p className="text-xs text-muted-foreground">کیف پول: {faToman(m.wallet?.balance || 0)}</p></div>
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{m.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {m.coursesTaught.map((c) => <span key={c.title} className="rounded-lg bg-muted px-2 py-0.5 text-[10px]">{c.title}</span>)}
              </div>
              <p className="text-xs text-muted-foreground">دانشجویان پلن: {faNum(m.planMentorEnrollments.length)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-6">
          <p className="font-bold">درخواست‌های پلن منتورینگ</p>
          {data.planRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
              <div>
                <p className="font-medium">{r.plan.title}</p>
                <p className="text-xs text-muted-foreground">منتور: {r.mentor?.name || "—"} • متقاضی: {r.user?.name || r.applicantName || "مهمان"} • {faAgo(r.createdAt)}</p>{r.applicantPhone && <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{toFa(r.applicantPhone)}</p>}{r.experience && <p className="mt-1 text-xs text-muted-foreground">{r.experience}</p>}
              </div>
              <StatusBadge status={r.status} label={faStatus(r.status)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= assignments & exercises review ================= */

function AssignmentsAdmin() {
  const { data, loading, refetch } = useFetch<{ submissions: { id: string; content: string; status: string; score?: number | null; feedback?: string | null; createdAt: string; user: { name: string }; assignment: { title: string; maxScore: number; course: { title: string } } }[] }>("/api/admin?view=assignments-review");
  const { toast } = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const sub = data?.submissions.find((s) => s.id === active);

  const grade = async (revision: boolean) => {
    if (!sub) return;
    await apiPost("/api/admin", { action: "grade-submission", id: sub.id, score: Number(score), feedback, revision }).catch(() => null);
    toast({ title: revision ? "بازنگری درخواست شد" : "نمره ثبت شد ✅" });
    setActive(null); refetch();
  };

  if (loading || !data) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      {data.submissions.map((s) => (
        <Card key={s.id} className="border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{s.assignment.title}</p>
                <p className="text-xs text-muted-foreground">{s.user.name} • {s.assignment.course.title} • {faAgo(s.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.status} label={faStatus(s.status)} />
                <Button size="sm" variant="outline" onClick={() => { setActive(s.id); setScore(String(s.score ?? "")); setFeedback(s.feedback ?? ""); }}>ارزیابی</Button>
              </div>
            </div>
            <p className="line-clamp-2 rounded-xl bg-muted/50 p-3.5 text-sm leading-6 text-muted-foreground">{s.content}</p>
            {s.feedback && <p className="text-xs text-primary">💬 {s.feedback}</p>}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader><DialogTitle>ارزیابی پاسخ</DialogTitle><DialogDescription>{sub?.user.name} — {sub?.assignment.title}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="max-h-48 overflow-y-auto rounded-xl bg-muted/50 p-4 text-sm leading-7">{sub?.content}</div>
            <div className="space-y-2"><Label>نمره (از {toFa(sub?.assignment.maxScore || 100)})</Label><Input dir="ltr" className="text-left" inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, ""))} /></div>
            <div className="space-y-2"><Label>بازخورد</Label><Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button className="flex-1 glow-accent" onClick={() => grade(false)} disabled={!score}>ثبت نمره</Button>
              <Button variant="outline" className="flex-1" onClick={() => grade(true)}>درخواست بازنگری</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExercisesAdmin() {
  const { data, loading, refetch } = useFetch<{ exercises: { id: string; symbol: string; timeframe: string; taskTitle: string; description?: string | null; analysis?: string | null; checklist?: string | null; status: string; mentorScore?: number | null; mentorFeedback?: string | null; createdAt: string; user: { name: string } }[] }>("/api/admin?view=exercises-review");
  const { toast } = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const ex = data?.exercises.find((e) => e.id === active);

  const review = async () => {
    if (!ex) return;
    await apiPost("/api/admin", { action: "review-exercise", id: ex.id, mentorScore: Number(score), mentorFeedback: feedback, status: "REVIEWED" }).catch(() => null);
    toast({ title: "بازخورد ارسال شد ✅" });
    setActive(null); refetch();
  };

  if (loading || !data) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      {data.exercises.map((e) => (
        <Card key={e.id} className="border-border bg-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-bold">{e.taskTitle}</p>
              <p className="text-xs text-muted-foreground">{e.user.name} • {e.symbol} {e.timeframe} • {faAgo(e.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={e.status} label={e.status === "PENDING" ? "در انتظار بررسی" : "بررسی شده"} />
              {e.mentorScore != null && <span className="text-xs font-bold text-primary">نمره {toFa(e.mentorScore)}</span>}
              <Button size="sm" variant="outline" onClick={() => { setActive(e.id); setScore(String(e.mentorScore ?? "")); setFeedback(e.mentorFeedback ?? ""); }}>
                {e.status === "PENDING" ? "بررسی" : "ویرایش بازخورد"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader><DialogTitle>بررسی تمرین معاملاتی</DialogTitle><DialogDescription>{ex?.user.name} — {ex?.symbol} {ex?.timeframe}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4 text-sm leading-7">
              <p className="mb-1 text-xs font-bold text-muted-foreground">تحلیل دانشجو:</p>
              {ex?.analysis || "—"}
            </div>
            {ex?.checklist && (
              <div className="rounded-xl bg-muted/50 p-4 text-xs leading-6">
                <p className="mb-1 font-bold text-muted-foreground">چک‌لیست:</p>
                {(JSON.parse(ex.checklist) as { label: string; done: boolean }[]).map((c, i) => (
                  <p key={i}>{c.done ? "✅" : "⬜"} {c.label}</p>
                ))}
              </div>
            )}
            <div className="space-y-2"><Label>نمره (۰ تا ۱۰۰)</Label><Input dir="ltr" className="text-left" inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, ""))} /></div>
            <div className="space-y-2"><Label>بازخورد منتور</Label><Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="نقاط قوت و اصلاحات لازم را بنویسید..." /></div>
            <Button className="w-full glow-accent" onClick={review} disabled={!score || !feedback}>ارسال بازخورد</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= sessions admin ================= */

function SessionsAdmin() {
  const { data, loading, refetch } = useFetch<{ sessions: { id: string; title: string; startTime: string; durationMin: number; status: string; mentor: { name: string }; student: { name: string } }[]; mentors: { id: string; name: string }[]; students: { id: string; name: string }[] }>("/api/admin?view=sessions");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ mentorId: "", studentId: "", title: "", startTime: "", durationMin: "60" });

  const create = async () => {
    try {
      const res = await apiPost<{ message: string }>("/api/admin", { action: "schedule-session", ...form, startTime: new Date(form.startTime).toISOString() });
      toast({ title: "ثبت شد ✅", description: res.message });
      setOpen(false); refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (loading || !data) return <ListSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>+ جلسه جدید</Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader><DialogTitle>زمان‌بندی جلسه</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>منتور</Label>
              <Select value={form.mentorId} onValueChange={(v) => setForm((f) => ({ ...f, mentorId: v }))}><SelectTrigger><SelectValue placeholder="انتخاب" /></SelectTrigger><SelectContent>{data.mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>دانشجو</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}><SelectTrigger><SelectValue placeholder="انتخاب" /></SelectTrigger><SelectContent>{data.students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>موضوع</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>زمان</Label><Input dir="ltr" type="datetime-local" className="text-left" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} /></div>
            <Button className="w-full glow-accent" onClick={create} disabled={!form.mentorId || !form.studentId || !form.startTime}>ثبت جلسه</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="p-4 text-right font-medium">جلسه</th>
              <th className="p-4 text-right font-medium">منتور</th>
              <th className="p-4 text-right font-medium">دانشجو</th>
              <th className="p-4 text-right font-medium">زمان</th>
              <th className="p-4 text-right font-medium">وضعیت</th>
            </tr></thead>
            <tbody>
              {data.sessions.map((s) => (
                <tr key={s.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="p-4 font-medium">{s.title}</td>
                  <td className="p-4">{s.mentor.name}</td>
                  <td className="p-4">{s.student.name}</td>
                  <td className="p-4 text-xs text-muted-foreground">{faDateTime(s.startTime)}</td>
                  <td className="p-4"><StatusBadge status={s.status} label={faStatus(s.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= support admin ================= */

function SupportAdmin() {
  const { data, loading, refetch } = useFetch<{ tickets: { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; user: { name: string }; messages: { id: string; body: string; isStaff: boolean; createdAt: string }[] }[] }>("/api/admin?view=support");
  const { toast } = useToast();
  const [reply, setReply] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  const send = async (ticketId: string, close: boolean) => {
    const message = reply[ticketId];
    if (!message?.trim()) return;
    await apiPost("/api/admin", { action: "reply-ticket", ticketId, message, close }).catch(() => null);
    toast({ title: close ? "پاسخ ارسال و تیکت بسته شد" : "پاسخ ارسال شد ✅" });
    setReply((r) => ({ ...r, [ticketId]: "" }));
    refetch();
  };

  if (loading || !data) return <ListSkeleton />;
  const tickets = data.tickets.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[["all", "همه"], ["OPEN", "باز"], ["ANSWERED", "پاسخ داده شده"], ["CLOSED", "بسته"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full border px-4 py-1.5 text-sm", filter === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
            {l}
          </button>
        ))}
      </div>
      {tickets.map((t) => (
        <Card key={t.id} className="border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{t.subject}</p>
                <p className="text-xs text-muted-foreground">{t.user.name} • {faAgo(t.createdAt)} • اولویت: {t.priority === "HIGH" ? "زیاد" : t.priority === "LOW" ? "کم" : "متوسط"}</p>
              </div>
              <StatusBadge status={t.status} label={faStatus(t.status)} />
            </div>
            <div className="space-y-2 border-t border-border pt-3">
              {t.messages.map((m) => (
                <div key={m.id} className={cn("max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6", m.isStaff ? "mr-auto bg-primary/10" : "bg-muted")}>
                  <p className="mb-1 text-[10px] font-bold text-primary">{m.isStaff ? "پشتیبانی" : t.user.name}</p>
                  {m.body}
                </div>
              ))}
            </div>
            {t.status !== "CLOSED" && (
              <div className="flex flex-wrap gap-2">
                <Input className="min-w-48 flex-1" value={reply[t.id] || ""} onChange={(e) => setReply((r) => ({ ...r, [t.id]: e.target.value }))} placeholder="پاسخ پشتیبانی..." />
                <Button size="sm" onClick={() => send(t.id, false)}>ارسال</Button>
                <Button size="sm" variant="outline" onClick={() => send(t.id, true)}>ارسال و بستن</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ================= recruitment ================= */

function RecruitmentAdmin() {
  const { data, loading, refetch } = useFetch<{ applications: { id: string; name: string; email: string; phone: string; resumeText?: string; status: string; interviewAt?: string | null; createdAt: string }[]; postings: { id: string; title: string; department: string; type: string; isActive: boolean }[] }>("/api/admin?view=recruitment");
  const { toast } = useToast();

  const update = async (id: string, status: string) => {
    await apiPost("/api/admin", { action: "update-application", id, status, interviewAt: status === "INTERVIEW" ? new Date(Date.now() + 3 * 86400000).toISOString() : null }).catch(() => null);
    toast({ title: "وضعیت به‌روزرسانی شد ✅" });
    refetch();
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        {data.applications.map((a) => (
          <Card key={a.id} className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p dir="ltr" className="text-xs text-muted-foreground">{toFa(a.phone)} {a.email && `• ${a.email}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} label={faStatus(a.status)} />
                  <Select value={a.status} onValueChange={(v) => update(a.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">در انتظار</SelectItem>
                      <SelectItem value="INTERVIEW">مصاحبه</SelectItem>
                      <SelectItem value="ACCEPTED">تایید</SelectItem>
                      <SelectItem value="REJECTED">رد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {a.resumeText && <p className="rounded-xl bg-muted/50 p-3.5 text-sm leading-6 text-muted-foreground">{a.resumeText}</p>}
              {a.interviewAt && <p className="text-xs text-primary">📅 مصاحبه: {faDateTime(a.interviewAt)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="h-fit border-border bg-card">
        <CardContent className="space-y-3 p-5">
          <p className="font-bold">موقعیت‌های شغلی فعال</p>
          {data.postings.map((p) => (
            <div key={p.id} className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.department} • {p.type === "FULL_TIME" ? "تمام‌وقت" : "پاره‌وقت"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= cms ================= */

function CmsAdmin() {
  const { data, loading, refetch } = useFetch<{ posts: { id: string; title: string; category: string; isPublished: boolean; views: number; createdAt: string }[]; testimonials: { id: string; name: string; content: string; rating: number }[]; faqs: { id: string; question: string; answer: string; category: string }[] }>("/api/admin?view=cms");
  const { toast } = useToast();
  const [postOpen, setPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", excerpt: "", content: "", category: "تحلیل بازار" });
  const [testiOpen, setTestiOpen] = useState(false);
  const [testiForm, setTestiForm] = useState({ name: "", role: "", content: "", rating: "5" });
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "عمومی" });

  const createPost = async () => {
    await apiPost("/api/admin", { action: "create-post", ...postForm }).catch(() => null);
    toast({ title: "مقاله منتشر شد ✅" });
    setPostOpen(false); refetch();
  };
  const createTesti = async () => {
    await apiPost("/api/admin", { action: "create-testimonial", ...testiForm, rating: Number(testiForm.rating) }).catch(() => null);
    toast({ title: "نظر ثبت شد ✅" });
    setTestiOpen(false); refetch();
  };
  const createFaq = async () => {
    await apiPost("/api/admin", { action: "create-faq", ...faqForm }).catch(() => null);
    toast({ title: "سوال ثبت شد ✅" });
    setFaqOpen(false); refetch();
  };
  const del = async (action: string, id: string, label: string) => {
    await apiPost("/api/admin", { action, id }).catch(() => null);
    toast({ title: `${label} حذف شد`, variant: "destructive" });
    refetch();
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setFaqOpen(true)}>+ سوال متداول</Button>
        <Button variant="outline" size="sm" onClick={() => setTestiOpen(true)}>+ نظر دانشجو</Button>
        <Button size="sm" onClick={() => setPostOpen(true)}>+ مقاله جدید</Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="space-y-2 p-6">
            <p className="mb-2 font-bold">مقالات بلاگ</p>
            <div className="max-h-80 space-y-2 overflow-y-auto pl-1">
              {data.posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.category} • {faNum(p.views)} بازدید • {faDate(p.createdAt)}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="size-7 shrink-0 text-destructive" onClick={() => del("delete-post", p.id, "مقاله")} aria-label="حذف">✕</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="space-y-2 p-6">
            <p className="mb-2 font-bold">نظرات دانشجویان</p>
            <div className="max-h-80 space-y-2 overflow-y-auto pl-1">
              {data.testimonials.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{t.name} <span className="text-xs text-amber-400">{"★".repeat(t.rating)}</span></p>
                    <p className="truncate text-xs text-muted-foreground">{t.content}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="size-7 shrink-0 text-destructive" onClick={() => del("delete-testimonial", t.id, "نظر")} aria-label="حذف">✕</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-2">
          <CardContent className="space-y-2 p-6">
            <p className="mb-2 font-bold">سوالات متداول</p>
            <div className="max-h-64 space-y-2 overflow-y-auto pl-1">
              {data.faqs.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{f.question}</p>
                    <p className="truncate text-xs text-muted-foreground">{f.answer}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="border-border text-[10px]">{f.category}</Badge>
                    <Button size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => del("delete-faq", f.id, "سوال")} aria-label="حذف">✕</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader><DialogTitle>مقاله جدید</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>عنوان *</Label><Input value={postForm.title} onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>دسته‌بندی</Label><Input value={postForm.category} onChange={(e) => setPostForm((f) => ({ ...f, category: e.target.value }))} /></div>
            <div className="space-y-2"><Label>خلاصه</Label><Textarea rows={2} value={postForm.excerpt} onChange={(e) => setPostForm((f) => ({ ...f, excerpt: e.target.value }))} /></div>
            <div className="space-y-2"><Label>متن کامل</Label><Textarea rows={6} value={postForm.content} onChange={(e) => setPostForm((f) => ({ ...f, content: e.target.value }))} /></div>
            <Button className="w-full glow-accent" onClick={createPost} disabled={!postForm.title}>انتشار</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={testiOpen} onOpenChange={setTestiOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader><DialogTitle>نظر جدید دانشجو</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>نام</Label><Input value={testiForm.name} onChange={(e) => setTestiForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>عنوان / نقش</Label><Input value={testiForm.role} onChange={(e) => setTestiForm((f) => ({ ...f, role: e.target.value }))} /></div>
            <div className="space-y-2"><Label>متن نظر</Label><Textarea rows={3} value={testiForm.content} onChange={(e) => setTestiForm((f) => ({ ...f, content: e.target.value }))} /></div>
            <div className="space-y-2"><Label>امتیاز</Label>
              <Select value={testiForm.rating} onValueChange={(v) => setTestiForm((f) => ({ ...f, rating: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[5, 4, 3].map((r) => <SelectItem key={r} value={String(r)}>{"★".repeat(r)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={createTesti} disabled={!testiForm.name || !testiForm.content}>ثبت</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader><DialogTitle>سوال متداول جدید</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>سوال</Label><Input value={faqForm.question} onChange={(e) => setFaqForm((f) => ({ ...f, question: e.target.value }))} /></div>
            <div className="space-y-2"><Label>پاسخ</Label><Textarea rows={3} value={faqForm.answer} onChange={(e) => setFaqForm((f) => ({ ...f, answer: e.target.value }))} /></div>
            <div className="space-y-2"><Label>دسته</Label><Input value={faqForm.category} onChange={(e) => setFaqForm((f) => ({ ...f, category: e.target.value }))} /></div>
            <Button className="w-full" onClick={createFaq} disabled={!faqForm.question || !faqForm.answer}>ثبت</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= marketing ================= */

function MarketingAdmin() {
  const { data, loading, refetch } = useFetch<{ coupons: { id: string; code: string; percentOff: number; maxUses: number; usedCount: number; isActive: boolean; expiresAt?: string | null }[]; products: { id: string; title: string; price: number; type: string; isActive: boolean }[] }>("/api/admin?view=marketing");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", percentOff: "15", maxUses: "100" });

  const create = async () => {
    try {
      const res = await apiPost<{ message: string }>("/api/admin", { action: "create-coupon", ...form, percentOff: Number(form.percentOff), maxUses: Number(form.maxUses) });
      toast({ title: "ساخته شد ✅", description: res.message });
      setOpen(false); refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  };

  const toggle = async (id: string, isActive: boolean) => {
    await apiPost("/api/admin", { action: "toggle-coupon", id, isActive }).catch(() => null);
    refetch();
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <p className="font-bold">کدهای تخفیف</p>
            <Button size="sm" onClick={() => setOpen(true)}>+ کد جدید</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-y border-border text-xs text-muted-foreground">
                <th className="p-3 text-right font-medium">کد</th>
                <th className="p-3 text-right font-medium">تخفیف</th>
                <th className="p-3 text-right font-medium">استفاده</th>
                <th className="p-3 text-right font-medium">وضعیت</th>
                <th className="p-3 text-right font-medium">عملیات</th>
              </tr></thead>
              <tbody>
                {data.coupons.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="p-3 font-bold" dir="ltr">{toFa(c.code)}</td>
                    <td className="p-3 text-primary">{faNum(c.percentOff)}٪</td>
                    <td className="p-3">{faNum(c.usedCount)} / {faNum(c.maxUses)}</td>
                    <td className="p-3"><StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} label={c.isActive ? "فعال" : "غیرفعال"} /></td>
                    <td className="p-3">
                      <Button size="sm" variant={c.isActive ? "outline" : "default"} onClick={() => toggle(c.id, !c.isActive)}>
                        {c.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <p className="mb-3 font-bold">محصولات دیجیتال</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.products.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-4 text-sm">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.type === "BOOK" ? "کتاب" : p.type === "INDICATOR" ? "اندیکاتور" : "محصول دیجیتال"}</p>
                </div>
                <span className="font-bold">{faToman(p.price)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader><DialogTitle>کد تخفیف جدید</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>کد (انگلیسی)</Label><Input dir="ltr" className="text-left" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>درصد تخفیف</Label><Input dir="ltr" className="text-left" inputMode="numeric" value={form.percentOff} onChange={(e) => setForm((f) => ({ ...f, percentOff: e.target.value.replace(/[^0-9]/g, "") }))} /></div>
              <div className="space-y-2"><Label>سقف استفاده</Label><Input dir="ltr" className="text-left" inputMode="numeric" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value.replace(/[^0-9]/g, "") }))} /></div>
            </div>
            <Button className="w-full glow-accent" onClick={create} disabled={!form.code}>ایجاد کد</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= audit & settings ================= */

function AuditAdmin() {
  const { data, loading } = useFetch<{ logs: { id: string; actorName: string; action: string; entity: string; detail?: string | null; createdAt: string }[] }>("/api/admin?view=audit");
  if (loading || !data) return <ListSkeleton />;
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-2 p-6">
        <p className="mb-2 font-bold">گزارش فعالیت‌های سیستم</p>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pl-1">
          {data.logs.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-4 text-sm">
              <div>
                <p><span className="font-bold text-primary">{l.actorName}</span> — {l.action} <span className="text-muted-foreground">({l.entity})</span></p>
                {l.detail && <p className="mt-1 text-xs text-muted-foreground">{l.detail}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{faAgo(l.createdAt)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsAdmin() {
  const { toast } = useToast();
  const [form, setForm] = useState({ site_title: "دی‌صفارا | آکادمی تخصصی آموزش ترید", payment_gateway: "زرین‌پال", support_phone: "۰۲۱-۹۱۰۰۲۲۳۳", mentor_commission_percent: "30" });
  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "site_title", label: "عنوان سایت" },
    { key: "payment_gateway", label: "درگاه پرداخت" },
    { key: "support_phone", label: "تلفن پشتیبانی" },
    { key: "mentor_commission_percent", label: "درصد کمیسیون منتور" },
  ];
  const save = async () => {
    for (const f of fields) {
      await apiPost("/api/admin", { action: "update-setting", key: f.key, value: form[f.key] }).catch(() => null);
    }
    toast({ title: "تنظیمات ذخیره شد ✅" });
  };
  return (
    <div className="max-w-2xl space-y-5">
      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <p className="font-bold">تنظیمات عمومی سیستم</p>
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              <Input value={form[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
            </div>
          ))}
          <Button className="glow-accent" onClick={save}>ذخیره تنظیمات</Button>
        </CardContent>
      </Card>
    </div>
  );
}
