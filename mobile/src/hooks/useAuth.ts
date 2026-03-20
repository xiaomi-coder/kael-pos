import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  currentUser: User | null;
  loginUser: string;
  loginPass: string;
  loginError: string;
  isLoggingIn: boolean;
  isRestoring: boolean;

  setLoginUser: (val: string) => void;
  setLoginPass: (val: string) => void;
  handleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  currentUser: null,
  loginUser: "",
  loginPass: "",
  loginError: "",
  isLoggingIn: false,
  isRestoring: true,

  setLoginUser: (val) => set({ loginUser: val }),
  setLoginPass: (val) => set({ loginPass: val }),

  restoreSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        if (profile) {
          set({ currentUser: profile as User });
        }
      }
    } finally {
      set({ isRestoring: false });
    }
  },

  handleLogin: async () => {
    const { loginUser, loginPass } = get();
    if (!loginUser || !loginPass) {
      set({ loginError: "Login va parolni kiriting!" });
      return;
    }
    set({ isLoggingIn: true, loginError: "" });

    try {
      const email = `${loginUser.toLowerCase()}@kael.local`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: loginPass,
      });

      if (authError || !authData.user) {
        set({ loginError: "Login yoki parol noto'g'ri!", isLoggingIn: false });
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      if (profile) {
        set({ currentUser: profile as User, loginError: "", loginPass: "", isLoggingIn: false });
      } else {
        await supabase.auth.signOut();
        set({ loginError: "Foydalanuvchi profili topilmadi!", isLoggingIn: false });
      }
    } catch (err) {
      set({ loginError: "Tizimga ulanishda xatolik! Tarmoqni tekshiring.", isLoggingIn: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, loginUser: "", loginPass: "" });
  },
}));
