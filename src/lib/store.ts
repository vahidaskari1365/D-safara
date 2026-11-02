"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionUser = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  avatar: string | null;
  email?: string | null;
  bio?: string | null;
};

export type CartItem = { type: "course" | "product"; slug: string; title: string; price: number };

type AppState = {
  user: SessionUser | null;
  mode: "public" | "student" | "admin";
  publicPage: string;
  publicParam: string;
  studentPage: string;
  adminPage: string;
  adminParam: string;
  authOpen: boolean;
  cart: CartItem[];
  unreadNotifications: number;
  unreadMessages: number;

  setUser: (u: SessionUser | null, unreadN?: number, unreadM?: number) => void;
  setMode: (m: AppState["mode"]) => void;
  goPublic: (page: string, param?: string) => void;
  goStudent: (page: string) => void;
  goAdmin: (page: string, param?: string) => void;
  setAuthOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => boolean;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  refreshCounters: (n: number, m: number) => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      mode: "public",
      publicPage: "home",
      publicParam: "",
      studentPage: "overview",
      adminPage: "overview",
      adminParam: "",
      authOpen: false,
      cart: [],
      unreadNotifications: 0,
      unreadMessages: 0,

      setUser: (u, unreadN = 0, unreadM = 0) => set({ user: u, unreadNotifications: unreadN, unreadMessages: unreadM }),
      setMode: (m) => set({ mode: m }),
      goPublic: (page, param = "") => set({ mode: "public", publicPage: page, publicParam: param }),
      goStudent: (page) => set({ mode: "student", studentPage: page }),
      goAdmin: (page, param = "") => set({ mode: "admin", adminPage: page, adminParam: param }),
      setAuthOpen: (open) => set({ authOpen: open }),
      addToCart: (item) => {
        if (get().cart.some((c) => c.slug === item.slug)) return false;
        set({ cart: [...get().cart, item] });
        return true;
      },
      removeFromCart: (slug) => set({ cart: get().cart.filter((c) => c.slug !== slug) }),
      clearCart: () => set({ cart: [] }),
      refreshCounters: (n, m) => set({ unreadNotifications: n, unreadMessages: m }),
    }),
    {
      name: "dsafara-app",
      partialize: (s) => ({ cart: s.cart }),
    }
  )
);
