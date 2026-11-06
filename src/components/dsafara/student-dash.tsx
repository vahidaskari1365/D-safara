"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { faAgo, faDate, faDateTime, faNum, faTime, faToman, faStatus, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Award, Bell, BookOpen, Brain, CalendarDays, CandlestickChart, ChartCandlestick, CheckCircle2,
  ChevronLeft, ClipboardCheck, CreditCard, FileText, Gift, GraduationCap, Headphones, Heart,
  LayoutDashboard, LineChart, ListTodo, LogOut, MessageSquare, PieChart, PlayCircle, Receipt,
  Send, Settings, ShoppingBag, Target, Trophy, User, Users, Wallet, Globe,
} from "lucide-react";
import {
  EmptyState, GridSkeleton, LevelBadge, ListSkeleton, PnlText, Price, RatingStars,
  SectionHead, SimpleDonut, StatCard, StatusBadge, TradesBarChart, PnlBarChart, TrendLineChart,
  RevenueAreaChart, useFetch,
} from "./shared";
import { Logo } from "./public-shell";
import { TradingWorkspace } from "./trading-workspace";

/* ================= data types ================= */

type DashData = {
  enrollments: { id: string; progress: number; createdAt: string; course: Course & { mentor: { name: string } | null; category: { title: string } | null; chapters: { lessons: { id: string }[] }[] } }[];
  journal: JournalEntry[];
  stats: { winRate: number; totalTrades: number; totalPnl: number; bestTrade?: JournalEntry; worstTrade?: JournalEntry };
  exercises: ExerciseT[];
  submissions: { id: string; content: string; status: string; score?: number | null; feedback?: string | null; createdAt: string; assignment: { title: string; course: { title: string } } }[];
  attempts: { id: string; score: number; maxScore: number; createdAt: string; exam: { title: string; course: { title: string } } }[];
  sessions: { id: string; title: string; startTime: string; durationMin: number; status: string; mentor: { name: string } }[];
  notifications: { id: string; title: string; body?: string; type: string; isRead: boolean; createdAt: string }[];
  mentorEnrollment: { plan: { title: string; sessionsPerWeek: number }; mentor: { name: string; avatar?: string } } | null;
  report: { weekLabel: string; summary: string; progress: number } | null;
  wallet: { balance: number } | null;
  certificates: { id: string; serial: string; title: string; issuedAt: string }[];
  pendingAssignments: { id: string; title: string; dueDate?: string | null; course: { title: string } }[];
  weeklyActivity: { date: string; trades: number }[];
};

type Course = {
  id: string; title: string; slug: string; description: string; image?: string;
  level: string; price: number; durationHours: number; rating: number;
  isFree?: boolean; category?: { title: string } | null;
};

type JournalEntry = {
  id: string; symbol: string; direction: string; entryPrice: number; exitPrice: number;
  lotSize: number; stopLoss?: number | null; takeProfit?: number | null;
  pnl: number; pnlPercent: number; status: string; setup?: string | null;
  notes?: string | null; emotion?: string | null; tradeDate: string;
};

type ExerciseT = {
  id: string; symbol: string; timeframe: string; taskTitle: string; description?: string | null;
  analysis?: string | null; checklist?: string | null; status: string;
  mentorScore?: number | null; mentorFeedback?: string | null; createdAt: string;
};

/* ================= shell ================= */

const studentNav = [
  { key: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { key: "courses", label: "دوره‌های من", icon: BookOpen },
  { key: "paths", label: "مسیرهای من", icon: Target },
  { key: "assignments", label: "تمرین‌ها", icon: ClipboardCheck },
  { key: "exams", label: "آزمون‌ها", icon: FileText },
  { key: "workspace", label: "ورک‌اسپیس معاملاتی", icon: CandlestickChart },
  { key: "journal", label: "ژورنال معاملات", icon: LineChart },
  { key: "mentor", label: "منتور من", icon: Users },
  { key: "sessions", label: "جلسات", icon: CalendarDays },
  { key: "calendar", label: "تقویم یادگیری", icon: CalendarDays },
  { key: "messages", label: "پیام‌ها", icon: MessageSquare },
  { key: "support", label: "پشتیبانی", icon: Headphones },
  { key: "notifications", label: "اعلان‌ها", icon: Bell },
  { key: "orders", label: "سفارش‌ها و پرداخت", icon: CreditCard },
  { key: "certificates", label: "گواهینامه‌ها", icon: Award },
  { key: "profile", label: "پروفایل", icon: User },
  { key: "settings", label: "تنظیمات", icon: Settings },
];

export function StudentApp() {
  const { studentPage, goStudent, setUser, goPublic, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: me } = useFetch<{ unreadNotifications: number; unreadMessages: number }>("/api/auth");

  const nav = studentPage;

  return (
    <div className={cn("dashboard-shell flex min-h-screen", user?.role === "MENTOR" ? "dashboard-mentor" : "dashboard-student")}>
      {/* sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-border bg-sidebar transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <Logo small showText />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="بستن منو">
            ✕
          </Button>
        </div>

        {/* profile block */}
        <div className="dashboard-sidebar-profile border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 ring-2 ring-primary/40">
              <AvatarFallback className="bg-primary/15 font-bold text-primary">{user?.name?.charAt(0) || "د"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role === "MENTOR" ? "منتور" : "دانشجو"}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <nav className="space-y-1" aria-label="منوی داشبورد">
            <p className="dashboard-nav-label">فضای کاری</p>
            {studentNav.map((n) => (
              <button
                key={n.key}
                onClick={() => { goStudent(n.key); setSidebarOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  nav === n.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <n.icon className="size-4.5 shrink-0" />
                {n.label}
                {n.key === "notifications" && me && me.unreadNotifications > 0 && (
                  <span className="mr-auto flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {toFa(me.unreadNotifications)}
                  </span>
                )}
              </button>
            ))}
            <div className="my-2 border-t border-border" />
            <button onClick={() => goPublic("home")} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-card">
              <Globe className="size-4.5" /> وب‌سایت عمومی
            </button>
            <button
              onClick={async () => { await apiPost("/api/auth", { action: "logout" }); setUser(null); goPublic("home"); }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive/80 hover:bg-destructive/10"
            >
              <LogOut className="size-4.5" /> خروج
            </button>
          </nav>
        </ScrollArea>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* content */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="منو">
              <ListTodo className="size-5" />
            </Button>
            <p className="font-bold">{studentNav.find((n) => n.key === nav)?.label || "داشبورد"}</p>
          </div>
          <div className="flex items-center gap-2"><button className="dashboard-header-icon" onClick={() => goStudent("notifications")} aria-label="اعلان‌ها"><Bell className="size-4" />{(me?.unreadNotifications || 0) > 0 && <span />}</button><button className="dashboard-header-user" onClick={() => goStudent("profile")}><Avatar className="size-8"><AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{user?.name?.charAt(0) || "د"}</AvatarFallback></Avatar><span className="hidden text-right sm:block"><b>{user?.name}</b><small>{user?.role === "MENTOR" ? "منتور" : "دانشجو"}</small></span></button></div>
        </header>

        <main className="p-4 pb-16 md:p-6">
          <StudentView page={nav} />
        </main>
      </div>
    </div>
  );
}

function StudentView({ page }: { page: string }) {
  switch (page) {
    case "overview": return <RoleOverview />;
    case "courses": return <MyCoursesView />;
    case "paths": return <StudentPathsView />;
    case "assignments": return <AssignmentsView />;
    case "exams": return <ExamsView />;
    case "workspace": return <WorkspaceView />;
    case "journal": return <JournalView />;
    case "mentor": return <MentorView />;
    case "sessions": return <SessionsView />;
    case "calendar": return <CalendarView />;
    case "messages": return <MessagesView />;
    case "support": return <SupportView />;
    case "notifications": return <NotificationsView />;
    case "orders": return <OrdersView />;
    case "certificates": return <CertificatesView />;
    case "profile": return <ProfileView />;
    case "settings": return <SettingsView />;
    default: return <OverviewView />;
  }
}

function RoleOverview() {
  const role = useApp((s) => s.user?.role);
  return role === "MENTOR" ? <MentorOverview /> : <OverviewView />;
}

type MentorDashboardData = {
  enrollments: { id: string; user: { id: string; name: string } | null; plan: { title: string } | null }[];
  sessions: { id: string; title: string; startTime: string; status: string; student: { name: string } | null }[];
  courses: { id: string; title: string }[];
};
function MentorOverview() {
  const { data, loading, error, refetch } = useFetch<MentorDashboardData>("/api/student?view=mentor-dashboard");
  const user = useApp((s) => s.user);
  const goStudent = useApp((s) => s.goStudent);
  if (loading) return <GridSkeleton cols={2} count={4} />;
  if (error || !data) return <div className="rounded-2xl border border-border p-6"><p>گزارش منتور در دسترس نیست.</p><Button variant="outline" className="mt-4" onClick={refetch}>تلاش دوباره</Button></div>;
  const upcoming = data.sessions.filter((s) => s.status === "SCHEDULED" && new Date(s.startTime).getTime() >= Date.now());
  const completed = data.sessions.filter((s) => s.status === "COMPLETED");
  return <div className="space-y-6">
    <div className="dashboard-title-row"><div><p className="dashboard-eyebrow">فضای منتورینگ / نمای کلی</p><h1 className="mt-2 text-2xl font-black md:text-3xl">خوش آمدید، {user?.name} 👋</h1><p className="mt-2 text-sm text-muted-foreground">جلسات، دانشجویان و عملکرد خود را یک‌جا ببینید.</p></div><Button variant="outline" onClick={() => goStudent("profile")}><User className="size-4" /> پروفایل</Button></div>
    <div className="mentor-command-banner"><div><span className="command-overline"><span /> مرکز منتورینگ</span><h2>آموزش بهتر، مسیر روشن‌تر.</h2><p>دانشجویان و جلسات خود را با تمرکز بیشتری دنبال کنید.</p></div><div className="mentor-banner-summary"><span>جلسات پیش‌رو</span><strong>{faNum(upcoming.length)}</strong><small>جلسه برنامه‌ریزی‌شده</small></div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="دانشجویان منتورینگ" value={faNum(new Set(data.enrollments.map((e) => e.user?.id).filter(Boolean)).size)} icon={<Users className="size-5" />} sub="پلن‌های پذیرفته‌شده" />
      <StatCard title="جلسات پیش‌رو" value={faNum(upcoming.length)} icon={<CalendarDays className="size-5" />} sub="جلسات برنامه‌ریزی‌شده" />
      <StatCard title="جلسات تکمیل‌شده" value={faNum(completed.length)} icon={<CheckCircle2 className="size-5" />} sub="در تمام زمان‌ها" />
      <StatCard title="دوره‌های من" value={faNum(data.courses.length)} icon={<BookOpen className="size-5" />} sub="دوره‌های منتور" />
    </div>
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2"><CardContent className="space-y-4 p-6"><div className="flex items-center justify-between"><div><p className="font-bold">فعالیت منتورینگ</p><p className="mt-1 text-xs text-muted-foreground">جلسات ثبت‌شده در شش ماه اخیر</p></div><span className="dashboard-pill">۶ ماه اخیر</span></div><TradesBarChart height={200} data={Array.from({ length: 6 }, (_, i) => { const now = new Date(); const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); const count = data.sessions.filter((session) => { const d = new Date(session.startTime); return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth(); }).length; return { label: date.toLocaleDateString("fa-IR", { month: "short" }), value: count }; })} /></CardContent></Card>
      <Card><CardContent className="space-y-4 p-6"><p className="font-bold">دوره‌های من</p>{data.courses.length ? data.courses.slice(0, 5).map((course) => <div key={course.id} className="dashboard-list-row"><span className="dashboard-list-icon"><BookOpen className="size-4" /></span><p className="text-sm font-bold">{course.title}</p></div>) : <p className="py-8 text-center text-sm text-muted-foreground">دوره‌ای ثبت نشده است.</p>}</CardContent></Card>
      <Card className="xl:col-span-2"><CardContent className="space-y-4 p-6"><div className="flex items-center justify-between"><div><p className="font-bold">جلسات پیش‌رو</p><p className="mt-1 text-xs text-muted-foreground">برنامه منتورینگ شما</p></div></div>
        {upcoming.length ? upcoming.slice(0, 5).map((s) => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4"><div><p className="text-sm font-bold">{s.title}</p><p className="mt-1 text-xs text-muted-foreground">{s.student?.name || "دانشجو"}</p></div><span className="text-xs text-primary">{faDateTime(s.startTime)}</span></div>) : <p className="py-8 text-center text-sm text-muted-foreground">جلسه‌ای در آینده برنامه‌ریزی نشده است.</p>}
      </CardContent></Card>
      <Card><CardContent className="space-y-4 p-6"><p className="font-bold">دانشجویان من</p>{data.enrollments.length ? data.enrollments.slice(0, 6).map((e) => <div key={e.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"><Avatar className="size-9"><AvatarFallback className="bg-primary/15 text-primary">{e.user?.name?.charAt(0) || "د"}</AvatarFallback></Avatar><div><p className="text-sm font-bold">{e.user?.name || "دانشجو"}</p><p className="text-xs text-muted-foreground">{e.plan?.title}</p></div></div>) : <p className="py-8 text-center text-sm text-muted-foreground">هنوز دانشجویی به شما اختصاص نیافته است.</p>}</CardContent></Card>
    </div>
    <Button variant="outline" onClick={() => goStudent("messages")}>مشاهده پیام‌ها</Button>
  </div>;
}

/* ================= overview ================= */

function OverviewView() {
  const { data, loading, error, refetch } = useFetch<DashData>("/api/student?view=dashboard");
  const user = useApp((s) => s.user);
  const goStudent = useApp((s) => s.goStudent);

  if (loading) return <GridSkeleton cols={2} count={4} />;
  if (error || !data) return <div className="rounded-xl border border-border p-6"><p>دریافت اطلاعات داشبورد ممکن نشد.</p><Button variant="outline" className="mt-4" onClick={refetch}>تلاش دوباره</Button></div>;

  const activeCourses = data.enrollments.filter((e) => e.progress < 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صبح بخیر" : hour < 18 ? "ظهر بخیر" : "شب بخیر";

  const upcoming = data.sessions.filter((session) => session.status === "SCHEDULED" && new Date(session.startTime).getTime() >= Date.now());
  const completed = data.enrollments.filter((e) => e.progress >= 100).length;

  return (
    <div className="overview-layout space-y-6">
      <div className="dashboard-title-row"><div><p className="dashboard-eyebrow">داشبورد / نمای کلی</p><h1 className="mt-2 text-2xl font-black md:text-3xl">{greeting}، {user?.name} 👋</h1><p className="mt-2 text-sm text-muted-foreground">مسیر پیشرفت خود را در یک نگاه دنبال کنید.</p></div><Button variant="outline" className="rounded-lg" onClick={() => goStudent("profile")}><User className="size-4" /> مشاهده پروفایل</Button></div>
      <div className="student-command-banner"><div><span className="command-overline"><span /> فضای یادگیری شما</span><h2>هر روز، یک قدم جلوتر.</h2><p>{activeCourses.length ? `شما ${faNum(activeCourses.length)} دوره در حال یادگیری دارید؛ از جایی که بودید ادامه دهید.` : "مسیر یادگیری خود را انتخاب کنید و اولین قدم را بردارید."}</p><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => activeCourses.length ? goStudent("courses") : useApp.getState().goPublic("courses")}>{activeCourses.length ? "ادامه یادگیری" : "مشاهده دوره‌ها"} <ChevronLeft className="size-4" /></Button><Button size="sm" variant="outline" onClick={() => goStudent("workspace")}><CandlestickChart className="size-4" /> فضای تحلیل</Button></div></div><div className="command-geometry" aria-hidden="true"><div className="command-circle"><span>DS</span></div></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="دوره‌های فعال" value={faNum(activeCourses.length)} icon={<BookOpen className="size-5" />} sub={`${faNum(data.enrollments.length)} ثبت‌نام کل`} />
        <StatCard title="دوره‌های تکمیل‌شده" value={faNum(completed)} icon={<Award className="size-5" />} sub="مسیر یادگیری شما" />
        <StatCard title="وین‌ریت معاملات" value={`${faNum(data.stats.winRate)}٪`} icon={<PieChart className="size-5" />} sub={`${faNum(data.stats.totalTrades)} معامله ثبت‌شده`} />
        <StatCard title="سود/ضرر کل" value={`${data.stats.totalPnl >= 0 ? "+" : "−"}${faNum(Math.abs(data.stats.totalPnl))}$`} icon={<LineChart className="size-5" />} sub="بر اساس ژورنال معاملات" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardContent className="p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-bold">فعالیت معاملاتی</p><p className="mt-1 text-xs text-muted-foreground">تعداد معاملات ثبت‌شده در ۷ روز اخیر</p></div><span className="dashboard-pill">هفتگی</span></div>
          <TradesBarChart data={data.weeklyActivity.map((w) => ({ label: ["ی", "د", "س", "چ", "پ", "ج", "ش"][new Date(w.date).getUTCDay()], value: w.trades }))} height={220} />
        </CardContent></Card>
        <Card><CardContent className="p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-bold">مسیر یادگیری</p><p className="mt-1 text-xs text-muted-foreground">دوره‌های در حال پیشرفت</p></div><Button variant="ghost" size="sm" onClick={() => goStudent("courses")}>همه <ChevronLeft className="size-4" /></Button></div>
          {activeCourses.length ? <div className="space-y-4">{activeCourses.slice(0, 3).map((e) => <button key={e.id} onClick={() => goStudent("courses")} className="course-progress-row w-full text-right"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{e.course.title}</p><p className="mt-2 text-xs text-muted-foreground">ادامه یادگیری</p><Progress value={e.progress} className="mt-3 h-1.5" /></div><span className="progress-ring" style={{ "--progress": `${Math.max(0, Math.min(100, e.progress))}%` } as React.CSSProperties}><span>{faNum(e.progress)}٪</span></span></button>)}</div> : <EmptyState icon={<BookOpen className="size-6" />} title="دوره فعالی ندارید" action={<Button size="sm" onClick={() => useApp.getState().goPublic("courses")}>مشاهده دوره‌ها</Button>} />}
        </CardContent></Card>
        <Card className="xl:col-span-2"><CardContent className="p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-bold">کارهای در انتظار</p><p className="mt-1 text-xs text-muted-foreground">تمرین‌ها و مراحل بعدی شما</p></div><Button variant="ghost" size="sm" onClick={() => goStudent("assignments")}>مشاهده همه</Button></div>
          {data.pendingAssignments.length || data.exercises.some((e) => e.status === "PENDING") ? <div className="space-y-2">{data.pendingAssignments.slice(0, 3).map((a) => <div key={a.id} className="dashboard-list-row"><span className="dashboard-list-icon"><ClipboardCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.title}</p><p className="mt-1 text-xs text-muted-foreground">{a.course.title}{a.dueDate && ` · ${faDate(a.dueDate)}`}</p></div><Button size="sm" variant="outline" onClick={() => goStudent("assignments")}>مشاهده</Button></div>)}{data.exercises.filter((e) => e.status === "PENDING").slice(0, 2).map((e) => <div key={e.id} className="dashboard-list-row"><span className="dashboard-list-icon"><CandlestickChart className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{e.taskTitle}</p><p className="mt-1 text-xs text-muted-foreground">در انتظار بررسی منتور</p></div><Button size="sm" variant="outline" onClick={() => goStudent("workspace")}>مشاهده</Button></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">کاری در انتظار ندارید.</p>}
        </CardContent></Card>
        <Card><CardContent className="p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-bold">جلسات پیش‌رو</p><p className="mt-1 text-xs text-muted-foreground">همراه منتور شما</p></div><CalendarDays className="size-4 text-primary" /></div>
          {upcoming.length ? <div className="space-y-3">{upcoming.slice(0, 3).map((session) => <div key={session.id} className="session-tile"><p className="text-sm font-bold">{session.title}</p><p className="mt-1 text-xs text-muted-foreground">با {session.mentor.name}</p><p className="mt-3 text-xs text-primary">{faDateTime(session.startTime)}</p></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">جلسه‌ای برنامه‌ریزی نشده است.</p>}
          <Button variant="outline" className="mt-4 w-full" onClick={() => goStudent("sessions")}>تقویم جلسات</Button>
        </CardContent></Card>
        <Card className="xl:col-span-2"><CardContent className="p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-bold">عملکرد معاملات اخیر</p><p className="mt-1 text-xs text-muted-foreground">سود و زیان آخرین معاملات ثبت‌شده · دلار</p></div><Button variant="ghost" size="sm" onClick={() => goStudent("journal")}>ژورنال <ChevronLeft className="size-4" /></Button></div>{data.journal.length ? <PnlBarChart data={[...data.journal].reverse().map((j) => ({ label: j.symbol, pnl: j.pnl }))} height={190} /> : <p className="py-12 text-center text-sm text-muted-foreground">هنوز معامله‌ای در ژورنال ثبت نشده است.</p>}</CardContent></Card>
        <Card><CardContent className="p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-bold">وضعیت حساب</p><p className="mt-1 text-xs text-muted-foreground">خلاصه فضای شخصی</p></div><Wallet className="size-4 text-primary" /></div><div className="account-summary"><span>موجودی کیف پول</span><strong>{faToman(data.wallet?.balance || 0)}</strong></div><div className="dashboard-list-row mt-3"><Award className="size-4 text-amber-300" /><span className="flex-1 text-xs">گواهینامه‌ها</span><b className="text-sm">{faNum(data.certificates.length)}</b></div><Button variant="outline" className="mt-4 w-full" onClick={() => goStudent("orders")}>سفارش‌ها و پرداخت‌ها</Button></CardContent></Card>
        {data.report && <Card className="xl:col-span-3"><CardContent className="flex flex-wrap items-center gap-4 p-5"><span className="dashboard-list-icon"><Users className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">گزارش منتور · {data.report.weekLabel}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{data.report.summary}</p></div><span className="dashboard-pill">پیشرفت {faNum(data.report.progress)}٪</span></CardContent></Card>}
      </div>
    </div>
  );
}

/* ================= my courses ================= */

function MyCoursesView() {
  const { data, loading } = useFetch<{ enrollments: DashData["enrollments"] }>("/api/student?view=dashboard");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  if (loading || !data) return <GridSkeleton />;
  if (selectedSlug) return <CoursePlayer slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;

  return (
    <div className="space-y-6">
      {data.enrollments.length === 0 ? (
        <EmptyState icon={<GraduationCap className="size-6" />} title="هنوز در دوره‌ای ثبت‌نام نکرده‌اید" action={<Button onClick={() => useApp.getState().goPublic("courses")}>مشاهده دوره‌ها</Button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.enrollments.map((e) => (
            <Card key={e.id} className="card-hover cursor-pointer overflow-hidden border-border bg-card" onClick={() => setSelectedSlug(e.course.slug)}>
              <CourseThumb image={e.course.image} title={e.course.title} />
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-primary">{e.course.category?.title}</span>
                  <LevelBadge level={e.course.level} />
                </div>
                <p className="line-clamp-1 font-bold">{e.course.title}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>پیشرفت</span><span className="font-bold text-primary">{faNum(e.progress)}٪</span>
                  </div>
                  <Progress value={e.progress} className="h-2" />
                </div>
                <Button size="sm" className="w-full gap-1.5">
                  <PlayCircle className="size-4" /> {e.progress === 0 ? "شروع دوره" : e.progress >= 100 ? "مرور دوره" : "ادامه یادگیری"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseThumb({ image, title }: { image?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 via-card to-card">
      {image && !failed
        ? <img src={image} alt={title} className="size-full object-cover" onError={() => setFailed(true)} />
        : <ChartCandlestick className="size-10 text-primary/70" />}
    </div>
  );
}

/* ================= course player ================= */

type PlayerData = {
  course: Course & {
    chapters: { id: string; title: string; order: number; lessons: { id: string; title: string; durationMin: number; isFree: boolean; description?: string }[] }[];
    mentor: { name: string } | null;
  };
  enrollment: { progress: number } | null;
  progressRecords: { lessonId: string; completed: boolean }[];
};

function CoursePlayer({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data, loading, refetch } = useFetch<PlayerData>(`/api/student?view=course&slug=${slug}`);
  const { toast } = useToast();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const allLessons = useMemo(() => data?.course.chapters.flatMap((c) => c.lessons) || [], [data]);
  const completed = new Set((data?.progressRecords || []).filter((p) => p.completed).map((p) => p.lessonId));
  const current = allLessons.find((l) => l.id === activeLesson) || allLessons.find((l) => !completed.has(l.id)) || allLessons[0];

  const complete = async (lessonId: string) => {
    try {
      await apiPost("/api/student", { action: "complete-lesson", lessonId });
      toast({ title: "درس تکمیل شد ✅" });
      refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (loading || !data) return <GridSkeleton />;
  const doneCount = completed.size;
  const pct = Math.round((doneCount / Math.max(allLessons.length, 1)) * 100);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ChevronLeft className="size-4 rotate-180" /> بازگشت به دوره‌ها</Button>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* video area */}
          <Card className="overflow-hidden border-border bg-card">
            <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/15 via-background to-background">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-105">
                <PlayCircle className="size-10" />
              </div>
              <div className="text-center">
                <p className="font-bold">{current?.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{current && `${toFa(current.durationMin)} دقیقه`}</p>
              </div>
            </div>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current?.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{current?.description}</p>
              </div>
              {current && !completed.has(current.id) && (
                <Button size="sm" className="gap-1 shrink-0" onClick={() => complete(current.id)}>
                  <CheckCircle2 className="size-4" /> تکمیل درس
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-bold">یادداشت‌های من از این درس</p>
              <Textarea rows={3} placeholder="نکات مهم این درس را یادداشت کنید..." />
              <Button size="sm" variant="outline" onClick={() => toast({ title: "یادداشت ذخیره شد 📝" })}>ذخیره یادداشت</Button>
            </CardContent>
          </Card>
        </div>

        {/* curriculum */}
        <div className="space-y-5">
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="font-bold">{data.course.title}</p>
              <div className="flex items-center gap-3">
                <Progress value={pct} className="h-2 flex-1" />
                <span className="text-xs font-bold text-primary">{faNum(pct)}٪</span>
              </div>
              <p className="text-xs text-muted-foreground">{toFa(doneCount)} از {toFa(allLessons.length)} درس تکمیل شده</p>
              {pct >= 100 && (
                <div className="rounded-xl bg-primary/10 p-3 text-center text-xs font-medium text-primary">پیشرفت ثبت شد؛ صدور گواهینامه منوط به احراز شرایط آموزشی است.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="max-h-[480px] space-y-4 overflow-y-auto p-4">
              {data.course.chapters.map((ch, ci) => (
                <div key={ch.id}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs text-primary">{toFa(ci + 1)}</span>
                    {ch.title}
                  </p>
                  <div className="space-y-1">
                    {ch.lessons.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setActiveLesson(l.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-xs transition-colors",
                          current?.id === l.id ? "bg-primary/15 text-primary" : "hover:bg-muted/60"
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {completed.has(l.id) ? <CheckCircle2 className="size-4 shrink-0 text-primary" /> : <PlayCircle className="size-4 shrink-0 text-muted-foreground" />}
                          <span className="truncate">{l.title}</span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">{toFa(l.durationMin)}′</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= student paths ================= */

function StudentPathsView() {
  const { data, loading } = useFetch<{ enrollments: { courseId: string; progress: number }[]; paths: { id: string; title: string; description: string; color?: string; courses: { course: Course }[] }[] }>("/api/student?view=paths");
  if (loading || !data) return <GridSkeleton />;
  const enrolledMap = new Map(data.enrollments.map((e) => [e.courseId, e.progress]));

  return (
    <div className="space-y-6">
      {data.paths.map((p) => {
        const total = p.courses.length;
        const done = p.courses.filter((pc) => (enrolledMap.get(pc.course.id) ?? -1) >= 100).length;
        const started = p.courses.filter((pc) => enrolledMap.has(pc.course.id)).length;
        const pathPct = Math.round(((done + started * 0.5) / total) * 100);
        return (
          <Card key={p.id} className="border-border bg-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.description}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-2xl font-extrabold text-primary">{faNum(pathPct)}٪</p>
                  <p className="text-xs text-muted-foreground">{toFa(done)} از {toFa(total)} دوره کامل</p>
                </div>
              </div>
              <Progress value={pathPct} className="h-2" />
              <div className="grid gap-2 md:grid-cols-2">
                {p.courses.map((pc, i) => {
                  const prog = enrolledMap.get(pc.course.id);
                  return (
                    <div key={pc.course.id} className={cn("flex items-center justify-between gap-3 rounded-xl p-3.5 text-sm", prog != null ? "bg-primary/5" : "bg-muted/40")}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", prog >= 100 ? "bg-primary text-primary-foreground" : prog != null ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                          {prog >= 100 ? "✓" : toFa(i + 1)}
                        </span>
                        <span className="truncate">{pc.course.title}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{prog != null ? `${faNum(prog)}٪` : "شروع نشده"}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ================= assignments ================= */

function AssignmentsView() {
  const { data, loading, refetch } = useFetch<{ assignments: { id: string; title: string; description: string; dueDate?: string | null; maxScore: number; course: { title: string }; submissions: { id: string; content: string; status: string; score?: number | null; feedback?: string | null; createdAt: string }[] }[] }>("/api/student?view=assignments");
  const { toast } = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const asg = data?.assignments.find((a) => a.id === active);

  const submit = async () => {
    if (!asg) return;
    setSending(true);
    try {
      const res = await apiPost<{ message: string }>("/api/student", { action: "submit-assignment", assignmentId: asg.id, content: text });
      toast({ title: "ارسال شد ✅", description: res.message });
      setActive(null); setText("");
      refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading || !data) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      {data.assignments.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="size-6" />} title="تمرینی برای دوره‌های شما وجود ندارد" />
      ) : data.assignments.map((a) => {
        const sub = a.submissions[0];
        return (
          <Card key={a.id} className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.course.title} {a.dueDate && `• مهلت: ${faDate(a.dueDate)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  {sub ? <StatusBadge status={sub.status} label={sub.status === "SUBMITTED" ? "ارسال شده" : sub.status === "GRADED" ? `نمره: ${toFa(sub.score ?? 0)}` : "بازنگری"} /> : <StatusBadge status="PENDING" label="بدون پاسخ" />}
                  <Button size="sm" variant={sub ? "outline" : "default"} onClick={() => { setActive(a.id); setText(sub?.content || ""); }}>
                    {sub ? (sub.status === "REVISION" ? "اصلاح و ارسال مجدد" : "مشاهده / ویرایش") : "ارسال پاسخ"}
                  </Button>
                </div>
              </div>
              <p className="rounded-xl bg-muted/50 p-4 text-sm leading-7 text-muted-foreground">{a.description}</p>
              {sub?.feedback && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-7">
                  <p className="mb-1 text-xs font-bold text-primary">💬 بازخورد منتور:</p>
                  {sub.feedback}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader><DialogTitle>{asg?.title}</DialogTitle><DialogDescription>پاسخ خود را کامل و شفاف بنویسید.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="پاسخ خود را اینجا بنویسید..." />
            <Button className="w-full glow-accent" onClick={submit} disabled={sending || text.trim().length < 10}>
              {sending ? "در حال ارسال..." : "ارسال پاسخ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= exams ================= */

type ExamT = { id: string; title: string; description?: string; durationMin: number; course: { title: string }; questions: { id: string; text: string; options: string; score: number }[]; attempts: { id: string; score: number; maxScore: number; createdAt: string }[] };

function ExamsView() {
  const { data, loading } = useFetch<{ exams: ExamT[] }>("/api/student?view=exams");
  const [takingExam, setTakingExam] = useState<string | null>(null);
  if (loading || !data) return <ListSkeleton />;
  if (takingExam) return <ExamRunner examId={takingExam} onDone={() => setTakingExam(null)} />;

  return (
    <div className="space-y-4">
      {data.exams.length === 0 ? (
        <EmptyState icon={<FileText className="size-6" />} title="آزمونی در دسترس نیست" desc="آزمون‌ها پس از ثبت‌نام در دوره فعال می‌شوند." />
      ) : data.exams.map((ex) => (
        <Card key={ex.id} className="border-border bg-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-bold">{ex.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{ex.course.title} • {toFa(ex.questions.length)} سوال • {toFa(ex.durationMin)} دقیقه</p>
              {ex.attempts[0] && (
                <p className="mt-2 text-xs">
                  آخرین نتیجه: <span className={cn("font-bold", ex.attempts[0].score / Math.max(ex.attempts[0].maxScore, 1) >= 0.7 ? "text-primary" : "text-destructive")}>
                    {toFa(ex.attempts[0].score)} از {toFa(ex.attempts[0].maxScore)}
                  </span>
                </p>
              )}
            </div>
            <Button className="gap-1.5" onClick={() => setTakingExam(ex.id)}>
              <PlayCircle className="size-4" /> {ex.attempts.length ? "شرکت مجدد" : "شروع آزمون"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExamRunner({ examId, onDone }: { examId: string; onDone: () => void }) {
  const { data, loading } = useFetch<{ exam: ExamT }>(`/api/student?view=exam&id=${examId}`);
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; detail: Record<string, boolean> } | null>(null);

  const submitExam = async () => {
    if (!data) return;
    const unanswered = data.exam.questions.filter((q) => answers[q.id] === undefined).length;
    if (unanswered > 0) {
      toast({ title: "سوالات بی‌پاسخ", description: `${toFa(unanswered)} سوال پاسخ داده نشده است.`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ attempt: { score: number; maxScore: number }; detail: Record<string, boolean> }>(
        "/api/student", { action: "submit-exam", examId, answers }
      );
      setResult({ score: res.attempt.score, maxScore: res.attempt.maxScore, detail: res.detail });
      toast({ title: "آزمون ثبت شد ✅" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) return <GridSkeleton />;
  const exam = data.exam;

  if (result) {
    const pct = Math.round((result.score / Math.max(result.maxScore, 1)) * 100);
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className={cn("border-border bg-card", pct >= 70 && "border-primary/40")}>
          <CardContent className="space-y-5 p-8 text-center">
            <div className={cn("mx-auto flex size-20 items-center justify-center rounded-full", pct >= 70 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
              {pct >= 70 ? <Trophy className="size-9" /> : <Brain className="size-9" />}
            </div>
            <p className="text-2xl font-extrabold">{toFa(pct)}٪</p>
            <p className="text-sm text-muted-foreground">
              {pct >= 70 ? "آفرین! قبول شدید و گواهینامه شما صادر شد 🎉" : "این‌بار قبول نشدید؛ نکات را مرور کنید و دوباره تلاش کنید."}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={onDone}>بازگشت به لیست آزمون‌ها</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-bold">{exam.title}</p>
        <Badge variant="outline" className="border-border">{toFa(exam.durationMin)} دقیقه</Badge>
      </div>
      {exam.questions.map((q, qi) => {
        const options: string[] = JSON.parse(q.options);
        return (
          <Card key={q.id} className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-semibold">{toFa(qi + 1)}. {q.text}</p>
              <div className="space-y-2">
                {options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3.5 text-right text-sm transition-colors",
                      answers[q.id] === oi ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", answers[q.id] === oi ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {toFa(oi + 1)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button className="w-full glow-accent" size="lg" onClick={submitExam} disabled={submitting}>
        {submitting ? "در حال ثبت..." : "پایان و ثبت آزمون"}
      </Button>
    </div>
  );
}

/* ================= trading workspace & journal ================= */

function WorkspaceView() {
  const { data, loading, refetch } = useFetch<{ exercises: ExerciseT[] }>("/api/student?view=exercises");
  return <TradingWorkspace exercises={data?.exercises || []} loading={loading} onRefresh={refetch} />;
}

function JournalView() {
  const { data, loading, refetch } = useFetch<{
    journal: JournalEntry[];
    analytics: { winRate: number; totalTrades: number; totalPnl: number; profitFactor: number; avgWin: number; avgLoss: number; bySymbol: Record<string, { count: number; pnl: number }>; monthly: Record<string, number> };
  }>("/api/student?view=journal");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ symbol: "XAUUSD", direction: "LONG", entryPrice: "", exitPrice: "", lotSize: "0.1", stopLoss: "", takeProfit: "", setup: "", notes: "", emotion: "" });

  const addTrade = async () => {
    setSaving(true);
    try {
      await apiPost("/api/student", { action: "add-journal", ...form });
      toast({ title: "معامله ثبت شد ✅", description: "آمار ژورنال شما به‌روزرسانی شد." });
      setOpen(false);
      setForm((f) => ({ ...f, entryPrice: "", exitPrice: "", notes: "", setup: "", emotion: "" }));
      refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    await apiPost("/api/student", { action: "delete-journal", id }).catch(() => null);
    toast({ title: "معامله حذف شد" });
    refetch();
  };

  if (loading || !data) return <GridSkeleton />;
  const a = data.analytics;
  const monthlyData = Object.entries(a.monthly).slice(-6).map(([k, v]) => ({ label: k.slice(5), pnl: Math.round(v) }));
  const symbolData = Object.entries(a.bySymbol).map(([sym, v]) => ({ name: sym, value: v.count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">ژورنال معاملات</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5 glow-accent"><LineChart className="size-4" /> ثبت معامله جدید</Button></DialogTrigger>
            <DialogContent className="max-w-lg border-border bg-card">
              <DialogHeader><DialogTitle>ثبت معامله جدید در ژورنال</DialogTitle></DialogHeader>
              <div className="grid max-h-[65vh] gap-4 overflow-y-auto pl-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>نماد</Label>
                    <Select value={form.symbol} onValueChange={(v) => setForm((f) => ({ ...f, symbol: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD", "US30"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>جهت</Label>
                    <Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="LONG">خرید (Long)</SelectItem><SelectItem value="SHORT">فروش (Short)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>قیمت ورود</Label><Input dir="ltr" className="text-left" inputMode="decimal" value={form.entryPrice} onChange={(e) => setForm((f) => ({ ...f, entryPrice: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>قیمت خروج</Label><Input dir="ltr" className="text-left" inputMode="decimal" value={form.exitPrice} onChange={(e) => setForm((f) => ({ ...f, exitPrice: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>حجم (لات)</Label><Input dir="ltr" className="text-left" inputMode="decimal" value={form.lotSize} onChange={(e) => setForm((f) => ({ ...f, lotSize: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>حد ضرر</Label><Input dir="ltr" className="text-left" inputMode="decimal" value={form.stopLoss} onChange={(e) => setForm((f) => ({ ...f, stopLoss: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>حد سود</Label><Input dir="ltr" className="text-left" inputMode="decimal" value={form.takeProfit} onChange={(e) => setForm((f) => ({ ...f, takeProfit: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>ستاپ</Label><Input value={form.setup} onChange={(e) => setForm((f) => ({ ...f, setup: e.target.value }))} placeholder="مثلاً OB + FVG" /></div>
                </div>
                <div className="space-y-2"><Label>یادداشت معامله</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>احساسات هنگام معامله</Label>
                  <Select value={form.emotion} onValueChange={(v) => setForm((f) => ({ ...f, emotion: v }))}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>{["آرام", "متمرکز", "با اعتماد", "عجول", "FOMO", "بی‌حوصلگی"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="glow-accent" onClick={addTrade} disabled={saving || !form.entryPrice || !form.exitPrice}>
                  {saving ? "در حال ثبت..." : "ثبت معامله"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="وین‌ریت" value={`${faNum(a.winRate)}٪`} accent="text-primary" icon={<Trophy className="size-5" />} sub={`${faNum(a.totalTrades)} معامله`} />
        <StatCard title="سود/ضرر کل" value={`${a.totalPnl >= 0 ? "+" : "−"}${faNum(Math.abs(a.totalPnl))}$`} accent={a.totalPnl >= 0 ? "text-primary" : "text-destructive"} icon={<LineChart className="size-5" />} />
        <StatCard title="پروفیت فکتور" value={faNum(a.profitFactor, 2)} icon={<PieChart className="size-5" />} sub={`میانگین سود ${faNum(a.avgWin)}$ / ضرر ${faNum(a.avgLoss)}$`} />
        <StatCard title="میانگین R معاملات" value={faNum(a.totalTrades ? a.totalPnl / a.totalTrades : 0, 1) + "$"} icon={<Target className="size-5" />} sub="به‌طور میانگین هر معامله" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="border-border bg-card xl:col-span-2">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">روند سود/ضرر ماهانه (دلار)</p>
            {monthlyData.length ? <PnlBarChart data={monthlyData} /> : <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای برای نمایش نیست</p>}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-6">
            <p className="font-bold">توزیع معاملات بر اساس نماد</p>
            {symbolData.length ? <SimpleDonut data={symbolData} /> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5 pb-3">
            <p className="font-bold">تاریخچه معاملات</p>
            <span className="text-xs text-muted-foreground">{toFa(data.journal.length)} معامله</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border text-xs text-muted-foreground">
                  <th className="p-3 text-right font-medium">نماد</th>
                  <th className="p-3 text-right font-medium">جهت</th>
                  <th className="p-3 text-right font-medium">ورود / خروج</th>
                  <th className="p-3 text-right font-medium">لات</th>
                  <th className="p-3 text-right font-medium">سود/ضرر</th>
                  <th className="p-3 text-right font-medium">ستاپ</th>
                  <th className="p-3 text-right font-medium">تاریخ</th>
                  <th className="p-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.journal.map((j) => (
                  <tr key={j.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="p-3 font-bold">{j.symbol}</td>
                    <td className="p-3">
                      <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-medium", j.direction === "LONG" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
                        {j.direction === "LONG" ? "خرید" : "فروش"}
                      </span>
                    </td>
                    <td dir="ltr" className="p-3 text-left text-xs tabular-nums text-muted-foreground">{toFa(j.entryPrice)} → {toFa(j.exitPrice)}</td>
                    <td dir="ltr" className="p-3 text-left text-xs">{toFa(j.lotSize)}</td>
                    <td className="p-3"><PnlText value={j.pnl} suffix="$" /></td>
                    <td className="p-3 text-xs text-muted-foreground">{j.setup || "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{faDate(j.tradeDate)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => del(j.id)} aria-label="حذف">
                        ✕
                      </Button>
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

/* ================= mentor ================= */

function MentorView() {
  const { data, loading } = useFetch<{ planEnrollment: DashData["mentorEnrollment"]; sessions: { id: string; title: string; startTime: string; status: string; mentor: { name: string } }[]; reports: { id: string; weekLabel: string; summary: string; progress: number; createdAt: string }[] }>("/api/student?view=mentor");
  if (loading || !data) return <GridSkeleton />;
  const pe = data.planEnrollment;

  return (
    <div className="space-y-6">
      {pe ? (
        <Card className="border-primary/30 bg-gradient-to-l from-primary/10 to-card">
          <CardContent className="flex flex-wrap items-center gap-5 p-6">
            <Avatar className="size-16 ring-2 ring-primary/50">
              <AvatarFallback className="bg-primary/15 text-xl font-extrabold text-primary">{pe.mentor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-lg font-extrabold">{pe.mentor.name}</p>
              <p className="text-sm text-muted-foreground">منتور اختصاصی شما • پلن {pe.plan.title}</p>
              <p className="mt-1 text-xs text-primary">{toFa(pe.plan.sessionsPerWeek)} جلسه در هفته</p>
            </div>
            <Button className="gap-1.5" onClick={() => useApp.getState().goStudent("messages")}>
              <MessageSquare className="size-4" /> پیام به منتور
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Users className="size-6" />}
          title="منتور اختصاصی ندارید"
          desc="با فعال‌سازی پلن منتورینگ، هفته‌ای چند جلسه با منتور حرفه‌ای خواهید داشت."
          action={<Button className="mt-2" onClick={() => useApp.getState().goPublic("services")}>مشاهده پلن‌های منتورینگ</Button>}
        />
      )}

      {data.reports.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <p className="font-bold">گزارش‌های هفتگی</p>
            {data.reports.map((r) => (
              <div key={r.id} className="space-y-2 rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{r.weekLabel}</p>
                  <span className="text-xs font-bold text-primary">{faNum(r.progress)}٪ پیشرفت</span>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">{r.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-6">
          <p className="font-bold">تاریخچه جلسات</p>
          {data.sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-4 text-sm">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">با {s.mentor.name} • {faDateTime(s.startTime)}</p>
              </div>
              <StatusBadge status={s.status} label={faStatus(s.status)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= sessions ================= */

function SessionsView() {
  const { data, loading, refetch } = useFetch<{ sessions: { id: string; title: string; startTime: string; durationMin: number; status: string; mentor: { name: string; id?: string } }[]; mentors: { id: string; name: string }[] }>("/api/student?view=sessions");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ mentorId: "", title: "", startTime: "" });
  const [saving, setSaving] = useState(false);

  const book = async () => {
    setSaving(true);
    try {
      const res = await apiPost<{ message: string }>("/api/student", { action: "book-session", ...form, startTime: new Date(form.startTime).toISOString() });
      toast({ title: "رزرو شد ✅", description: res.message });
      setOpen(false); refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <ListSkeleton />;

  const upcoming = data.sessions.filter((s) => s.status === "SCHEDULED" && new Date(s.startTime) > new Date());
  const past = data.sessions.filter((s) => s.status !== "SCHEDULED");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5"><CalendarDays className="size-4" /> رزرو جلسه جدید</Button></DialogTrigger>
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader><DialogTitle>رزرو جلسه منتورینگ</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>منتور</Label>
                <Select value={form.mentorId} onValueChange={(v) => setForm((f) => ({ ...f, mentorId: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب منتور" /></SelectTrigger>
                  <SelectContent>{data.mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>موضوع جلسه</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثلاً بازبینی معاملات هفته" />
              </div>
              <div className="space-y-2">
                <Label>تاریخ و ساعت</Label>
                <Input dir="ltr" type="datetime-local" className="text-left" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <Button className="w-full glow-accent" onClick={book} disabled={saving || !form.mentorId || !form.startTime}>
                {saving ? "در حال رزرو..." : "ثبت رزرو"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <p className="mb-3 font-bold">جلسات پیش‌رو</p>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">جلسه‌ای رزرو نشده است.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <Card key={s.id} className="border-primary/30 bg-primary/5">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-bold">{s.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">با {s.mentor.name} • {faDateTime(s.startTime)} • {toFa(s.durationMin)} دقیقه</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="glow-accent" onClick={() => toast({ title: "در حال اتصال...", description: "اتاق جلسه (نمایشی) در حال باز شدن است." })}>ورود به جلسه</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await apiPost("/api/student", { action: "cancel-session", id: s.id }); toast({ title: "جلسه لغو شد" }); refetch(); }}>لغو</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 font-bold">جلسات قبلی</p>
        {past.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">تاریخچه‌ای وجود ندارد.</p> : (
          <div className="space-y-3">
            {past.map((s) => (
              <Card key={s.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">با {s.mentor.name} • {faDateTime(s.startTime)}</p>
                  </div>
                  <StatusBadge status={s.status} label={faStatus(s.status)} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= calendar ================= */

function CalendarView() {
  const { data, loading } = useFetch<{ sessions: { id: string; title: string; startTime: string; mentor: { name: string } }[]; assignments: { id: string; title: string; dueDate: string; course: { title: string } }[]; exams: { id: string; title: string; course: { title: string } }[] }>("/api/student?view=calendar");
  const [monthOffset, setMonthOffset] = useState(0);

  const view = useMemo(() => {
    const base = new Date();
    base.setMonth(base.getMonth() + monthOffset);
    const y = base.getFullYear(), m = base.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    // Persian weekday: Saturday=0
    const startOffset = (first.getDay() + 1) % 7;
    return { y, m, daysInMonth, startOffset };
  }, [monthOffset]);

  const eventMap = useMemo(() => {
    const map: Record<number, { type: string; label: string }[]> = {};
    if (data) {
      data.sessions.forEach((s) => {
        const d = new Date(s.startTime);
        if (d.getMonth() === view.m && d.getFullYear() === view.y) (map[d.getDate()] ||= []).push({ type: "session", label: s.title });
      });
      data.assignments.forEach((a) => {
        const d = new Date(a.dueDate);
        if (d.getMonth() === view.m && d.getFullYear() === view.y) (map[d.getDate()] ||= []).push({ type: "assignment", label: a.title });
      });
    }
    return map;
  }, [data, view]);

  if (loading || !data) return <GridSkeleton />;
  const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const jMonthIndex = (view.m + 9) % 12;
  const jYear = view.y - 621 - ((view.m >= 2 && jMonthIndex < 9) ? 1 : 0);

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="border-border bg-card xl:col-span-2">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setMonthOffset((o) => o - 1)} aria-label="ماه قبل">›</Button>
            <p className="font-bold">{monthNames[jMonthIndex]} {toFa(jYear)}</p>
            <Button variant="ghost" size="icon" onClick={() => setMonthOffset((o) => o + 1)} aria-label="ماه بعد">‹</Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => <span key={d} className="py-2 text-muted-foreground">{d}</span>)}
            {Array.from({ length: view.startOffset }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: view.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = eventMap[day] || [];
              const isToday = monthOffset === 0 && day === new Date().getDate();
              return (
                <div key={day} className={cn(
                  "flex min-h-16 flex-col gap-1 rounded-lg border p-1.5 text-xs transition-colors",
                  isToday ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/30",
                  events.length > 0 && "bg-muted/50"
                )}>
                  <span className={cn("font-bold", isToday && "text-primary")}>{toFa(day)}</span>
                  {events.slice(0, 2).map((ev, ei) => (
                    <span key={ei} className={cn("truncate rounded px-1 text-[9px] leading-4", ev.type === "session" ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400")}>
                      {ev.label}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-5">
          <p className="font-bold">راهنما و مهلت‌ها</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><span className="size-3 rounded bg-primary/50" /> جلسه منتورینگ</div>
            <div className="flex items-center gap-2"><span className="size-3 rounded bg-amber-500/60" /> مهلت تمرین</div>
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            {data.assignments.filter((a) => a.dueDate).slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-xl bg-amber-500/10 p-3 text-xs">
                <p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground">{a.course.title} • مهلت {faDate(a.dueDate)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= messages ================= */

function MessagesView() {
  const { data, loading, refetch } = useFetch<{ conversations: { partnerId: string; partnerName: string; messages: { id: string; senderId: string; body: string; createdAt: string }[] }[]; contacts: { id: string; name: string }[] }>("/api/student?view=messages");
  const { toast } = useToast();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const conv = data?.conversations.find((c) => c.partnerId === activeConv) || (activeConv ? { partnerId: activeConv, partnerName: data?.contacts.find((c) => c.id === activeConv)?.name || "", messages: [] } : null);
  const meId = useApp((s) => s.user?.id);

  const send = async () => {
    if (!conv || !text.trim()) return;
    setSending(true);
    try {
      await apiPost("/api/student", { action: "send-message", receiverId: conv.partnerId, body: text });
      setText("");
      refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="grid h-[70vh] gap-4 lg:grid-cols-3">
      {/* conversations list */}
      <Card className="border-border bg-card lg:col-span-1">
        <CardContent className="space-y-1 p-3">
          <p className="p-2 text-sm font-bold">گفتگوها</p>
          {data.conversations.map((c) => (
            <button key={c.partnerId} onClick={() => setActiveConv(c.partnerId)} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors", activeConv === c.partnerId ? "bg-primary/15" : "hover:bg-muted/60")}>
              <Avatar className="size-10"><AvatarFallback className="bg-primary/15 font-bold text-primary">{c.partnerName.charAt(0)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.partnerName}</p>
                <p className="truncate text-xs text-muted-foreground">{c.messages[c.messages.length - 1]?.body}</p>
              </div>
            </button>
          ))}
          <p className="p-2 pt-4 text-sm font-bold">شروع گفتگوی جدید</p>
          {data.contacts.filter((c) => !data.conversations.some((cv) => cv.partnerId === c.id)).map((c) => (
            <button key={c.id} onClick={() => setActiveConv(c.id)} className="flex w-full items-center gap-3 rounded-xl p-3 text-right hover:bg-muted/60">
              <Avatar className="size-10"><AvatarFallback className="bg-muted font-bold">{c.name.charAt(0)}</AvatarFallback></Avatar>
              <div><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">شروع گفتگو</p></div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* chat area */}
      <Card className="flex flex-col border-border bg-card lg:col-span-2">
        {!conv ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">یک گفتگو را انتخاب کنید</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Avatar className="size-10"><AvatarFallback className="bg-primary/15 font-bold text-primary">{conv.partnerName.charAt(0)}</AvatarFallback></Avatar>
              <p className="font-bold">{conv.partnerName}</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {conv.messages.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">اولین پیام را بفرستید 👋</p>}
                {conv.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.senderId === meId ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[75%] space-y-1 rounded-2xl px-4 py-2.5 text-sm leading-6", m.senderId === meId ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <p>{m.body}</p>
                      <p className={cn("text-[10px]", m.senderId === meId ? "text-primary-foreground/70" : "text-muted-foreground")}>{faTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 border-t border-border p-3">
              <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="پیام خود را بنویسید..." />
              <Button size="icon" className="shrink-0" onClick={send} disabled={sending} aria-label="ارسال"><Send className="size-4" /></Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ================= support ================= */

function SupportView() {
  const { data, loading, refetch } = useFetch<{ tickets: { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; messages: { id: string; body: string; isStaff: boolean; createdAt: string }[] }[] }>("/api/student?view=tickets");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "GENERAL", priority: "MEDIUM", message: "" });
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});

  const create = async () => {
    setSaving(true);
    try {
      const res = await apiPost<{ message: string }>("/api/student", { action: "create-ticket", ...form });
      toast({ title: "ثبت شد ✅", description: res.message });
      setOpen(false); setForm({ subject: "", category: "GENERAL", priority: "MEDIUM", message: "" });
      refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (ticketId: string) => {
    const message = reply[ticketId];
    if (!message?.trim()) return;
    await apiPost("/api/student", { action: "reply-ticket", ticketId, message }).catch(() => null);
    setReply((r) => ({ ...r, [ticketId]: "" }));
    refetch();
  };

  if (loading || !data) return <ListSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5"><Headphones className="size-4" /> تیکت جدید</Button></DialogTrigger>
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader><DialogTitle>ثبت درخواست پشتیبانی</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>موضوع</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>دسته‌بندی</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">عمومی</SelectItem><SelectItem value="TECHNICAL">فنی</SelectItem>
                      <SelectItem value="BILLING">مالی</SelectItem><SelectItem value="EDUCATION">آموزشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اولویت</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="LOW">کم</SelectItem><SelectItem value="MEDIUM">متوسط</SelectItem><SelectItem value="HIGH">زیاد</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>توضیحات</Label><Textarea rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></div>
              <Button className="w-full glow-accent" onClick={create} disabled={saving || !form.subject || !form.message}>{saving ? "در حال ارسال..." : "ثبت تیکت"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {data.tickets.length === 0 ? (
        <EmptyState icon={<Headphones className="size-6" />} title="تیکتی ثبت نکرده‌اید" desc="هر سوالی دارید، تیم پشتیبانی در کنار شماست." />
      ) : data.tickets.map((t) => (
        <Card key={t.id} className="border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{t.subject}</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} label={faStatus(t.status)} />
                <span className="text-xs text-muted-foreground">{faAgo(t.createdAt)}</span>
              </div>
            </div>
            <div className="space-y-2.5 border-t border-border pt-3">
              {t.messages.map((m) => (
                <div key={m.id} className={cn("max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6", m.isStaff ? "mr-auto bg-primary/10" : "bg-muted")}>
                  <p className="mb-1 text-[10px] font-bold text-primary">{m.isStaff ? "پشتیبانی دی‌صفارا" : "شما"}</p>
                  {m.body}
                </div>
              ))}
            </div>
            {t.status !== "CLOSED" && (
              <div className="flex gap-2">
                <Input value={reply[t.id] || ""} onChange={(e) => setReply((r) => ({ ...r, [t.id]: e.target.value }))} placeholder="پاسخ خود را بنویسید..." />
                <Button size="sm" onClick={() => sendReply(t.id)}>ارسال</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ================= notifications ================= */

function NotificationsView() {
  const { data, loading, refetch } = useFetch<{ notifications: DashData["notifications"] }>("/api/student?view=notifications");
  useEffect(() => {
    apiPost("/api/student", { action: "read-notifications" }).catch(() => null).then(() => refetch());
  }, []);
  if (loading || !data) return <ListSkeleton />;
  const typeIcon: Record<string, React.ReactNode> = {
    COURSE: <BookOpen className="size-4" />, ASSIGNMENT: <ClipboardCheck className="size-4" />,
    SESSION: <CalendarDays className="size-4" />, PAYMENT: <CreditCard className="size-4" />, SYSTEM: <Bell className="size-4" />,
  };
  return (
    <div className="space-y-3">
      {data.notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title="اعلانی ندارید" />
      ) : data.notifications.map((n) => (
        <Card key={n.id} className={cn("border-border", n.isRead ? "bg-card/60" : "bg-primary/5 border-primary/25")}>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{typeIcon[n.type] || <Bell className="size-4" />}</div>
            <div className="flex-1">
              <p className="text-sm font-bold">{n.title}</p>
              {n.body && <p className="mt-1 text-sm leading-6 text-muted-foreground">{n.body}</p>}
              <p className="mt-1.5 text-xs text-muted-foreground">{faAgo(n.createdAt)}</p>
            </div>
            {!n.isRead && <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ================= orders ================= */

function OrdersView() {
  const { data, loading, refetch } = useFetch<{ orders: { id: string; orderNo: string; totalAmount: number; status: string; refId?: string | null; createdAt: string; paidAt?: string | null; items: { title: string; price: number }[] }[]; wallet: { balance: number } | null; transactions: { id: string; type: string; amount: number; description: string; createdAt: string }[] }>("/api/student?view=orders");
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [charging, setCharging] = useState(false);

  const deposit = async () => {
    setCharging(true);
    try {
      const res = await apiPost<{ message: string }>("/api/checkout", { action: "deposit", amount: Number(amount) });
      toast({ title: "شارژ آزمایشی", description: res.message });
      setAmount(""); refetch();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCharging(false);
    }
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-primary/30 bg-gradient-to-l from-primary/10 to-card">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">موجودی کیف پول</p>
            <p className="text-3xl font-extrabold text-primary">{faToman(data.wallet?.balance || 0)}</p>
            <div className="flex gap-2 pt-2">
              <Input dir="ltr" inputMode="numeric" className="text-left" placeholder="مبلغ (تومان)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
              <Button onClick={deposit} disabled={charging || Number(amount) < 100000}>{charging ? "..." : "شارژ کیف پول"}</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <p className="p-5 pb-2 font-bold">تراکنش‌های اخیر</p>
            <div className="max-h-52 space-y-1 overflow-y-auto px-5 pb-5">
              {data.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{faAgo(t.createdAt)}</p>
                  </div>
                  <PnlText value={t.amount} suffix=" ت" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <p className="p-5 pb-3 font-bold">سفارش‌های من</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-y border-border text-xs text-muted-foreground">
                <th className="p-3 text-right font-medium">شماره سفارش</th>
                <th className="p-3 text-right font-medium">اقلام</th>
                <th className="p-3 text-right font-medium">مبلغ</th>
                <th className="p-3 text-right font-medium">وضعیت</th>
                <th className="p-3 text-right font-medium">تاریخ</th>
              </tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="p-3 font-bold" dir="ltr">{toFa(o.orderNo)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{o.items.map((i) => i.title).join("، ")}</td>
                    <td className="p-3">{faToman(o.totalAmount)}</td>
                    <td className="p-3"><StatusBadge status={o.status} label={faStatus(o.status)} /></td>
                    <td className="p-3 text-xs text-muted-foreground">{faDate(o.createdAt)}</td>
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

/* ================= certificates ================= */

function CertificatesView() {
  const { data, loading } = useFetch<{ certificates: { id: string; serial: string; title: string; issuedAt: string }[] }>("/api/student?view=certificates");
  const { toast } = useToast();
  if (loading || !data) return <GridSkeleton />;
  return (
    <div className="space-y-5">
      {data.certificates.length === 0 ? (
        <EmptyState icon={<Award className="size-6" />} title="هنوز گواهینامه‌ای ندارید" desc="با اتمام دوره و قبولی در آزمون پایانی، گواهینامه معتبر دریافت کنید." action={<Button className="mt-2" onClick={() => useApp.getState().goPublic("courses")}>مشاهده دوره‌ها</Button>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.certificates.map((c) => (
            <Card key={c.id} className="overflow-hidden border-primary/30 bg-gradient-to-bl from-primary/10 via-card to-card">
              <CardContent className="space-y-4 p-8 text-center">
                <Award className="mx-auto size-14 text-primary" />
                <p className="text-lg font-extrabold">{c.title}</p>
                <p className="text-xs text-muted-foreground">صادر شده به نام دانشجوی دی‌صفارا • {faDate(c.issuedAt)}</p>
                <p className="rounded-xl bg-muted/60 p-2.5 text-xs" dir="ltr">شماره سری: {toFa(c.serial)}</p>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "دانلود گواهینامه 📄", description: "نسخه PDF (نمایشی) آماده دانلود است." })}>
                  <Receipt className="size-4" /> دانلود نسخه PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= profile & settings ================= */

function ProfileView() {
  const user = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const { data, loading } = useFetch<DashData>("/api/student?view=dashboard");
  const { toast } = useToast();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", bio: user?.bio || "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const result = await apiPost<{ user: NonNullable<typeof user> }>("/api/auth", { action: "update-profile", ...form });
      setUser(result.user, useApp.getState().unreadNotifications, useApp.getState().unreadMessages);
      toast({ title: "پروفایل به‌روزرسانی شد ✅" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <GridSkeleton />;

  return (
    <div className="space-y-6">
      <div className="profile-cover overflow-hidden rounded-2xl border border-white/10">
        <div className="profile-banner"><span>MY PROFILE <span className="text-primary">/</span> D.SAFARA</span></div>
        <div className="flex flex-wrap items-end justify-between gap-5 px-6 pb-6">
          <div className="flex items-end gap-4"><Avatar className="-mt-10 size-24 border-4 border-[#101820] ring-1 ring-primary/40"><AvatarFallback className="bg-[#1c3d37] text-3xl font-black text-primary">{user?.name?.charAt(0)}</AvatarFallback></Avatar><div><p className="text-xl font-black">{user?.name}</p><p className="mt-1 text-xs text-muted-foreground">{user?.role === "MENTOR" ? "منتور آکادمی" : "دانشجوی آکادمی"} · <span dir="ltr">{toFa(user?.phone)}</span></p></div></div>
          <span className="dashboard-pill">حساب کاربری فعال</span>
        </div>
        <div className="grid grid-cols-3 border-t border-white/5 text-center"><div className="p-4"><p className="text-xl font-black">{faNum(data.enrollments.length)}</p><p className="mt-1 text-xs text-muted-foreground">دوره‌ها</p></div><div className="border-x border-white/5 p-4"><p className="text-xl font-black">{faNum(data.stats.totalTrades)}</p><p className="mt-1 text-xs text-muted-foreground">معاملات</p></div><div className="p-4"><p className="text-xl font-black">{faNum(data.certificates.length)}</p><p className="mt-1 text-xs text-muted-foreground">گواهینامه‌ها</p></div></div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <p className="font-bold">ویرایش اطلاعات شخصی</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>نام و نام خانوادگی</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>ایمیل</Label><Input dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="space-y-2"><Label>درباره من</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} /></div>
          <Button className="glow-accent" onClick={save} disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsView() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ emailNotif: true, sessionReminder: true, tradeAlerts: false, twoStep: false });
  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "emailNotif", label: "اعلان‌های ایمیل", desc: "دریافت اطلاع‌رسانی‌های دوره‌ها و تمرین‌ها از طریق ایمیل" },
    { key: "sessionReminder", label: "یادآوری جلسات", desc: "۲۴ ساعت قبل از جلسه منتورینگ پیامک یادآوری ارسال شود" },
    { key: "tradeAlerts", label: "هشدارهای معاملاتی", desc: "اعلان هنگام ثبت معامله جدید در ژورنال" },
    { key: "twoStep", label: "ورود دو مرحله‌ای", desc: "برای هر ورود، کد تایید پیامکی ارسال شود" },
  ];
  return (
    <div className="max-w-2xl space-y-5">
      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <p className="font-bold">تنظیمات اطلاع‌رسانی و امنیت</p>
          {items.map((it) => (
            <div key={it.key} className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-4">
              <div>
                <p className="text-sm font-semibold">{it.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs[it.key]}
                onClick={() => { setPrefs((p) => ({ ...p, [it.key]: !p[it.key] })); toast({ title: "تنظیمات ذخیره شد" }); }}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", prefs[it.key] ? "bg-primary" : "bg-muted-foreground/30")}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all", prefs[it.key] ? "right-0.5" : "right-5.5")} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-2 p-6">
          <p className="font-bold text-destructive">منطقه خطر</p>
          <p className="text-sm text-muted-foreground">حذف حساب تمام داده‌های یادگیری شما را پاک می‌کند. این عمل قابل بازگشت نیست.</p>
          <Button variant="destructive" size="sm" onClick={() => toast({ title: "درخواست حذف ثبت شد", description: "پشتیبانی برای تایید نهایی با شما تماس می‌گیرد.", variant: "destructive" })}>
            درخواست حذف حساب
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
