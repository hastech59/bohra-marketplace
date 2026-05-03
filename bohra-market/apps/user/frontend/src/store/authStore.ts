import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface AuthStore {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isVendor: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        set({ user: null, token: null });
        // Clear cart on logout
        if (typeof window !== "undefined") {
          localStorage.removeItem("bohra-cart");
        }
      },

      isAuthenticated: () => !!get().token && !!get().user,
      isVendor: () => get().user?.role === "vendor",
      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "bohra-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
