import { create } from "zustand";
import { api } from "@/lib/api";

interface UserProfile {
  college?: string;
  degree?: string;
  department?: string;
  current_year?: number;
  city?: string;
  target_company?: string;
  preferred_job_role?: string;
  experience_level?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  profile_photo_url?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  is_admin: boolean;
  profile?: UserProfile;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (form: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (profileData: UserProfile) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any, get: any) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: any) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/login", credentials);
      const { access_token, refresh_token } = res.data;
      
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      
      // Fetch user profile
      const userRes = await api.get("/auth/me");
      set({ user: userRes.data, isAuthenticated: true });
    } catch (err) {
      set({ user: null, isAuthenticated: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (form: any) => {
    set({ isLoading: true });
    try {
      // Register candidate
      const regRes = await api.post("/auth/register", form);
      
      // Auto login after registration
      await get().login({ email: form.email, password: form.password });
    } catch (err) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      } catch (e) {
        // Suppress errors during logout request
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, isAuthenticated: true });
    } catch (err) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (profileData: any) => {
    try {
      const res = await api.put("/auth/profile", profileData);
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: {
            ...currentUser,
            profile: res.data,
          },
        });
      }
    } catch (err) {
      throw err;
    }
  },
}));
