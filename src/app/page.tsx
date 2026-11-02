"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { apiGet } from "@/lib/api";
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

  // load session on mount
  useEffect(() => {
    apiGet<{ user: null | { id: string; name: string; phone: string; role: string; avatar: string | null; email: string | null; bio: string | null }; unreadNotifications?: number; unreadMessages?: number }>("/api/auth")
      .then((res) => {
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

  if (user && mode === "admin" && user.role === "ADMIN") return <><AdminApp /><AuthDialog /></>;
  if (user && mode !== "public") return <><StudentApp /><AuthDialog /></>;
  return <><PublicApp /><AuthDialog /></>;
}
