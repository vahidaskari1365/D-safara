"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { PublicHeader, PublicFooter, AuthDialog, HomePage } from "@/components/dsafara/public-shell";
import {
  CoursesPage, CourseDetailPage, PathsPage, PathDetailPage, MentorsPage, ServicesPage,
  BlogPage, BlogPostPage, ResourcesPage, TestimonialsPage, FaqPage, AboutPage, ContactPage,
  CartPage, CheckoutPage, LegalPage,
} from "@/components/dsafara/public-pages";
import { StudentApp } from "@/components/dsafara/student-dash";
import { AdminApp } from "@/components/dsafara/admin-dash";

function PublicApp() {
  const { publicPage, publicParam } = useApp();

  const page = (() => {
    switch (publicPage) {
      case "home": return <HomePage />;
      case "about": return <AboutPage />;
      case "courses": return <CoursesPage />;
      case "course": return <CourseDetailPage slug={publicParam} />;
      case "paths": return <PathsPage />;
      case "path": return <PathDetailPage slug={publicParam} />;
      case "mentors": return <MentorsPage />;
      case "services": return <ServicesPage />;
      case "blog": return <BlogPage />;
      case "post": return <BlogPostPage slug={publicParam} />;
      case "resources": return <ResourcesPage />;
      case "testimonials": return <TestimonialsPage />;
      case "faq": return <FaqPage />;
      case "contact": return <ContactPage />;
      case "cart": return <CartPage />;
      case "checkout": return <CheckoutPage orderId={publicParam} />;
      case "privacy": return <LegalPage kind="privacy" />;
      case "terms": return <LegalPage kind="terms" />;
      default: return <HomePage />;
    }
  })();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="flex-1">{page}</div>
      <PublicFooter />
    </div>
  );
}

export default function Page() {
  const { user, mode, setUser, setAuthOpen, goPublic } = useApp();
  const [demoMode, setDemoMode] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [demoError, setDemoError] = useState("");
  const switchDemoRole = async (role: "student" | "mentor" | "admin") => {
    setSwitching(true); setDemoError("");
    try {
      const result = await apiPost<{ user: NonNullable<typeof user> }>("/api/auth", { action: "demo-login", role });
      const current = await apiGet<{ unreadNotifications: number; unreadMessages: number }>("/api/auth");
      setUser(result.user, current.unreadNotifications || 0, current.unreadMessages || 0);
      setAuthOpen(false);
      if (role === "admin") useApp.getState().goAdmin("overview");
      else useApp.getState().goStudent("overview");
    } catch (error) {
      setDemoError((error as Error).message);
    } finally {
      setSwitching(false);
    }
  };

  // load session on mount
  useEffect(() => {
    apiGet<{ user: null | { id: string; name: string; phone: string; role: string; avatar: string | null; email: string | null; bio: string | null }; unreadNotifications?: number; unreadMessages?: number; demoMode: boolean }>("/api/auth")
      .then((res) => {
        setDemoMode(res.demoMode);
        if (res.user) {
          setUser(res.user, res.unreadNotifications || 0, res.unreadMessages || 0);
        }
      })
      .catch(() => null);
  }, []);

  // redirect to public if not logged in but trying dashboards
  useEffect(() => {
    if (!user && mode !== "public") {
      setAuthOpen(true);
      goPublic("home");
    }
  }, [user, mode]);

  // scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [mode, user]);

  const app = user && mode === "admin" && user.role === "ADMIN" ? <AdminApp /> : user && mode !== "public" ? <StudentApp /> : <PublicApp />;
  return <>
    {demoMode && <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-amber-300 px-4 py-2 text-center text-xs font-bold leading-5 text-amber-950">
      <span>نسخه نمایشی مشترک · هرکس می‌تواند وارد پنل مدیر شود؛ داده‌ها موقتی‌اند و پرداخت واقعی انجام نمی‌شود. اطلاعات شخصی وارد نکنید.</span>
      <div className="flex gap-1.5" aria-label="تغییر پنل نمایشی">
        {([ ["student", "دانشجو"], ["mentor", "منتور"], ["admin", "مدیر"] ] as const).map(([role, label]) => <button type="button" key={role} disabled={switching} onClick={() => switchDemoRole(role)} className="rounded-md border border-amber-900/30 bg-amber-950/10 px-2.5 py-1 transition-colors hover:bg-amber-950/20 disabled:opacity-50">{label}</button>)}
      </div>
      {demoError && <span role="alert">{demoError}</span>}
    </div>}
    {app}<AuthDialog />
  </>;
}
